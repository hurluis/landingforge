/**
 * Genera public/textura/grano.png — un mosaico de ruido real de 128×128.
 *
 * §4.8 prohíbe feTurbulence y el grano sintético de filtro SVG: el grano de
 * La Forja tiene que venir de un asset de ruido real. Este script lo produce
 * de forma determinista (semilla fija) para que el asset sea reproducible y
 * versionable, en vez de descargarse de un banco de texturas.
 *
 *   node scripts/generar-textura.mjs
 */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LADO = 128;
const SEMILLA = 0x5f3a91c7;

/** PRNG determinista (xorshift32). Semilla fija = asset reproducible. */
function crearRandom(semilla) {
  let estado = semilla >>> 0;
  return () => {
    estado ^= estado << 13;
    estado ^= estado >>> 17;
    estado ^= estado << 5;
    estado >>>= 0;
    return estado / 0xffffffff;
  };
}

const tablaCrc = (() => {
  const tabla = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c;
  }
  return tabla;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = tablaCrc[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, "ascii"), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

const random = crearRandom(SEMILLA);

/* Escala de grises con canal alfa: el grano modula luminancia, no color.
   Dos octavas — una fina (grano de película) y una gruesa (irregularidad
   del revelado) — para que no se lea como ruido de televisor. */
const finas = new Float32Array(LADO * LADO);
for (let i = 0; i < finas.length; i++) finas[i] = random();

const gruesoLado = LADO / 4;
const gruesas = new Float32Array(gruesoLado * gruesoLado);
for (let i = 0; i < gruesas.length; i++) gruesas[i] = random();

const filas = [];
for (let y = 0; y < LADO; y++) {
  const fila = Buffer.alloc(1 + LADO * 2);
  fila[0] = 0; // filtro None
  for (let x = 0; x < LADO; x++) {
    const fino = finas[y * LADO + x];
    const grueso = gruesas[Math.floor(y / 4) * gruesoLado + Math.floor(x / 4)];
    const v = fino * 0.72 + grueso * 0.28;
    fila[1 + x * 2] = Math.round(v * 255); // gris
    fila[2 + x * 2] = 255; // alfa
  }
  filas.push(fila);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(LADO, 0);
ihdr.writeUInt32BE(LADO, 4);
ihdr[8] = 8; // 8 bits por muestra
ihdr[9] = 4; // gris + alfa
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(Buffer.concat(filas), { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);

const destino = resolve(dirname(fileURLToPath(import.meta.url)), "../public/textura/grano.png");
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, png);

console.log(`grano.png · ${LADO}×${LADO} · ${png.length} bytes · semilla ${SEMILLA}`);
