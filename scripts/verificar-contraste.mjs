/**
 * Piso de accesibilidad sobre los tokens reales: 4.5:1 en cuerpo y
 * placeholders, 3:1 en texto grande y en bordes de control.
 *
 * El producto tiene DOS materiales y los dos se auditan: el estudio (oscuro)
 * y el papel (claro). Los valores se leen de app/globals.css, así que el
 * audit no puede quedar desfasado respecto de la paleta.
 *
 *   node scripts/verificar-contraste.mjs
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const css = readFileSync(resolve(import.meta.dirname, "../app/globals.css"), "utf8");

/* Los tokens del papel viven dentro del bloque .papel; los del estudio, antes. */
const inicioPapel = css.indexOf(".papel {");
const finPapel = css.indexOf("}", inicioPapel);
const BLOQUES = {
  estudio: css.slice(0, inicioPapel),
  papel: css.slice(inicioPapel, finPapel),
};

function token(nombre, material) {
  const m = BLOQUES[material].match(new RegExp(`--${nombre}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!m) throw new Error(`No se encontró --${nombre} en el material ${material}`);
  return m[1];
}

/** Linealización sRGB. Los TRES canales, que es donde estaba el error. */
const canal = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

function luminancia(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * canal((n >> 16) & 255) +
    0.7152 * canal((n >> 8) & 255) +
    0.0722 * canal(n & 255)
  );
}

function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/* Comprobación del propio medidor: pares con ratio conocido. Un audit que no
   se verifica a sí mismo puede dar luz verde a una paleta ilegible, que es
   exactamente lo que pasó con la versión anterior de este archivo. */
const CALIBRACION = [
  ["#000000", "#FFFFFF", 21],
  ["#FFFFFF", "#FFFFFF", 1],
  ["#777777", "#FFFFFF", 4.48],
];
for (const [a, b, esperado] of CALIBRACION) {
  const r = contraste(a, b);
  if (Math.abs(r - esperado) > 0.05) {
    console.error(`El medidor está mal: ${a} sobre ${b} da ${r.toFixed(2)}, debería dar ${esperado}`);
    process.exit(1);
  }
}

/* Cada par existe de verdad en el producto. */
const PARES = [
  ["Titulares sobre la superficie", "ash", "void", 3],
  ["Cuerpo sobre la superficie", "smoke", "void", 4.5],
  ["Cuerpo sobre tarjeta", "smoke", "anvil", 4.5],
  ["Cuerpo sobre superficie elevada", "smoke", "anvil-hi", 4.5],
  ["Cuerpo sobre hundido", "smoke", "sunk", 4.5],
  ["Metadatos sobre la superficie", "slag", "void", 4.5],
  ["Metadatos sobre tarjeta", "slag", "anvil", 4.5],
  ["Enlace y anillo de foco", "quench", "void", 4.5],
  ["Acento de acción, como borde", "heat", "void", 3],
  ["Aviso, como icono o borde", "warn", "void", 3],
  ["Error, como texto", "danger", "void", 4.5],
  ["Correcto, como texto", "ok", "void", 4.5],
  ["Hairline fuerte", "scale-hi", "void", 1.4],
];

let fallos = 0;

function auditar(material, titulo) {
  console.log(`\n${titulo}\n`);
  for (const [nombre, frente, fondo, minimo] of PARES) {
    const ratio = contraste(token(frente, material), token(fondo, material));
    const ok = ratio >= minimo;
    if (!ok) fallos++;
    console.log(
      `${ok ? "OK   " : "FALLA"} ${ratio.toFixed(2).padStart(6)}:1  (min ${minimo})  ${nombre}`,
    );
  }
}

auditar("estudio", "Material 1 · el estudio");
auditar("papel", "Material 2 · el papel");

/* El CTA con relleno invierte: tinta oscura sobre el acento. Solo existe en
   tamaño lg, donde la etiqueta es texto grande y el piso es 3:1. Lo enforce
   components/ui/boton.tsx, no cada sitio de llamada. */
console.log("\nEl CTA con relleno, en los dos materiales\n");
for (const material of ["estudio", "papel"]) {
  for (const [etiqueta, fondo] of [["reposo", "heat"], ["hover", "ember"]]) {
    const ratio = contraste(token("void", material), token(fondo, material));
    const ok = ratio >= 3;
    if (!ok) fallos++;
    console.log(
      `${ok ? "OK   " : "FALLA"} ${ratio.toFixed(2).padStart(6)}:1  (min 3)  ${material}, ${etiqueta}`,
    );
  }
}

console.log(
  fallos === 0
    ? "\nLos dos materiales pasan el piso de accesibilidad."
    : `\n${fallos} ${fallos === 1 ? "par no pasa" : "pares no pasan"} el piso.`,
);
process.exitCode = fallos === 0 ? 0 : 1;
