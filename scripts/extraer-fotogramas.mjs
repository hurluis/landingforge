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
import {
  createReadStream,
  statSync,
  mkdirSync,
  rmSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, join } from "node:path";

const ORIGEN =
  process.argv[2] ?? "/Users/santiago/Downloads/WhatsApp Video 2026-09-09 at 07.59.09.mp4";
/* Una sola fuente de verdad: el componente declara cuántos fotogramas
   consume, y este script genera exactamente esos. */
const componente = readFileSync(
  resolve(import.meta.dirname, "../components/mundo/film.ts"),
  "utf8",
);
const declarados = Number(componente.match(/TOTAL_FOTOGRAMAS\s*=\s*(\d+)/)?.[1] ?? 120);
const CUADROS = Number(process.argv[3] ?? declarados);
const ALTO = Number(process.argv[4] ?? 450);
const CALIDAD = Number(process.argv[5] ?? 82);
/* `--solo-ritmo` recalcula la curva sobre los fotogramas ya generados. Extraer
   240 lleva minutos y ajustar el reparto no los necesita de nuevo. */
const SOLO_RITMO = process.argv.includes("--solo-ritmo");

const SALIDA = resolve(import.meta.dirname, "../public/film");
const PUERTO = 8799;

const tam = SOLO_RITMO ? 0 : statSync(ORIGEN).size;
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
if (!SOLO_RITMO) await new Promise((r) => srv.listen(PUERTO, r));

if (!SOLO_RITMO) rmSync(SALIDA, { recursive: true, force: true });
if (!SOLO_RITMO) mkdirSync(SALIDA, { recursive: true });

if (!SOLO_RITMO) {
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
}

/* PNG a JPEG con `sips`, que viene en macOS: un PNG de fotografía pesa cinco
   veces más que su JPEG y aquí no hay transparencia que conservar. */
if (!SOLO_RITMO) for (const f of readdirSync(SALIDA).filter((f) => f.endsWith(".png"))) {
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
    ` · ${Math.round(bytes / jpgs.length / 1024)} KB de media`,
);

/* ================================================================
   LA CURVA DE RITMO

   Repartir el scroll a partes iguales por fotograma parece lo natural y es
   justo lo que hace que no se vea fluido: el film no se mueve a ritmo
   constante. Tiene una ráfaga con un corte duro en el primer 10% y tramos
   casi estáticos después, así que con reparto lineal la acción pasa en
   trescientos píxeles y lo quieto se arrastra durante miles.

   Aquí se mide cuánto cambia CADA fotograma respecto del anterior y se
   reparte el scroll proporcionalmente a ese cambio: donde el film se mueve
   mucho se le da mucho recorrido, y donde está quieto se pasa rápido. El
   resultado es velocidad percibida constante, que es lo que el ojo lee como
   fluidez.

   Los picos se topan antes de acumular. Sin tope, el corte duro se llevaría
   él solo una cuarta parte del scroll de la portada.
   ================================================================ */
const srvFrames = createServer((req, res) => {
  const nombre = (req.url ?? "/").split("?")[0].replace(/^\//, "");
  /* Una página vacía en la raíz. Sin esto la medición corre en `about:blank`
     y cada <img> a este servidor es de otro origen: falla, se cuenta como
     diferencia cero, y la curva sale perfectamente lineal sin que nada avise. */
  if (nombre === "") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<!doctype html><title>ritmo</title>");
    return;
  }
  try {
    const datos = readFileSync(join(SALIDA, nombre));
    res.writeHead(200, { "Content-Type": "image/jpeg" });
    res.end(datos);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => srvFrames.listen(PUERTO + 1, r));

const nav2 = await chromium.launch();
const pag2 = await nav2.newPage();
await pag2.goto(`http://127.0.0.1:${PUERTO + 1}/`);
const diferencias = await pag2.evaluate(
  async ({ n, puerto }) => {
    const W = 96;
    const H = 42;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const x = c.getContext("2d", { willReadFrequently: true });
    const leer = (i) =>
      new Promise((r) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => {
          x.drawImage(im, 0, 0, W, H);
          r(x.getImageData(0, 0, W, H).data);
        };
        im.onerror = () => r(null);
        im.src = `http://127.0.0.1:${puerto}/${String(i).padStart(3, "0")}.jpg`;
      });

    const salida = [];
    let ant = await leer(0);
    for (let i = 1; i < n; i++) {
      const act = await leer(i);
      if (!act || !ant) {
        salida.push(0);
        continue;
      }
      let s = 0;
      for (let k = 0; k < act.length; k += 4) {
        s += Math.abs(act[k] - ant[k]) + Math.abs(act[k + 1] - ant[k + 1]) + Math.abs(act[k + 2] - ant[k + 2]);
      }
      salida.push(s / (act.length / 4) / 3);
      ant = act;
    }
    return salida;
  },
  { n: CUADROS, puerto: PUERTO + 1 },
);
await nav2.close();
srvFrames.close();

if (diferencias.every((d) => d === 0)) {
  throw new Error(
    "La medición de ritmo devolvió todo ceros: no se pudo leer ni un fotograma.\n" +
      "  Sin esto la curva sale lineal y el reparto vuelve a ser el que no se ve fluido.",
  );
}

const ordenadas = [...diferencias].sort((a, b) => a - b);
const mediana = ordenadas[Math.floor(ordenadas.length / 2)] || 1;
/* Suelo para que un tramo idéntico no se salte de golpe, y techo para que un
   corte no se coma el scroll entero. */
/* El techo alto es deliberado. Un corte duro entre dos tomas no se puede
   suavizar repartiendo poco scroll: los dos fotogramas son imágenes
   distintas y el salto es el salto. Dándole mucho recorrido, la mezcla se
   estira y el corte deja de leerse como fallo para leerse como encadenado,
   que es una transición de cine. El suelo evita que un tramo idéntico se
   salte de golpe. */
const pesos = diferencias.map((d) => Math.min(Math.max(d, mediana * 0.35), mediana * 14));

const acumulado = [0];
for (const p of pesos) acumulado.push(acumulado[acumulado.length - 1] + p);
const totalPeso = acumulado[acumulado.length - 1];
const curva = acumulado.map((a) => Number((a / totalPeso).toFixed(5)));

writeFileSync(
  resolve(import.meta.dirname, "../components/mundo/ritmo.ts"),
  `/* GENERADO POR scripts/extraer-fotogramas.mjs — no editar a mano.
 *
 * Reparto del scroll por CAMBIO VISUAL en vez de por índice de fotograma.
 *
 * \`RITMO[i]\` es la fracción de scroll a la que le toca estar el fotograma i.
 * Como el film no se mueve a ritmo constante —tiene una ráfaga con corte duro
 * al principio y tramos casi quietos después—, repartir a partes iguales hace
 * que la acción pase demasiado rápido y lo quieto se arrastre. Con esta curva
 * la velocidad percibida es constante.
 *
 * Medido sobre los propios fotogramas: diferencia media de color respecto del
 * anterior, con suelo y techo para que ni un tramo idéntico se salte de golpe
 * ni un corte se lleve el scroll entero.
 */
export const RITMO: readonly number[] = ${JSON.stringify(curva)};
`,
);
console.log(`  curva de ritmo escrita · mediana de cambio ${mediana.toFixed(2)}\n`);
