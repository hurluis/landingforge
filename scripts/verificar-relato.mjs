/**
 * El relevo entre tramos del relato.
 *
 * El relato clava el texto en pantalla y usa el scroll como reloj, compartido
 * con la película. Entre dos tramos hay un instante en que solo se ve la toma
 * —la respiración—, y eso es deliberado: solapar los bloques para taparlo
 * produce dos titulares superpuestos e ilegibles.
 *
 * Lo que sí sería un fallo es que esa respiración se hiciera larga: entonces
 * deja de leerse como una pausa y pasa a leerse como que la página se colgó.
 * Esto la mide en píxeles de scroll y falla si se pasa del techo.
 *
 *   npm run dev                 (en otra terminal)
 *   npm run verificar:relato
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
/* Techo: una pantalla de 900 px se recorre en unos tres golpes de rueda, así
   que 220 px es cerca de un golpe. Más que eso ya se nota como vacío. */
const TECHO_PX = 220;
const PASOS = 240;

const nav = await chromium.launch();
const p = await (await nav.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto(BASE, { waitUntil: "networkidle" });
await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await p.waitForTimeout(5000);

const geo = await p.evaluate(() => {
  const pista = document.querySelector("main > div");
  return { top: pista.getBoundingClientRect().top + scrollY, alto: pista.offsetHeight, vh: innerHeight };
});
const recorrido = geo.alto - geo.vh;

/* Cada tramo tiene que CABER. Van clavados en la pantalla, así que lo que se
   sale por arriba o por abajo no se puede alcanzar con scroll: simplemente no
   existe. Es el fallo más fácil de introducir al añadir una línea de copy. */
const NAV = 64;
const desbordes = await p.evaluate((nav) => {
  const bloques = [...document.querySelectorAll("main > div > div > div")];
  return bloques.map((b, i) => {
    const hijo = b.firstElementChild ?? b;
    return { i, alto: Math.round(hijo.getBoundingClientRect().height), util: innerHeight - nav };
  }).filter((x) => x.alto > x.util);
}, NAV);
if (desbordes.length) {
  console.log("\nTramos que no caben en la pantalla:");
  for (const d of desbordes) console.log(`  tramo ${d.i}: ${d.alto} px de alto, caben ${d.util}`);
} else {
  console.log("\nLos cinco tramos caben en la pantalla.");
}

let dentro = 0, mayor = 0, minima = 1;
for (let i = 0; i <= PASOS; i++) {
  await p.evaluate((y) => window.scrollTo(0, y), geo.top + (recorrido * i) / PASOS);
  await p.waitForTimeout(45);
  const op = await p.evaluate(() =>
    Math.max(0, ...[...document.querySelectorAll("main > div > div > div")]
      .map((b) => Number(getComputedStyle(b).opacity))));
  minima = Math.min(minima, op);
  /* «Sin texto» = ningún bloque llega a un tercio de opacidad. */
  if (op < 0.34) { dentro++; mayor = Math.max(mayor, dentro); } else { dentro = 0; }
}

const px = Math.round((mayor * recorrido) / PASOS);
console.log(`\nRespiración más larga entre tramos: ${px} px de scroll (techo ${TECHO_PX})`);
console.log(`Opacidad mínima vista en todo el recorrido: ${minima.toFixed(2)}\n`);
await nav.close();
if (desbordes.length) {
  console.log("Acorta el copy o baja el tamaño del titular del tramo.\n");
  process.exit(1);
}
if (px > TECHO_PX) {
  console.log("Demasiado larga: baja `cruce` en components/motion/relato.tsx.\n");
  process.exit(1);
}
console.log("El relevo entre tramos es un gesto, no un tramo muerto.\n");
