/**
 * Captura la página para poder revisarla de verdad.
 *
 * La v1 se construyó sin ver ni un píxel del resultado, y eso es exactamente
 * lo que produjo una página tímida. Esto lo arregla: con coreografía de scroll,
 * mirar solo el estado inicial no sirve de nada, así que el modo por defecto
 * recorre la página y captura fotogramas a lo largo del recorrido.
 *
 *   node scripts/mirar.mjs                      recorrido de la home, escritorio
 *   node scripts/mirar.mjs /precios             otra ruta
 *   node scripts/mirar.mjs / movil              360x800 con emulacion tactil
 *   node scripts/mirar.mjs / escritorio 12      numero de fotogramas del recorrido
 */
import { chromium } from "playwright";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const [ruta = "/", dispositivo = "escritorio", cuadros = "8"] = process.argv.slice(2);

const VISTAS = {
  escritorio: { width: 1440, height: 900, isMobile: false },
  movil: { width: 390, height: 844, isMobile: true },
};

const vista = VISTAS[dispositivo] ?? VISTAS.escritorio;
const total = Number(cuadros);
const SALIDA = resolve(import.meta.dirname, "../.capturas");
const BASE = process.env.BASE ?? "http://localhost:3000";

rmSync(SALIDA, { recursive: true, force: true });
mkdirSync(SALIDA, { recursive: true });

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  viewport: { width: vista.width, height: vista.height },
  deviceScaleFactor: 1,
  isMobile: vista.isMobile,
  hasTouch: vista.isMobile,
  colorScheme: "dark",
});

const pagina = await contexto.newPage();

const problemas = [];
pagina.on("console", (m) => {
  if (m.type() === "error") problemas.push(`consola: ${m.text().slice(0, 200)}`);
});
pagina.on("pageerror", (e) => problemas.push(`excepcion: ${String(e).slice(0, 200)}`));

const url = `${BASE}${ruta}`;
await pagina.goto(url, { waitUntil: "networkidle", timeout: 60000 });
await pagina.waitForTimeout(1200); // que corra la obertura del hero

const nombre = ruta.replace(/[^\w]/g, "_") || "home";
const alturaTotal = await pagina.evaluate(() => document.documentElement.scrollHeight);
const pantallas = alturaTotal / vista.height;

/* Recorrido: se scrollea en pasos y se espera a que la coreografía asiente.
   Un solo screenshot del tope no dice nada de una página con scrub. */
let anterior = 0;
for (let i = 0; i < total; i++) {
  const y = Math.round((alturaTotal - vista.height) * (i / Math.max(1, total - 1)));
  /* Se recorre en pasos pequeños hasta el destino, no de un salto: los
     reveals de `once: true` solo disparan si el elemento pasa de verdad por
     el viewport, igual que le pasa a una persona scrolleando. */
  for (let v = anterior; v < y; v += 400) {
    await pagina.evaluate((d) => window.scrollTo({ top: d, behavior: "instant" }), v);
    await pagina.waitForTimeout(70);
  }
  anterior = y;
  await pagina.evaluate((destino) => window.scrollTo({ top: destino, behavior: "instant" }), y);
  await pagina.waitForTimeout(900);
  await pagina.screenshot({
    path: resolve(SALIDA, `${nombre}-${dispositivo}-${String(i).padStart(2, "0")}.png`),
  });
}

/* Vuelta arriba para el estado de reposo. */
await pagina.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
await pagina.waitForTimeout(600);

/* Chequeos que no dependen del ojo. */
const diagnostico = await pagina.evaluate(() => {
  const doc = document.documentElement;
  const anchoDesborde = doc.scrollWidth > doc.clientWidth + 1;
  const culpables = [];
  if (anchoDesborde) {
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.right > doc.clientWidth + 1 && r.width > 0) {
        culpables.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)}`);
        if (culpables.length >= 5) break;
      }
    }
  }
  const h1 = document.querySelectorAll("h1");
  const emDash = document.body.innerText.includes("—");
  return {
    desbordeHorizontal: anchoDesborde,
    culpables,
    cantidadH1: h1.length,
    tamanoH1: h1[0] ? getComputedStyle(h1[0]).fontSize : null,
    fuenteH1: h1[0] ? getComputedStyle(h1[0]).fontFamily : null,
    fondoBody: getComputedStyle(document.body).backgroundColor,
    emDashEnTexto: emDash,
    alturaDocumento: doc.scrollHeight,
  };
});

await navegador.close();

console.log(`Capturas de ${url} (${dispositivo}) en .capturas/`);
console.log(`  altura: ${alturaTotal}px  ·  ${pantallas.toFixed(1)} pantallas  ·  ${total} fotogramas`);
console.log(`  h1: ${diagnostico.cantidadH1} · ${diagnostico.tamanoH1} · ${diagnostico.fuenteH1}`);
console.log(`  fondo: ${diagnostico.fondoBody}`);
if (diagnostico.desbordeHorizontal) {
  console.log(`  DESBORDE HORIZONTAL. Sospechosos: ${diagnostico.culpables.join(", ")}`);
}
if (diagnostico.emDashEnTexto) console.log("  HAY EM-DASHES EN EL TEXTO VISIBLE");
if (problemas.length > 0) {
  console.log("  problemas de runtime:");
  for (const p of [...new Set(problemas)].slice(0, 8)) console.log(`    ${p}`);
}
