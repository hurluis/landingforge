/** Codificador PNG mínimo — solo lo que hacen falta los dos generadores de assets. */
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

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

/**
 * @param {string} ruta
 * @param {number} ancho
 * @param {number} alto
 * @param {Uint8Array} rgba  ancho*alto*4
 * @param {number} tipoColor 6 = RGBA, 4 = gris+alfa
 * @param {number} canales   canales por píxel en `rgba`
 */
export function escribirPNG(ruta, ancho, alto, rgba, tipoColor = 6, canales = 4) {
  const filas = [];
  for (let y = 0; y < alto; y++) {
    const fila = Buffer.alloc(1 + ancho * canales);
    fila[0] = 0; // filtro None
    rgba.subarray(y * ancho * canales, (y + 1) * ancho * canales).forEach((v, i) => {
      fila[1 + i] = v;
    });
    filas.push(fila);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0);
  ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8;
  ihdr[9] = tipoColor;

  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(filas), { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, png);
  return png.length;
}

/** PRNG determinista (xorshift32). Semilla fija = asset reproducible. */
export function crearRandom(semilla) {
  let estado = semilla >>> 0;
  return () => {
    estado ^= estado << 13;
    estado ^= estado >>> 17;
    estado ^= estado << 5;
    estado >>>= 0;
    return estado / 0xffffffff;
  };
}

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
export const mezcla = (a, b, t) => a + (b - a) * t;
export const suave = (borde0, borde1, x) => {
  const t = clamp((x - borde0) / (borde1 - borde0));
  return t * t * (3 - 2 * t);
};
