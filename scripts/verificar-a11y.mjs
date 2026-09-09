/**
 * Comprobación en navegador de la secuencia de fotogramas y del panel de
 * accesibilidad. Necesita el servidor levantado, igual que e2e.mjs.
 *
 *   npm run dev                    (en otra terminal)
 *   npm run verificar:a11y
 *
 * Lo que comprueba no es que los componentes se rendericen —eso lo diría
 * cualquier prueba— sino las cosas que de verdad se pueden romper sin que
 * nadie se entere: que el scroll cambie el píxel pintado en el canvas, que
 * cada preferencia llegue hasta el estilo calculado, y que con movimiento
 * reducido la secuencia no se descargue siquiera.
 *
 * Deja las capturas del recorrido en .capturas/.
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = resolve(import.meta.dirname, "../.capturas");
mkdirSync(OUT, { recursive: true });

let fallos = 0, n = 0;
const ok = (c, d, extra = "") => {
  n++;
  if (c) console.log(`  OK    ${d}`);
  else { fallos++; console.log(`  FALLA ${d}${extra ? ` — ${extra}` : ""}`); }
};

const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "dark" });
const p = await ctx.newPage();
/* El overlay de `next dev` es un portal fijo que intercepta los clics de las
   esquinas. No es parte de lo que se verifica, y en producción no existe. */
const sinOverlay = (pagina) =>
  pagina.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
const errores = [];
p.on("console", (m) => m.type() === "error" && errores.push(m.text()));
p.on("pageerror", (e) => errores.push(String(e)));

/* ---------- 1 · La secuencia ---------- */
console.log("\n1 · Secuencia de fotogramas");
await p.goto(BASE, { waitUntil: "networkidle" });
await sinOverlay(p);

const seccion = p.locator("section:has(#secuencia-titulo)");
ok(await seccion.count() === 1, "la sección existe una sola vez");
ok(await p.locator("#secuencia-titulo").innerText() !== "", "tiene titular accesible");

await seccion.scrollIntoViewIfNeeded();
await p.waitForTimeout(2500);

const canvas = seccion.locator("canvas");
ok(await canvas.count() === 1, "monta el canvas (no la variante fija)");

const dims = await canvas.evaluate((c) => ({ w: c.width, h: c.height, op: getComputedStyle(c).opacity }));
ok(dims.w > 1400 && dims.h > 800, "el canvas está en píxeles físicos", JSON.stringify(dims));
ok(Number(dims.op) === 1, "el canvas ya es visible", `opacidad ${dims.op}`);

/* Se compara el píxel del canvas en dos puntos del recorrido: si el scroll
   mueve el tiempo de verdad, la imagen tiene que cambiar. */
const caja = await seccion.evaluate((el) => ({
  top: el.getBoundingClientRect().top + window.scrollY,
  alto: el.offsetHeight,
}));
const firma = async (frac) => {
  /* El recorrido útil es la altura de la pista menos una pantalla: pasado ese
     punto la sección ya se despegó del `sticky` y el progreso vale 1. */
  const recorrido = caja.alto - (await p.evaluate(() => window.innerHeight));
  await p.evaluate((y) => window.scrollTo(0, y), caja.top + recorrido * frac);
  await p.waitForTimeout(1400);
  return canvas.evaluate((c) => {
    const g = c.getContext("2d");
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let s = 0;
    for (let i = 0; i < d.length; i += 4000) s += d[i] + d[i + 1] + d[i + 2];
    return s;
  });
};
const a = await firma(0.02);
await p.screenshot({ path: `${OUT}/secuencia-inicio.png` });
const b = await firma(0.5);
await p.screenshot({ path: `${OUT}/secuencia-medio.png` });
const c = await firma(0.98);
await p.screenshot({ path: `${OUT}/secuencia-final.png` });
ok(a !== b && b !== c && a !== c, "el scroll cambia el fotograma pintado", `${a} / ${b} / ${c}`);

const pedidos = await p.evaluate(() =>
  performance.getEntriesByType("resource").filter((r) => r.name.includes("/secuencia/")).length);
ok(pedidos > 100, `se descargaron fotogramas por lotes (${pedidos})`);

/* ---------- 2 · Panel de accesibilidad ---------- */
console.log("\n2 · Panel de accesibilidad");
await p.evaluate(() => window.scrollTo(0, 0));
await sinOverlay(p);
await p.waitForTimeout(400);

const disparador = p.getByRole("button", { name: "Accesibilidad y guía de uso" });
ok(await disparador.count() === 1, "el disparador flotante existe");
await disparador.click();
const dialogo = p.getByRole("dialog");
await dialogo.waitFor({ state: "visible" });
ok(true, "el diálogo abre");
await p.screenshot({ path: `${OUT}/a11y-panel.png` });

const leer = () => p.evaluate(() => ({
  tema: document.documentElement.dataset.tema,
  texto: document.documentElement.dataset.texto,
  movimiento: document.documentElement.dataset.movimiento,
  lectura: document.documentElement.dataset.lectura,
  contraste: document.documentElement.dataset.contraste,
  enlaces: document.documentElement.dataset.enlaces,
  raiz: getComputedStyle(document.documentElement).fontSize,
  /* Lightning CSS acorta #000000 a #000, así que se compara el color ya
     resuelto por el navegador en vez del texto del token. */
  tinta: getComputedStyle(document.body).color,
  fondo: getComputedStyle(document.body).backgroundColor,
}));

await p.getByRole("radio", { name: /Papel/ }).check();
await p.waitForTimeout(300);
let e = await leer();
ok(e.tema === "claro", "el tema claro se escribe en el <html>");
ok(e.tinta === "rgb(20, 22, 26)", "los tokens invierten a papel", e.tinta);
await p.screenshot({ path: `${OUT}/a11y-tema-claro.png` });

await p.getByRole("radio", { name: /Enorme/ }).check();
await p.waitForTimeout(200);
e = await leer();
ok(e.texto === "enorme" && parseFloat(e.raiz) >= 19, "el texto enorme escala la raíz", e.raiz);

await p.getByRole("checkbox", { name: /Alto contraste/ }).check();
await p.waitForTimeout(200);
e = await leer();
ok(e.contraste === "true" && e.tinta === "rgb(0, 0, 0)", "alto contraste sube la tinta", e.tinta);

/* El estado marcado tiene que verse en el propio control, no solo en el
   borde de su etiqueta: la primera versión dibujada a mano perdía la palomita
   y nadie se enteraba. */
const marcaVisible = await p.evaluate(() => {
  const c = [...document.querySelectorAll('[role="dialog"] input[type=checkbox]')].find((x) => x.checked);
  const v = [...document.querySelectorAll('[role="dialog"] input[type=checkbox]')].find((x) => !x.checked);
  if (!c || !v) return "sin-par";
  const s = getComputedStyle(c), t = getComputedStyle(v);
  return {
    nativa: s.appearance !== "none",
    distinta: s.backgroundColor !== t.backgroundColor || s.backgroundImage !== t.backgroundImage
      || s.appearance !== "none",
  };
});
ok(marcaVisible.distinta === true, "la casilla marcada se distingue de la vacía", JSON.stringify(marcaVisible));

await p.getByRole("checkbox", { name: /Subrayar los enlaces/ }).check();
await p.waitForTimeout(200);
const subrayado = await p.evaluate(() => {
  const planos = [...document.querySelectorAll("a[href]")].filter(
    (a) => !a.className.includes("inline-flex"),
  );
  return {
    planos: planos.length,
    subrayados: planos.filter((a) =>
      getComputedStyle(a).textDecorationLine.includes("underline"),
    ).length,
    botonesTocados: [...document.querySelectorAll("a[href].inline-flex")].filter((a) =>
      getComputedStyle(a).textDecorationLine.includes("underline"),
    ).length,
  };
});
ok(
  subrayado.planos > 0 && subrayado.subrayados === subrayado.planos,
  "se subrayan todos los enlaces de texto",
  JSON.stringify(subrayado),
);
ok(subrayado.botonesTocados === 0, "los botones no se subrayan", JSON.stringify(subrayado));

await p.getByRole("radio", { name: /Estudio/ }).check();
await p.getByRole("checkbox", { name: /Modo lectura/ }).check();
await p.waitForTimeout(300);
e = await leer();
ok(e.lectura === "true", "el modo lectura se activa");
const fuenteDisplay = await p.evaluate(() => {
  const h = document.querySelector(".display-lg, .display-xl");
  return h ? getComputedStyle(h).fontFamily : "";
});
ok(!/Bodoni/i.test(fuenteDisplay), "el modo lectura cambia el didone por grotesca", fuenteDisplay);
const fondoOculto = await p.evaluate(() => {
  const d = document.querySelector("[data-decorativo]");
  return d ? getComputedStyle(d).display : "sin-nodo";
});
ok(fondoOculto === "none", "el fondo decorativo se apaga en modo lectura", fondoOculto);
await p.screenshot({ path: `${OUT}/a11y-modo-lectura.png` });

/* ---------- 3 · Persistencia y movimiento reducido ---------- */
console.log("\n3 · Persistencia y movimiento reducido");
await p.keyboard.press("Escape");
await p.reload({ waitUntil: "domcontentloaded" });
await sinOverlay(p);
e = await leer();
ok(e.lectura === "true" && e.texto === "enorme", "las preferencias sobreviven a la recarga");

const antesDeHidratar = await p.evaluate(() => document.documentElement.dataset.texto);
ok(antesDeHidratar === "enorme", "el script inline las aplica antes de pintar");

/* Con lectura activa la sección tiene que caer a la variante fija, sin canvas.
   El servidor pinta la variante con canvas —no puede saber lo que hay en
   localStorage—, así que al hidratar el nodo se reemplaza. Hay que esperar a
   ese cambio antes de medir, o se mide un nodo que ya no está en el DOM. */
await p.locator('section:has(#secuencia-titulo) img[src*="/secuencia/0001.jpg"]')
  .waitFor({ state: "attached", timeout: 5000 });
await p.locator("section:has(#secuencia-titulo)").scrollIntoViewIfNeeded();
await p.waitForTimeout(800);
const conLectura = await p.locator("section:has(#secuencia-titulo) canvas").count();
const imgFija = await p.locator('section:has(#secuencia-titulo) img[src*="/secuencia/0001.jpg"]').count();
ok(conLectura === 0 && imgFija === 1, "con movimiento reducido queda el fotograma fijo, sin canvas");

/* Restablecer deja el sitio como estaba. */
await p.evaluate(() => window.scrollTo(0, 0));
await p.getByRole("button", { name: "Accesibilidad y guía de uso" }).click();
await p.getByRole("button", { name: /Restablecer todo/ }).click();
await p.waitForTimeout(300);
e = await leer();
ok(e.tema === "oscuro" && e.texto === "normal" && e.lectura === "false", "restablecer vuelve a los valores por defecto");
await p.keyboard.press("Escape");

/* ---------- 4 · Teclado ---------- */
console.log("\n4 · Teclado");
await p.reload({ waitUntil: "domcontentloaded" });
await sinOverlay(p);
await p.keyboard.press("Tab");
const primerFoco = await p.evaluate(() => document.activeElement?.textContent?.trim());
ok(primerFoco === "Saltar al contenido", "el primer tabulador es el enlace de salto", primerFoco);

await p.getByRole("button", { name: "Accesibilidad y guía de uso" }).click();
await p.getByRole("dialog").waitFor({ state: "visible" });
await p.keyboard.press("Escape");
/* Radix desmonta el diálogo al terminar su animación de salida, así que se
   espera al desmontaje en vez de dormir una cifra fija. */
const cerrado = await p
  .getByRole("dialog")
  .waitFor({ state: "detached", timeout: 4000 })
  .then(() => true, () => false);
ok(cerrado, "Esc cierra el panel", `siguen ${await p.getByRole("dialog").count()} diálogos`);

/* ---------- 5 · Cuenta de prueba ---------- */
console.log("\n5 · Cuenta de prueba");
await p.goto(`${BASE}/entrar`, { waitUntil: "domcontentloaded" });
const r = await p.evaluate(async () => {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ modo: "entrar", email: "prueba@landingforge.co", contrasena: "Prueba1234" }),
  });
  return { estado: res.status, cuerpo: await res.json() };
});
ok(r.estado === 200, "la cuenta de prueba entra", `HTTP ${r.estado}`);
ok(r.cuerpo?.usuario?.plan === "estudio", "tiene plan estudio", JSON.stringify(r.cuerpo?.usuario));
ok(r.cuerpo?.usuario?.creditosDisponibles === 120, "tiene 120 créditos");

await p.goto(`${BASE}/app`, { waitUntil: "networkidle" });
ok(p.url().includes("/app") && !p.url().includes("/entrar"), "el panel abre con esa sesión", p.url());
await p.screenshot({ path: `${OUT}/panel-usuario.png`, fullPage: false });

/* ---------- 6 · Móvil ---------- */
console.log("\n6 · Móvil");
const movil = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: "dark" });
const pm = await movil.newPage();
await pm.goto(BASE, { waitUntil: "domcontentloaded" });
await sinOverlay(pm);
await pm.locator("section:has(#secuencia-titulo)").scrollIntoViewIfNeeded();
await pm.waitForTimeout(2500);
ok(await pm.locator("section:has(#secuencia-titulo) canvas").count() === 1, "la secuencia monta en móvil");
const solape = await pm.evaluate(() => {
  const b = [...document.querySelectorAll("button")];
  const a11y = b.find((x) => x.getAttribute("aria-label")?.startsWith("Accesibilidad"));
  const asis = b.find((x) => x !== a11y && getComputedStyle(x).position === "fixed");
  if (!a11y || !asis) return "sin-par";
  const r1 = a11y.getBoundingClientRect(), r2 = asis.getBoundingClientRect();
  return !(r1.right < r2.left || r2.right < r1.left || r1.bottom < r2.top || r2.bottom < r1.top);
});
ok(solape === false, "el botón de accesibilidad no solapa al asistente", String(solape));
await pm.screenshot({ path: `${OUT}/movil-secuencia.png` });

console.log(`\nErrores de consola: ${errores.length}`);
errores.slice(0, 8).forEach((x) => console.log(`   · ${x.slice(0, 160)}`));
ok(errores.length === 0, "sin errores de consola");

console.log(`\n${n - fallos} de ${n} comprobaciones pasan.\n`);
await nav.close();
process.exit(fallos ? 1 : 0);
