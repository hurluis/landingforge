/**
 * La apertura: que cada capítulo caiga en su acto, y que nada se pise.
 *
 * La apertura depende de una cuenta que no se ve: la zona mide tres pantallas
 * y dos pasillos, y la película reparte sus 480 fotogramas sobre ella. Si
 * alguien añade un párrafo a un capítulo o acorta un pasillo, la cuenta se
 * mueve y el primer plano de la marca deja de coincidir con la metodología
 * —sin que falle nada, sin un error en consola—. Esto lo mide.
 *
 *   npm run dev                    (en otra terminal)
 *   npm run verificar:apertura
 *
 * Comprueba:
 *   1. Cada capítulo, entero en pantalla, enseña un fotograma de su acto, y
 *      la línea de tiempo dice ese mismo fotograma.
 *   2. Las cuatro esquinas de cada capítulo no se solapan entre sí, ni con
 *      los botones flotantes.
 *   3. Cada grupo del titular es una sola línea visual (si envuelve, la
 *      máscara ya no corta por línea y el revelado pierde el escalonado).
 *   4. Al salir de la zona la línea de tiempo se va; en móvil no hay scroll
 *      horizontal.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";
const ACTOS = { hero: [0, 39], metodo: [200, 359], llevas: [360, 479] };

let fallos = 0, n = 0;
const ok = (c, d, extra = "") => {
  n++;
  if (c) console.log(`  OK    ${d}`);
  else { fallos++; console.log(`  FALLA ${d}${extra ? ` — ${extra}` : ""}`); }
};

const nav = await chromium.launch();

async function pagina(ancho, alto) {
  const p = await (await nav.newContext({ viewport: { width: ancho, height: alto } })).newPage();
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await p.waitForTimeout(3500);
  return p;
}

const solapan = (a, b) =>
  a && b && !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);

/* ---------- 1 y 2 · escritorio ---------- */
for (const [ancho, alto] of [[1440, 900], [1280, 720]]) {
  console.log(`\n${ancho}×${alto}`);
  const p = await pagina(ancho, alto);

  for (const [id, [min, max]] of Object.entries(ACTOS)) {
    /* Se para con el capítulo entero en pantalla: su borde inferior en el
       inferior de la ventana (el hero ya lo está en y=0). */
    const y = await p.evaluate((id) => {
      const s = id === "hero"
        ? document.querySelector('[aria-labelledby="hero-titulo"]')
        : document.getElementById(id);
      const r = s.getBoundingClientRect();
      return id === "hero" ? 0 : Math.max(0, r.bottom + window.scrollY - window.innerHeight);
    }, id);
    await p.evaluate((v) => window.scrollTo(0, v), y);
    await p.waitForTimeout(1600);

    /* textContent y no innerText: innerText aplica el `uppercase` del CSS y
       devuelve «TOMA 01», que no es lo que está en el DOM. */
    const hud = await p.evaluate(() => {
      const t = [...document.querySelectorAll("[data-decorativo]")].find((e) => e.textContent.includes("Toma 01"));
      const m = t?.textContent.match(/Toma 01 · (\d{4})/);
      return m ? Number(m[1]) - 1 : null;
    });
    ok(hud !== null && hud >= min && hud <= max,
      `«${id}» cae en su acto (fotogramas ${min}–${max})`, `fotograma ${hud}`);

    /* Esquinas: bloques directos de las dos filas del capítulo. */
    const cajas = await p.evaluate((id) => {
      const s = id === "hero"
        ? document.querySelector('[aria-labelledby="hero-titulo"]')
        : document.getElementById(id);
      const filas = [...s.children];
      const rect = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom }; };
      const bloques = filas.flatMap((f) => [...f.children].map(rect));
      const flotantes = [...document.querySelectorAll("button")]
        .filter((b) => getComputedStyle(b).position === "fixed" && b.offsetWidth > 0)
        .map(rect);
      return { bloques, flotantes };
    }, id);
    let choque = null;
    for (let i = 0; i < cajas.bloques.length; i++)
      for (let j = i + 1; j < cajas.bloques.length; j++)
        if (solapan(cajas.bloques[i], cajas.bloques[j])) choque = `bloques ${i} y ${j}`;
    ok(!choque, `«${id}»: las esquinas no se pisan`, choque ?? "");
    const conFlotante = cajas.bloques.some((b) => cajas.flotantes.some((f) => solapan(b, f)));
    ok(!conFlotante, `«${id}»: ningún bloque queda bajo un botón flotante`);
  }

  /* 3 · una línea visual por grupo */
  const envuelven = await p.evaluate(() => {
    const out = [];
    for (const t of document.querySelectorAll("#pelicula-zona h1, #pelicula-zona h2")) {
      const lh = parseFloat(getComputedStyle(t).lineHeight);
      for (const m of t.children) {
        const lineas = Math.round(m.getBoundingClientRect().height / lh);
        if (lineas !== 1) out.push(`«${m.innerText.trim()}» → ${lineas}`);
      }
    }
    return out;
  });
  ok(envuelven.length === 0, "cada grupo del titular es una sola línea", envuelven.join(" · "));

  /* 4 · la línea de tiempo se va al terminar la zona */
  await p.evaluate(() => {
    const z = document.getElementById("pelicula-zona");
    window.scrollTo(0, z.offsetTop + z.offsetHeight + window.innerHeight);
  });
  await p.waitForTimeout(1600);
  const visible = await p.evaluate(() => {
    const t = [...document.querySelectorAll("[data-decorativo]")].find((e) => e.textContent.includes("Toma 01"));
    return t ? getComputedStyle(t).visibility : "sin-nodo";
  });
  ok(visible === "hidden", "pasada la apertura, la línea de tiempo se retira", visible);
  await p.close();
}

/* ---------- móvil ---------- */
console.log("\n390×844");
const m = await pagina(390, 844);
const desborde = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok(desborde <= 0, "sin scroll horizontal en móvil", `${desborde}px de más`);
await m.close();

await nav.close();
console.log(`\n${n - fallos} de ${n} comprobaciones pasan.\n`);
process.exit(fallos ? 1 : 0);
