/**
 * Comprueba el piso de accesibilidad de §12 y §14 sobre los tokens reales:
 * cuerpo y placeholders ≥ 4.5:1, texto grande y bordes de control ≥ 3:1.
 *
 * Lee los valores directamente de app/globals.css, así que no se puede quedar
 * desactualizado respecto a la paleta.
 *
 *   node scripts/verificar-contraste.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(import.meta.dirname, "../app/globals.css"), "utf8");

function token(nombre) {
  const m = css.match(new RegExp(`--${nombre}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m) throw new Error(`No se encontró el token --${nombre}`);
  return m[1];
}

const canal = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

function luminancia(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * canal((n >> 16) & 255) +
    0.7152 * canal((n >> 8) & 255) +
    0.0722 * (n & 255)
  );
}

function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/* Cada par es una combinación que existe de verdad en el producto. */
const PARES = [
  ["Titulares sobre canvas", "text-hi", "canvas", 3],
  ["Cuerpo sobre canvas", "text-mid", "canvas", 4.5],
  ["Cuerpo sobre surface-1", "text-mid", "surface-1", 4.5],
  ["Cuerpo sobre surface-2", "text-mid", "surface-2", 4.5],
  ["Cuerpo sobre surface-sunk", "text-mid", "surface-sunk", 4.5],
  ["Metadatos sobre canvas", "text-lo", "canvas", 4.5],
  ["Metadatos sobre surface-1", "text-lo", "surface-1", 4.5],
  /* --text-lo sobre --surface-2 no llega a 4.5:1. La regla, escrita en
     globals.css, es que ahí solo va como icono o borde: piso de 3:1. */
  ["Icono tenue sobre surface-2", "text-lo", "surface-2", 3],
  ["Metadatos sobre surface-sunk", "text-lo", "surface-sunk", 4.5],
  ["Enlace frío sobre canvas", "rim-soft", "canvas", 4.5],
  ["Aviso sobre canvas", "warn", "canvas", 4.5],
  ["Error sobre canvas", "danger", "canvas", 4.5],
  ["Correcto sobre canvas", "ok", "canvas", 4.5],
  ["Metal sobre canvas", "key", "canvas", 3],
  ["Anillo de foco sobre canvas", "rim", "canvas", 3],
  ["Hairline fuerte sobre canvas", "line-strong", "canvas", 1.4],
];

/* El botón primario invierte: tinta oscura sobre oro. */
const INVERSOS = [["Texto del botón primario", "#17120A", token("key"), 4.5]];

let fallos = 0;
console.log("Contraste sobre los tokens de §4.2\n");

for (const [nombre, frente, fondo, minimo] of PARES) {
  const ratio = contraste(token(frente), token(fondo));
  const ok = ratio >= minimo;
  if (!ok) fallos++;
  console.log(
    `${ok ? "OK  " : "FALLA"} ${ratio.toFixed(2).padStart(6)}:1  (min ${minimo})  ${nombre}`,
  );
}

for (const [nombre, frente, fondo, minimo] of INVERSOS) {
  const ratio = contraste(frente, fondo);
  const ok = ratio >= minimo;
  if (!ok) fallos++;
  console.log(
    `${ok ? "OK  " : "FALLA"} ${ratio.toFixed(2).padStart(6)}:1  (min ${minimo})  ${nombre}`,
  );
}

console.log(
  fallos === 0
    ? "\nTodos los pares pasan el piso de §12."
    : `\n${fallos} ${fallos === 1 ? "par no pasa" : "pares no pasan"} el piso de §12.`,
);
process.exitCode = fallos === 0 ? 0 : 1;
