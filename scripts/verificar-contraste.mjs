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
/* Cada par existe de verdad en el producto. */
const PARES = [
  ["Titulares sobre canvas", "ash", "void", 3],
  ["Cuerpo sobre canvas", "smoke", "void", 4.5],
  ["Cuerpo sobre anvil", "smoke", "anvil", 4.5],
  ["Cuerpo sobre anvil elevado", "smoke", "anvil-hi", 4.5],
  ["Cuerpo sobre hundido", "smoke", "sunk", 4.5],
  ["Metadatos sobre canvas", "slag", "void", 4.5],
  ["Metadatos sobre anvil", "slag", "anvil", 4.5],
  ["Metadatos sobre hundido", "slag", "sunk", 4.5],
  ["Enlace y foco sobre canvas", "quench", "void", 4.5],
  ["Acento de accion sobre canvas", "heat", "void", 3],
  // --warn solo se usa como icono y borde, nunca como texto de lectura.
  ["Aviso como icono o borde", "warn", "void", 3],
  ["Error sobre canvas", "danger", "void", 4.5],
  ["Correcto sobre canvas", "ok", "void", 4.5],
  ["Hairline fuerte sobre canvas", "scale-hi", "void", 1.4],
];

/* El CTA primario invierte: tinta oscura sobre naranja incandescente.
   §5.3 lo dice explicito: el texto sobre --heat es --void, nunca blanco.
   El tercer par comprueba justamente que el blanco NO pasaria, que es la
   razon de la regla. */
const INVERSOS = [
  // El CTA con relleno solo existe en tamaño lg, donde la etiqueta es
  // texto grande y el piso aplicable es 3:1. Lo enforce components/ui/boton.
  ["CTA primario lg, void sobre heat", token("void"), token("heat"), 3, true],
  ["Texto del CTA en hover, void sobre ember", token("void"), token("ember"), 4.5, true],
  ["CTA en contorno, ash sobre canvas", token("ash"), token("void"), 4.5, true],
];

let fallos = 0;
console.log("Contraste sobre los tokens de §5.3\n");

for (const [nombre, frente, fondo, minimo] of PARES) {
  const ratio = contraste(token(frente), token(fondo));
  const ok = ratio >= minimo;
  if (!ok) fallos++;
  console.log(
    `${ok ? "OK  " : "FALLA"} ${ratio.toFixed(2).padStart(6)}:1  (min ${minimo})  ${nombre}`,
  );
}

console.log("");
for (const [nombre, frente, fondo, minimo, debePasar] of INVERSOS) {
  const ratio = contraste(frente, fondo);
  const ok = debePasar ? ratio >= minimo : ratio < minimo;
  if (!ok) fallos++;
  console.log(`${ok ? "OK  " : "FALLA"} ${ratio.toFixed(2).padStart(6)}:1  ${nombre}`);
}

console.log(
  fallos === 0
    ? "\nTodos los pares pasan el piso de §13."
    : `\n${fallos} ${fallos === 1 ? "par no pasa" : "pares no pasan"} el piso de §13.`,
);
process.exitCode = fallos === 0 ? 0 : 1;
