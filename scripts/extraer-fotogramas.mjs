/**
 * Convierte el film de producto en la secuencia de fotogramas que consume la
 * portada.
 *
 * El mundo ya no dibuja geometría en tiempo real: dibuja este film, y el
 * scroll decide qué fotograma se ve. Es la técnica de las páginas de producto
 * de Apple, y la razón de usar imágenes sueltas en vez de un `<video>` con
 * `currentTime` es una sola: **buscar dentro de un H.264 salta al fotograma
 * clave más cercano**. Con claves cada uno o dos segundos, arrastrar el scroll
 * produce tirones y un vídeo que se queda atrás. Una imagen por posición no
 * tiene ese problema: siempre hay exactamente el fotograma que toca.
 *
 * ── El recorte ──────────────────────────────────────────────────────────
 * El original es 1024×576 y lleva la marca de agua del modelo generativo —un
 * destello— fija en x 904..954, y 456..506. Recortando a 1024×450 desaparece
 * sin retoque y de paso el encuadre queda en 2.28:1, que se lee como cine en
 * vez de como vídeo de stock. La pérdida es la franja inferior, que en las
 * cuatro tomas es suelo o mano y no información.
 *
 * ── Por qué Chrome y no Chromium ────────────────────────────────────────
 * El Chromium que trae Playwright se compila sin códecs propietarios, así que
 * no abre un H.264 y el vídeo nunca llega a `readyState >= 2`. El Chrome del
 * sistema sí. Y el archivo se sirve por HTTP en vez de por `file://` porque
 * desde una página `about:blank` el vídeo local no carga.
 *
 *   node scripts/extraer-fotogramas.mjs                          por defecto
 *   node scripts/extraer-fotogramas.mjs ruta.mp4 120 450         a medida
 */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { createReadStream, statSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";

const ORIGEN =
  process.argv[2] ?? "/Users/santiago/Downloads/WhatsApp Video 2026-09-09 at 07.59.09.mp4";
const CUADROS = Number(process.argv[3] ?? 120);
const ALTO = Number(process.argv[4] ?? 450);
const CALIDAD = Number(process.argv[5] ?? 62);

const SALIDA = resolve(import.meta.dirname, "../public/film");
const PUERTO = 8799;

const tam = statSync(ORIGEN).size;
const srv = createServer((req, res) => {
  const rango = req.headers.range;
  if (rango) {
    const [a, b] = rango.replace("bytes=", "").split("-");
    const desde = Number(a);
    const hasta = b ? Number(b) : tam - 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${desde}-${hasta}/${tam}`,
      "Accept-Ranges": "bytes",
      "Content-Length": hasta - desde + 1,
      "Content-Type": "video/mp4",
    });
    createReadStream(ORIGEN, { start: desde, end: hasta }).pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": tam,
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
    });
    createReadStream(ORIGEN).pipe(res);
  }
});
await new Promise((r) => srv.listen(PUERTO, r));

rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });

const navegador = await chromium.launch({ channel: "chrome" });
const pagina = await navegador.newPage({ viewport: { width: 1400, height: 1000 } });
await pagina.setContent(
  `<body style="margin:0;background:#000">
     <video id="v" src="http://127.0.0.1:${PUERTO}/film.mp4" muted preload="auto"></video>
   </body>`,
);
await pagina.waitForFunction(() => document.getElementById("v")?.readyState >= 2, null, {
  timeout: 60000,
});

const meta = await pagina.evaluate(() => {
  const v = document.getElementById("v");
  return { dur: v.duration, w: v.videoWidth, h: v.videoHeight };
});
console.log(`\n  origen: ${meta.w}×${meta.h} · ${meta.dur.toFixed(1)}s`);
console.log(`  salida: ${meta.w}×${ALTO} · ${CUADROS} fotogramas · JPEG q${CALIDAD}\n`);

await pagina.setViewportSize({ width: meta.w, height: meta.h });
await pagina.evaluate((m) => {
  const v = document.getElementById("v");
  v.style.display = "block";
  v.style.width = `${m.w}px`;
  v.style.height = `${m.h}px`;
}, meta);

for (let i = 0; i < CUADROS; i++) {
  /* El 0.995 evita pedir exactamente `duration`, que en algunos contenedores
     no tiene fotograma y deja el lienzo con el anterior. */
  const t = ((meta.dur * i) / (CUADROS - 1)) * 0.995;
  await pagina.evaluate(
    (t) =>
      new Promise((res) => {
        const v = document.getElementById("v");
        v.onseeked = () => res();
        v.currentTime = t;
      }),
    t,
  );
  await pagina.waitForTimeout(120);
  await pagina.screenshot({
    path: join(SALIDA, `${String(i).padStart(3, "0")}.png`),
    clip: { x: 0, y: 0, width: meta.w, height: ALTO },
  });
  if ((i + 1) % 20 === 0) process.stdout.write(`  ${i + 1}/${CUADROS}\n`);
}

await navegador.close();
srv.close();

/* PNG a JPEG con `sips`, que viene en macOS: un PNG de fotografía pesa cinco
   veces más que su JPEG y aquí no hay transparencia que conservar. */
for (const f of readdirSync(SALIDA).filter((f) => f.endsWith(".png"))) {
  const png = join(SALIDA, f);
  execFileSync("sips", [
    "-s", "format", "jpeg",
    "-s", "formatOptions", String(CALIDAD),
    png,
    "--out", png.replace(/\.png$/, ".jpg"),
  ], { stdio: "ignore" });
  rmSync(png);
}

const jpgs = readdirSync(SALIDA).filter((f) => f.endsWith(".jpg"));
const bytes = jpgs.reduce((n, f) => n + statSync(join(SALIDA, f)).size, 0);
console.log(
  `\n  ${jpgs.length} fotogramas · ${(bytes / 1024 / 1024).toFixed(2)} MB en total` +
    ` · ${Math.round(bytes / jpgs.length / 1024)} KB de media\n`,
);
