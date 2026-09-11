/**
 * Contraste del texto SOBRE la película.
 *
 * verificar-contraste.mjs comprueba pares de tokens fijos, y con un fondo de
 * color plano eso basta. Con una toma de vídeo detrás ya no: el fondo de un
 * párrafo cambia 480 veces mientras el visitante baja, y el peor caso —el
 * frasco blanco a pantalla completa— no aparece en ninguna tabla de tokens.
 *
 * Así que se mide sobre píxeles de verdad: se oculta el contenido, se captura
 * el fondo compuesto (fotograma + velo + grano), y se calcula el contraste de
 * cada bloque de texto contra la luminancia media de SU caja, en varios puntos
 * del recorrido. Lo que se reporta es el peor caso encontrado.
 *
 *   npm run dev                        (en otra terminal)
 *   npm run verificar:contraste-pelicula
 */
import { chromium } from "playwright";

/* La captura se mide DENTRO del navegador: se le pasa como data URL, la
   dibuja en un canvas y lee los píxeles con getImageData. Decodificar el PNG
   aquí fuera obligaría a añadir una dependencia solo para esto, y el
   decodificador ya venía incluido. */

const BASE = process.env.BASE ?? "http://localhost:3000";
const RUTA = process.argv[2] ?? "/";
/* Cuerpo y metadatos: 4.5:1. Los titulares son texto grande y les basta 3:1,
   pero se miden igual para saber con cuánto margen pasan. */
const SELECTORES = [
  [".cuerpo, .cuerpo-lg, p", 4.5],
  [".etiqueta, .mono-sm", 4.5],
  [".display-xl, .display-lg, .display-md, .titulo, h1, h2, h3", 3],
];

const canal = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const nav = await chromium.launch();
let peor = null;
const fallos = [];

/* Estudio y papel, escritorio y móvil. En móvil cada tramo va a todo el ancho
   y cruza el frasco, que en escritorio queda al lado. Sobre papel la toma se
   revela en clave alta y la tinta es oscura: es otro par entero. */
for (const tema of ["oscuro", "claro"])
for (const [VW, VH] of [[1440, 900], [390, 844]]) {
const ctx = await nav.newContext({ viewport: { width: VW, height: VH }, colorScheme: "dark" });
await ctx.addInitScript((t) => localStorage.setItem("lf_a11y", JSON.stringify({ tema: t })), tema);
const p = await ctx.newPage();
await p.goto(BASE + RUTA, { waitUntil: "networkidle" });
await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
await p.waitForTimeout(6000);

const alto = await p.evaluate(() => document.documentElement.scrollHeight);

/* El reposo de cada tramo y del cierre, y los dos fundidos del velo —al salir
   de la apertura y al entrar en el cierre—, que es donde texto de una sección
   y película a medio velar coinciden. */
const reposos = await p.evaluate(() => {
  const vh = innerHeight;
  const ys = [...document.querySelectorAll("[data-tramo]")].slice(1).map((t) => {
    const b = t.firstElementChild.firstElementChild.getBoundingClientRect();
    return b.top + scrollY + b.height / 2 - vh / 2;
  });
  const z = document.getElementById("pelicula-zona");
  if (z) {
    const fin = z.getBoundingClientRect().bottom + scrollY - vh;
    ys.push(fin + vh * 0.15, fin + vh * 0.3, fin + vh * 0.45);
  }
  const c = document.getElementById("zona-final");
  if (c) {
    const top = c.getBoundingClientRect().top + scrollY;
    ys.push(top - vh * 0.45, top - vh * 0.3, top - vh * 0.15, top + (c.offsetHeight - vh) / 2);
  }
  return ys;
});
const puntos = [0, ...reposos.map((y) => y / (alto - VH)), 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
for (const f of puntos) {
  await p.evaluate((y) => window.scrollTo(0, y), (alto - VH) * f);
  await p.waitForTimeout(1800);

  /* Las cajas y el color de tinta se leen CON el texto visible. */
  const bloques = await p.evaluate((sels) => {
    const salida = [];
    for (const [sel, minimo] of sels) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width < 40 || r.height < 8 || r.bottom < 0 || r.top > innerHeight) continue;
        /* Se mide solo lo que el visitante puede ver: por debajo del chrome
           fijo de arriba y dentro de la ventana. Un bloque que se está yendo
           por arriba queda debajo del nav —tapado, no ilegible—, y medirlo
           daba un fallo falso a 3,5:1 en móvil. Si más de la mitad del bloque
           está oculto, se salta: se mide en otro punto del recorrido. */
        const techo = [...document.querySelectorAll("header")]
          .filter((h) => getComputedStyle(h).position === "fixed")
          .reduce((m, h) => Math.max(m, h.getBoundingClientRect().bottom), 0);
        const arriba = Math.max(r.top, techo), abajo = Math.min(r.bottom, innerHeight);
        if (abajo - arriba < r.height * 0.5) continue;
        /* Y en horizontal igual. Las pestañas de la tira que aún no han
           entrado por la derecha están fuera de la ventana; medirlas leía
           píxeles de fuera de la captura —negro transparente— y daba fallos
           falsos a 3,37:1 sobre papel. */
        const izquierda = Math.max(r.left, 0), derecha = Math.min(r.right, innerWidth);
        if (derecha - izquierda < r.width * 0.5) continue;
        const t = (el.innerText || "").trim();
        if (!t) continue;
        const s = getComputedStyle(el);
        if (s.visibility === "hidden") continue;
        /* Opacidad EFECTIVA: la de sus ancestros también. Un párrafo a
           opacidad 1 dentro de un bloque a 0 —revelado a medias— no se ve, y
           se medirá en otro punto del recorrido, ya revelado. */
        let op = 1;
        for (let a = el; a; a = a.parentElement) op *= Number(getComputedStyle(a).opacity);
        if (op < 0.9) continue;
        /* Lo decorativo no se mide. Las láminas son maquetas de landing
           dibujadas en DOM —el lector de pantalla las ignora, y su paleta es
           la del cliente simulado, no la del sistema—, así que exigirles el
           piso del producto es medir la cosa equivocada. */
        if (el.closest('[aria-hidden="true"]')) continue;
        /* El color se resuelve pintándolo: la regex de rgb() leía oklab(0.97 0 0
           / 0.65) como casi negro y daba fallos falsos. */
        const cv = document.createElement("canvas"); cv.width = cv.height = 1;
        const cx = cv.getContext("2d");
        cx.fillStyle = s.color; cx.fillRect(0, 0, 1, 1);
        const [cr, cg, cb, ca] = cx.getImageData(0, 0, 1, 1).data;
        salida.push({
          minimo, rgba: [cr, cg, cb, ca / 255], texto: t.slice(0, 34).replace(/\s+/g, " "),
          x: Math.max(0, Math.round(r.x)), y: Math.round(arriba),
          w: Math.round(Math.min(r.width, innerWidth - Math.max(0, r.x))),
          h: Math.round(abajo - arriba),
        });
      }
    }
    return salida;
  }, SELECTORES);

  /* El fondo se captura sin los GLIFOS, no sin el contenido. Ocultar `main`
     entero medía la película por detrás de las láminas y las tarjetas, que
     tienen superficie propia, y devolvía treinta fallos falsos. Poniendo la
     tinta transparente se conserva todo lo que hay debajo de cada letra
     —película, velo, vidrio o lámina— que es exactamente el fondo contra el
     que hay que medir. */
  await p.addStyleTag({
    content: "*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important}",
  });
  const captura = (await p.screenshot()).toString("base64");
  const medias = await p.evaluate(async ({ captura, bloques }) => {
    const img = new Image();
    img.src = "data:image/png;base64," + captura;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(img, 0, 0);
    /* La captura viene en píxeles físicos; las cajas, en lógicos. */
    const k = img.naturalWidth / window.innerWidth;
    const canal = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return bloques.map((b) => {
      const x = Math.round(b.x * k), y = Math.round(b.y * k);
      const w = Math.max(1, Math.round(b.w * k)), h = Math.max(1, Math.round(b.h * k));
      const d = g.getImageData(x, y, w, h).data;
      let s = 0, n = 0;
      for (let i = 0; i < d.length; i += 16) {
        s += 0.2126 * canal(d[i]) + 0.7152 * canal(d[i + 1]) + 0.0722 * canal(d[i + 2]); n++;
      }
      return n ? s / n : null;
    });
  }, { captura, bloques });
  await p.evaluate(() => document.querySelectorAll("style").forEach((n) => {
    if (n.textContent.includes("-webkit-text-fill-color:transparent")) n.remove();
  }));

  for (let i = 0; i < bloques.length; i++) {
    const b = bloques[i];
    const fondo = medias[i];
    if (fondo == null) continue;
    /* Texto semitransparente: se compone sobre el fondo medido. La media de
       luminancia vuelve a canal aproximado para mezclar en sRGB. */
    const [r, g, bl, al] = b.rgba;
    const fondoCanal = 255 * (fondo <= 0.0031308 ? fondo * 12.92 : 1.055 * fondo ** (1 / 2.4) - 0.055);
    const mezcla = (c) => al * c + (1 - al) * fondoCanal;
    const c = ratio(lum(mezcla(r), mezcla(g), mezcla(bl)), fondo);
    const dato = { ...b, contraste: Number(c.toFixed(2)), en: `${tema} ${VW}px ${Math.round(f * 100)}%` };
    if (!peor || c < peor.contraste) peor = dato;
    if (c < b.minimo) fallos.push(dato);
  }
}
await p.close();
}
await nav.close();

const unicos = [...new Map(fallos.map((f) => [f.texto + f.en, f])).values()];
console.log(`\nPeor caso global: ${peor?.contraste}:1  ·  «${peor?.texto}»  al ${peor?.en}\n`);
if (!unicos.length) {
  console.log("Todo el texto sobre la película pasa su piso.\n");
  process.exit(0);
}
console.log(`${unicos.length} bloques por debajo del piso:\n`);
for (const f of unicos.sort((a, b) => a.contraste - b.contraste).slice(0, 20)) {
  console.log(`  ${String(f.contraste).padStart(5)}:1  (min ${f.minimo})  ${f.en.padStart(11)}  «${f.texto}»`);
}
console.log("");
process.exit(1);
