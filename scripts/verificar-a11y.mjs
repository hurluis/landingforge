/**
 * Auditoría de accesibilidad sobre las páginas reales.
 *
 * `verificar-contraste.mjs` audita los tokens de color, que es UN criterio de
 * la WCAG. Esto audita el resto de lo que se puede comprobar sin un humano:
 * nombres accesibles, estructura de encabezados, etiquetas de formulario,
 * landmarks, foco alcanzable y el error que ninguna herramienta perdona —un
 * elemento enfocable escondido tras `aria-hidden`.
 *
 * El criterio viene de las buenas prácticas WAI/WCAG nivel A y AA. Cada
 * comprobación cita su criterio para que un fallo se pueda ir a leer:
 *
 *   1.1.1 Contenido no textual        · toda imagen con alt (vacío si decora)
 *   1.3.1 Información y relaciones    · labels reales, un h1, sin saltos de nivel
 *   2.4.1 Evitar bloques              · enlace de salto al contenido
 *   2.4.2 Título de página            · <title> no vacío y distinto por ruta
 *   2.4.4 Propósito del enlace        · nada de «clic aquí» / «leer más»
 *   2.4.6 Encabezados y etiquetas     · botones e iconos con nombre accesible
 *   3.1.1 Idioma de la página         · <html lang>
 *   4.1.2 Nombre, función, valor      · controles con nombre; aria-hidden limpio
 *
 * No sustituye la evaluación con usuarios: la automatización cubre alrededor
 * de un tercio de la WCAG. Lo que no se puede automatizar —si el texto
 * alternativo DESCRIBE algo, si el orden de foco tiene sentido— queda para la
 * revisión manual, y por eso el informe lo dice al final en vez de callarlo.
 *
 *   node scripts/verificar-a11y.mjs                 rutas públicas
 *   RUTAS=/,/precios node scripts/verificar-a11y.mjs
 *   BASE=http://localhost:3000 node scripts/verificar-a11y.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:3000";

/* Solo rutas públicas: las de sesión exigirían un login y este audit debe
   poder correr en la puerta de entrega sin credenciales. */
const RUTAS = (process.env.RUTAS ?? "/,/metodologia,/precios,/entrar,/kit").split(",");

/** Texto de enlace que no dice a dónde lleva (2.4.4). */
const ENLACES_VACIOS = [
  "clic aquí",
  "click aquí",
  "haz clic",
  "aquí",
  "leer más",
  "ver más",
  "más información",
  "este enlace",
];

/**
 * Se ejecuta DENTRO de la página. No puede cerrar sobre nada de este módulo,
 * así que las constantes viajan como argumento.
 */
function auditar({ enlacesVacios }) {
  const fallos = [];
  const avisos = [];

  const registrar = (lista, criterio, mensaje, nodo) => {
    let donde = "";
    if (nodo) {
      const etiqueta = nodo.tagName.toLowerCase();
      const clase = (nodo.getAttribute("class") ?? "").split(/\s+/).slice(0, 2).join(".");
      const id = nodo.id ? `#${nodo.id}` : "";
      donde = `<${etiqueta}${id}${clase ? `.${clase}` : ""}>`;
    }
    lista.push({ criterio, mensaje, donde });
  };

  /** ¿Está visible? Un control oculto no se audita como si se pudiera usar. */
  const visible = (el) => {
    const e = getComputedStyle(el);
    if (e.display === "none" || e.visibility === "hidden") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  };

  /**
   * Fuera del árbol de accesibilidad, a propósito.
   *
   * Radix monta un <select> nativo de 1px, `aria-hidden` y `tabindex="-1"`,
   * junto a su combobox accesible, para que los formularios y el autocompletar
   * del navegador sigan funcionando. Exigirle una etiqueta a ese elemento es
   * un falso positivo, y un audit con falsos positivos enseña a ignorar la
   * salida. Lo que sí se audita —y es lo grave— es que algo enfocable quede
   * dentro de un aria-hidden; de eso se ocupa su propia comprobación.
   */
  const fueraDelArbol = (el) => el.closest('[aria-hidden="true"]') !== null;

  /** Nombre accesible, en el orden que usa la plataforma. */
  const nombre = (el) => {
    const aria = el.getAttribute("aria-label");
    if (aria?.trim()) return aria.trim();

    const ref = el.getAttribute("aria-labelledby");
    if (ref) {
      const t = ref
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent ?? "")
        .join(" ")
        .trim();
      if (t) return t;
    }

    if (el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA") {
      if (el.id) {
        const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (l?.textContent?.trim()) return l.textContent.trim();
      }
      const envuelto = el.closest("label");
      if (envuelto?.textContent?.trim()) return envuelto.textContent.trim();
      const title = el.getAttribute("title");
      if (title?.trim()) return title.trim();
      return "";
    }

    const texto = el.textContent?.trim() ?? "";
    if (texto) return texto;

    /* Un botón de solo icono: si el svg tiene título, cuenta. */
    const svgTitulo = el.querySelector("svg > title")?.textContent?.trim();
    return svgTitulo ?? "";
  };

  /* ---- 3.1.1 idioma ---- */
  const lang = document.documentElement.getAttribute("lang");
  if (!lang) registrar(fallos, "3.1.1", "El <html> no declara lang.");

  /* ---- 2.4.2 título ---- */
  if (!document.title.trim()) registrar(fallos, "2.4.2", "La página no tiene <title>.");

  /* ---- 2.4.1 salto al contenido ----
     El criterio habla de «bloques repetidos en varias páginas»: existe para
     que el teclado no tenga que atravesar la misma navegación una y otra vez.
     Una pantalla de una sola columna, sin barra, no tiene nada que saltar, y
     exigirle el enlace ahí sería ruido que enseña a ignorar el audit. Se
     reclama solo cuando hay navegación con sustancia por delante. */
  const navegaciones = [...document.querySelectorAll('nav, [role="navigation"]')];
  const enlacesDeNav = navegaciones.reduce(
    (n, nav) => n + nav.querySelectorAll("a[href], button").length,
    0,
  );
  if (enlacesDeNav >= 3) {
    const saltos = [...document.querySelectorAll('a[href^="#"]')];
    const bueno = saltos.some((a) => {
      const id = a.getAttribute("href")?.slice(1);
      return id && document.getElementById(id);
    });
    if (!bueno) {
      registrar(
        fallos,
        "2.4.1",
        `Hay navegación con ${enlacesDeNav} destinos y ningún enlace de salto al contenido.`,
      );
    }
  }

  /* ---- 1.3.1 landmark principal ---- */
  const mains = document.querySelectorAll('main, [role="main"]');
  if (mains.length === 0) registrar(fallos, "1.3.1", "No hay landmark <main>.");
  if (mains.length > 1) {
    registrar(fallos, "1.3.1", `Hay ${mains.length} landmarks <main>; debe haber uno.`);
  }

  /* ---- 1.3.1 encabezados: un h1, y sin saltar niveles ---- */
  const encabezados = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible);
  const h1 = encabezados.filter((h) => h.tagName === "H1");
  if (h1.length === 0) registrar(fallos, "1.3.1", "La página no tiene h1 visible.");
  if (h1.length > 1) registrar(fallos, "1.3.1", `Hay ${h1.length} h1 visibles; debe haber uno.`);

  let previo = 0;
  for (const h of encabezados) {
    const nivel = Number(h.tagName[1]);
    if (previo && nivel > previo + 1) {
      registrar(
        avisos,
        "1.3.1",
        `Salto de h${previo} a h${nivel}: «${(h.textContent ?? "").trim().slice(0, 40)}»`,
        h,
      );
    }
    previo = nivel;
  }

  /* ---- 1.1.1 imágenes ---- */
  for (const img of document.querySelectorAll("img")) {
    if (!visible(img) || fueraDelArbol(img)) continue;
    if (img.getAttribute("alt") === null && img.getAttribute("aria-hidden") !== "true") {
      registrar(fallos, "1.1.1", `<img> sin atributo alt: ${img.currentSrc || img.src}`, img);
    }
  }

  /* ---- 4.1.2 controles con nombre accesible ---- */
  const controles = document.querySelectorAll(
    'button, a[href], input:not([type="hidden"]), select, textarea, [role="button"], [role="link"]',
  );
  for (const c of controles) {
    if (!visible(c) || fueraDelArbol(c)) continue;
    if (c.tagName === "INPUT" && ["submit", "button", "reset"].includes(c.type)) {
      if (c.value?.trim()) continue;
    }
    if (!nombre(c)) {
      registrar(fallos, "4.1.2", `${c.tagName.toLowerCase()} sin nombre accesible.`, c);
    }
  }

  /* ---- 2.4.4 propósito del enlace ---- */
  for (const a of document.querySelectorAll("a[href]")) {
    if (!visible(a) || fueraDelArbol(a)) continue;
    const t = nombre(a).toLowerCase().replace(/\s+/g, " ").trim();
    if (t && enlacesVacios.includes(t)) {
      registrar(avisos, "2.4.4", `Enlace con texto genérico: «${t}»`, a);
    }
  }

  /* ---- 4.1.2 aria-hidden sobre algo enfocable ----
     El error más caro de todos: el elemento sigue en el orden de tabulación
     pero desaparece del árbol de accesibilidad, así que el lector de pantalla
     anuncia el foco en la nada. */
  for (const oculto of document.querySelectorAll('[aria-hidden="true"]')) {
    /* `inert` es justamente la corrección: saca el subárbol del orden de
       tabulación y del árbol de accesibilidad a la vez. Si está puesto, no
       hay nada que reportar. */
    if (oculto.hasAttribute("inert") || oculto.closest("[inert]")) continue;

    const enfocables = oculto.matches("a[href],button,input,select,textarea,[tabindex]")
      ? [oculto]
      : [...oculto.querySelectorAll("a[href],button,input,select,textarea,[tabindex]")];
    for (const f of enfocables) {
      if (f.getAttribute("tabindex") === "-1" || f.disabled) continue;
      registrar(fallos, "4.1.2", "Elemento enfocable dentro de aria-hidden.", f);
    }
  }

  /* ---- 1.3.1 campos con label real ---- */
  for (const campo of document.querySelectorAll(
    'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea',
  )) {
    if (!visible(campo) || fueraDelArbol(campo)) continue;
    const propio = campo.id && document.querySelector(`label[for="${CSS.escape(campo.id)}"]`);
    const envuelto = campo.closest("label");
    const aria = campo.getAttribute("aria-label") || campo.getAttribute("aria-labelledby");
    if (!propio && !envuelto && !aria) {
      registrar(fallos, "1.3.1", "Campo de formulario sin <label> asociado.", campo);
    }
    /* El placeholder haciendo de etiqueta desaparece al escribir. */
    if (!propio && !envuelto && !aria && campo.getAttribute("placeholder")) {
      registrar(avisos, "1.3.1", "El placeholder está haciendo de etiqueta.", campo);
    }
  }

  return { fallos, avisos };
}

/* ================================================================ */

const navegador = await chromium.launch();
const contexto = await navegador.newContext({
  viewport: { width: 1440, height: 900 },
  colorScheme: "dark",
});

let totalFallos = 0;
let totalAvisos = 0;
const titulos = new Map();

for (const ruta of RUTAS) {
  const pagina = await contexto.newPage();
  let resultado;
  try {
    await pagina.goto(`${BASE}${ruta}`, { waitUntil: "networkidle", timeout: 60000 });
    resultado = await pagina.evaluate(auditar, { enlacesVacios: ENLACES_VACIOS });
    titulos.set(ruta, await pagina.title());
  } catch (e) {
    console.log(`\n  ${ruta}`);
    console.log(`    ✗  no se pudo cargar: ${e.message.split("\n")[0]}`);
    totalFallos += 1;
    await pagina.close();
    continue;
  }
  await pagina.close();

  const { fallos, avisos } = resultado;
  totalFallos += fallos.length;
  totalAvisos += avisos.length;

  console.log(`\n  ${ruta}`);
  if (fallos.length === 0 && avisos.length === 0) {
    console.log("    ✓  sin hallazgos automáticos");
  }
  for (const f of fallos) {
    console.log(`    ✗  ${f.criterio}  ${f.mensaje}${f.donde ? `  ${f.donde}` : ""}`);
  }
  for (const a of avisos) {
    console.log(`    !  ${a.criterio}  ${a.mensaje}${a.donde ? `  ${a.donde}` : ""}`);
  }
}

/* ---- 2.4.2: el título debe distinguir la página ---- */
const vistos = new Map();
for (const [ruta, t] of titulos) {
  if (vistos.has(t)) {
    console.log(`\n  ✗  2.4.2  ${ruta} y ${vistos.get(t)} comparten <title>: «${t}»`);
    totalFallos += 1;
  } else {
    vistos.set(t, ruta);
  }
}

await navegador.close();

console.log(`\n  ${totalFallos} fallo(s), ${totalAvisos} aviso(s) en ${RUTAS.length} ruta(s).`);
console.log(
  "\n  La automatización cubre cerca de un tercio de la WCAG. Quedan fuera, y hay\n" +
    "  que mirarlos a mano: si el alt describe de verdad, si el orden de foco sigue\n" +
    "  al orden visual, si el movimiento respeta prefers-reduced-motion y si el\n" +
    "  contenido se entiende a 200% de zoom.\n",
);

process.exit(totalFallos > 0 ? 1 : 0);
