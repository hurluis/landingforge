/**
 * Comprueba que todo lo que la página pide traducir tiene traducción.
 *
 *   node scripts/verificar-idioma.mjs          lista lo que falta
 *   node scripts/verificar-idioma.mjs --plantilla   lo imprime listo para pegar
 *
 * Una clave sin entrada no rompe nada —el traductor devuelve el español—, y
 * ese es justo el problema: en inglés se vería una frase suelta en español sin
 * que nadie se entere. Por eso se comprueba aquí y no en el navegador.
 *
 * Además avisa al revés: entradas del diccionario que ya no usa nadie, que son
 * las que se quedan cuando se reescribe una frase y se olvida el inglés.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const RAIZ = process.cwd();
const DICCIONARIO = "lib/i18n/en";

function archivos(dir, ext, salida = []) {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (entrada === "node_modules" || entrada.startsWith(".")) continue;
    if (statSync(ruta).isDirectory()) archivos(ruta, ext, salida);
    else if (ext.some((e) => entrada.endsWith(e))) salida.push(ruta);
  }
  return salida;
}

/** Los comentarios se quitan antes de buscar: hay prosa en español por todas partes. */
function sinComentarios(fuente) {
  return fuente.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/* ---------- 1 · Lo que la página pide ---------- */
const pedidas = new Map(); // clave -> archivos donde sale
for (const ruta of archivos(join(RAIZ, "app"), [".tsx", ".ts"]).concat(
  archivos(join(RAIZ, "components"), [".tsx", ".ts"]),
  archivos(join(RAIZ, "lib"), [".tsx", ".ts"]),
)) {
  if (ruta.includes(`${DICCIONARIO}`)) continue;
  const fuente = sinComentarios(readFileSync(ruta, "utf8"));
  for (const m of fuente.matchAll(/\bt\(\s*"((?:[^"\\\n]|\\.)*)"/g)) {
    const clave = m[1];
    if (!pedidas.has(clave)) pedidas.set(clave, []);
    pedidas.get(clave).push(ruta.replace(`${RAIZ}/`, ""));
  }
}

/* ---------- 1b · Lo que llega por dato ----------
   Buena parte del texto no está escrito en un componente sino en los datos de
   la metodología, los planes y los documentos legales, y se traduce con
   `t(variable)`. Esas claves son invisibles para el barrido de arriba, así que
   se recogen aquí: si no, cada una se reportaría como sobrante. */
const DATOS = [
  "lib/metodologia/tipologias.ts",
  "lib/metodologia/paletas.ts",
  "lib/metodologia/reglas-prompt.ts",
  "lib/metodologia/mercados.ts",
  "lib/planes.ts",
  "app/(marketing)/legal/[doc]/page.tsx",
];
const porDato = new Set();
for (const ruta of DATOS) {
  const fuente = sinComentarios(readFileSync(join(RAIZ, ruta), "utf8"));
  for (const m of fuente.matchAll(/"((?:[^"\\\n]|\\.){3,})"/g)) porDato.add(m[1]);
}

/* ---------- 2 · Lo que el diccionario tiene ---------- */
const traducidas = new Set();
for (const ruta of archivos(join(RAIZ, DICCIONARIO), [".ts"])) {
  if (ruta.endsWith("index.ts")) continue;
  const fuente = sinComentarios(readFileSync(ruta, "utf8"));
  /* Las claves sin comillas admiten acentos: «Método» es un identificador
     válido en JavaScript, y sin \p{L} el comprobador las daba por ausentes. */
  for (const m of fuente.matchAll(
    /^\s*(?:"((?:[^"\\]|\\.)*)"|([\p{L}_$][\p{L}\p{N}_$]*))\s*:/gmu,
  )) {
    traducidas.add(m[1] ?? m[2]);
  }
}

/* ---------- 3 · El informe ---------- */
const faltan = [...pedidas.keys()].filter((k) => !traducidas.has(k));
const sobran = [...traducidas].filter((k) => !pedidas.has(k) && !porDato.has(k));

if (process.argv.includes("--plantilla")) {
  for (const clave of faltan) console.log(`  ${JSON.stringify(clave)}: "",`);
  process.exit(0);
}

console.log(`Claves en uso: ${pedidas.size} literales + ${porDato.size} por dato`);
console.log(`Traducidas:    ${pedidas.size - faltan.length}`);

if (faltan.length) {
  console.log(`\nSin inglés (${faltan.length}):`);
  for (const clave of faltan) {
    const corta = clave.length > 70 ? `${clave.slice(0, 70)}…` : clave;
    console.log(`  · ${corta}\n      ${[...new Set(pedidas.get(clave))].join(", ")}`);
  }
}
if (sobran.length) {
  console.log(`\nEn el diccionario pero ya sin uso (${sobran.length}):`);
  for (const clave of sobran) console.log(`  · ${clave.length > 70 ? `${clave.slice(0, 70)}…` : clave}`);
}

console.log(
  faltan.length === 0 && sobran.length === 0
    ? "\nLa página entera está en los dos idiomas.\n"
    : "",
);
process.exit(faltan.length === 0 ? 0 : 1);
