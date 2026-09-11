/**
 * La apertura: que cada tramo caiga en su acto, de uno en uno, y que nada se
 * pise.
 *
 * La apertura depende de una cuenta que no se ve: la película reparte sus 415
 * fotogramas sobre la zona entera, y la altura de cada tramo decide en qué
 * fotograma está la cámara cuando su bloque llega al centro. Si alguien añade
 * un párrafo o cambia una altura, la cuenta se mueve y el primer plano de la
 * marca deja de coincidir con su tramo —sin que falle nada, sin un error en
 * consola—. Esto lo mide.
 *
 *   npm run dev                    (en otra terminal)
 *   npm run verificar:apertura
 *
 * Comprueba:
 *   1. Cada tramo, en reposo —su bloque centrado en pantalla—, enseña un
 *      fotograma de su acto.
 *   2. En reposo no asoma otro tramo: se leen de uno en uno.
 *   3. Los tramos alternan lado: izquierda, derecha, izquierda…
 *   4. Ningún bloque queda bajo un botón flotante, y cada grupo del titular
 *      es una sola línea visual (si envuelve, la máscara ya no corta por línea
 *      y el revelado pierde el escalonado).
 *   5. Entre las dos tomas el velo está bajado; bajo el estudio y los precios
 *      la segunda corre a media luz, y en el cierre se levanta del todo.
 *   6. Sobre papel la película se conserva; en móvil no hay scroll horizontal.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";

/* Los actos de la toma principal, leídos de una hoja de contactos cada 18
   fotogramas de public/secuencia. */
const ACTOS = {
  estudio: [0, 45],
  despegue: [45, 110],
  vuelo: [110, 222],
  marca: [236, 290],
  flotacion: [290, 350],
  mano: [345, 414],
};

let fallos = 0, n = 0;
const ok = (c, d, extra = "") => {
  n++;
  if (c) console.log(`  OK    ${d}`);
  else { fallos++; console.log(`  FALLA ${d}${extra ? ` — ${extra}` : ""}`); }
};

const nav = await chromium.launch();

async function pagina(ancho, alto, tema) {
  const ctx = await nav.newContext({ viewport: { width: ancho, height: alto }, colorScheme: "dark" });
  if (tema) await ctx.addInitScript((t) => localStorage.setItem("lf_a11y", JSON.stringify({ tema: t })), tema);
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: "networkidle" });
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await p.waitForTimeout(3500);
  return p;
}

const pelicula = (p) => p.evaluate(() => {
  const d = document.querySelector("[data-pelicula]");
  return {
    toma: d.dataset.toma,
    fotograma: Number(d.dataset.fotograma),
    velo: Number(getComputedStyle(d.querySelector("[data-velo]")).opacity),
  };
});

const ir = async (p, y) => {
  await p.evaluate((v) => window.scrollTo(0, v), y);
  await p.waitForTimeout(1600);
};

/* ---------- 1 a 5 · escritorio ---------- */
for (const [ancho, alto] of [[1440, 900], [1280, 720]]) {
  console.log(`\n${ancho}×${alto}`);
  const p = await pagina(ancho, alto);

  /* El bloque de cada tramo es su nieto: tramo > fila > bloque. El reposo
     del primero es la carga de la página. */
  const tramos = await p.evaluate(() => [...document.querySelectorAll("[data-tramo]")].map((t, i) => {
    const b = t.firstElementChild.firstElementChild.getBoundingClientRect();
    return {
      acto: t.dataset.tramo,
      reposo: i === 0 ? 0 : Math.round(b.top + scrollY + b.height / 2 - innerHeight / 2),
      centro: b.left + b.width / 2,
    };
  }));

  const alternan = tramos.every((t, i) => (i % 2 === 0 ? t.centro < ancho / 2 : t.centro > ancho / 2));
  ok(alternan, "los tramos alternan lado, empezando por la izquierda",
    tramos.map((t) => `${t.acto}:${Math.round(t.centro)}`).join(" "));

  for (const [i, t] of tramos.entries()) {
    await ir(p, t.reposo);
    const { toma, fotograma } = await pelicula(p);
    const [min, max] = ACTOS[t.acto];
    ok(toma === "0" && fotograma >= min && fotograma <= max,
      `«${t.acto}» cae en su acto (fotogramas ${min}–${max})`, `toma ${toma}, fotograma ${fotograma}`);

    const vista = await p.evaluate((i) => {
      const rect = (el) => { const r = el.getBoundingClientRect(); return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, height: r.height }; };
      const techo = document.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
      const bloques = [...document.querySelectorAll("[data-tramo]")].map((t) => rect(t.firstElementChild.firstElementChild));
      const asoman = bloques
        .map((b, k) => ({ k, fraccion: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, techo)) / b.height }))
        .filter((b) => b.k !== i && b.fraccion > 0.15);
      const flotantes = [...document.querySelectorAll("button")]
        .filter((b) => getComputedStyle(b).position === "fixed" && b.offsetWidth > 0)
        .map(rect);
      return { asoman, bloque: bloques[i], flotantes };
    }, i);
    ok(vista.asoman.length === 0, `«${t.acto}»: en reposo no asoma otro tramo`,
      vista.asoman.map((a) => `${tramos[a.k].acto} al ${Math.round(a.fraccion * 100)} %`).join(", "));
    const solapan = (a, b) => !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
    ok(!vista.flotantes.some((f) => solapan(vista.bloque, f)), `«${t.acto}»: no queda bajo un botón flotante`);
  }

  /* El pasillo de la marca: el primer plano blanco de la etiqueta, sin
     texto encima. Se comprueba en su centro y en sus dos bordes, que es
     donde un tramo vecino podría seguir asomando sobre el blanco. */
  const pasillo = await p.evaluate(() => {
    const r = document.querySelector("[data-pasillo]").getBoundingClientRect();
    return { top: r.top + scrollY, alto: r.height };
  });
  for (const [nombre, y] of [
    ["centro", pasillo.top + pasillo.alto / 2 - alto / 2],
    ["entrada", pasillo.top + pasillo.alto * 0.2 - alto / 2],
    ["salida", pasillo.top + pasillo.alto * 0.8 - alto / 2],
  ]) {
    await ir(p, y);
    const { fotograma } = await pelicula(p);
    const asoma = await p.evaluate(() => [...document.querySelectorAll("[data-tramo]")].some((t) => {
      const b = t.firstElementChild.firstElementChild.getBoundingClientRect();
      return b.bottom > 64 && b.top < innerHeight;
    }));
    if (nombre === "centro") {
      const [min, max] = ACTOS.marca;
      ok(fotograma >= min && fotograma <= max, "el pasillo cae en el primer plano de la marca", `fotograma ${fotograma}`);
    }
    ok(!asoma || fotograma < 222 || fotograma > 290,
      `pasillo (${nombre}): ningún texto sobre el blanco de la etiqueta`, `fotograma ${fotograma}`);
  }

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

  /* La tira de las nueve secciones va entre las dos tomas: ahí la película
     está quieta y tapada. Dentro de la segunda zona, el velo se queda a media
     asta mientras hay texto —estudio, precios, preguntas— y se levanta en el
     último tramo, el del cierre. */
  const [medio, mitadFinal, cierre] = await p.evaluate(() => {
    const z = document.getElementById("pelicula-zona").getBoundingClientRect();
    const c = document.getElementById("zona-final");
    const cr = c.getBoundingClientRect();
    const finZona = z.bottom + scrollY;
    const inicioFinal = cr.top + scrollY;
    const recorrido = c.offsetHeight - innerHeight;
    return [
      (finZona + inicioFinal) / 2,
      inicioFinal + recorrido * 0.35,
      inicioFinal + recorrido * 0.97,
    ];
  });
  await ir(p, medio);
  const entre = await pelicula(p);
  ok(entre.velo >= 0.8, "entre las dos tomas, el velo está bajado", `velo ${entre.velo}`);
  await ir(p, mitadFinal);
  const trabajando = await pelicula(p);
  ok(trabajando.toma === "1" && trabajando.velo > 0.5 && trabajando.velo < 0.72,
    "bajo el estudio y los precios, la segunda toma corre a media luz",
    `toma ${trabajando.toma}, velo ${trabajando.velo}`);
  await ir(p, cierre);
  const fin = await pelicula(p);
  ok(fin.toma === "1" && fin.velo <= 0.2, "en el cierre, la toma del tarro a plena luz",
    `toma ${fin.toma}, velo ${fin.velo}`);
  await p.close();
}

/* ---------- 6 · papel y móvil ---------- */
console.log("\npapel · 1440×900");
const c = await pagina(1440, 900, "claro");
const papel = await c.evaluate(() => {
  const d = document.querySelector("[data-pelicula]");
  return {
    display: getComputedStyle(d).display,
    canvas: d.querySelectorAll("canvas").length,
    filtro: getComputedStyle(d.querySelector(".pelicula-capa")).filter,
  };
});
ok(papel.display !== "none" && papel.canvas === 1 && papel.filtro.includes("brightness"),
  "sobre papel la película se conserva, en clave alta", JSON.stringify(papel));
await c.close();

console.log("\n390×844");
const m = await pagina(390, 844);
const desborde = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
ok(desborde <= 0, "sin scroll horizontal en móvil", `${desborde}px de más`);
await m.close();

await nav.close();
console.log(`\n${n - fallos} de ${n} comprobaciones pasan.\n`);
process.exit(fallos ? 1 : 0);
