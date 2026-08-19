/**
 * Genera public/pieza/frasco.png — el bodegón de producto que La Forja revela.
 *
 * §4.7 pide que la animación corra sobre una imagen real, no sobre un
 * placeholder. Como F4 (generación de imágenes) está fuera de alcance en esta
 * entrega, el asset se produce aquí: un render de estudio calculado píxel a
 * píxel con el mismo esquema de luz que la metodología prescribe —luz clave
 * cálida arriba a la derecha, luz de contorno fría a la izquierda, sombra de
 * contacto con desplazamiento y desenfoque—. Es determinista y versionable,
 * y no arrastra licencias de un banco de imágenes.
 *
 *   node scripts/generar-pieza.mjs
 */
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { escribirPNG, crearRandom, clamp, mezcla, suave } from "./lib-png.mjs";

const ANCHO = 540;
const ALTO = 960;
const random = crearRandom(0x21b7c4e9);

/* Geometría del frasco, en coordenadas normalizadas (0–1).
   El cuerpo es un rectángulo con hombros y base redondeados: un cilindro de
   vidrio real no tiene esquinas vivas. */
const FRASCO = {
  cx: 0.5,
  cuerpoArriba: 0.35,
  cuerpoAbajo: 0.79,
  radio: 0.158,
  redondeo: 0.03,
  tapaArriba: 0.275,
  tapaRadio: 0.118,
};

/** Distancia con signo a un rectángulo redondeado, en unidades de `v`. */
function silueta(u, v) {
  const semiAncho = FRASCO.radio - FRASCO.redondeo;
  const cy = (FRASCO.cuerpoArriba + FRASCO.cuerpoAbajo) / 2;
  const semiAlto = (FRASCO.cuerpoAbajo - FRASCO.cuerpoArriba) / 2 - FRASCO.redondeo;
  const qx = Math.max(Math.abs(u - FRASCO.cx) - semiAncho, 0);
  const qy = Math.max(Math.abs(v - cy) - semiAlto, 0);
  const dentro =
    Math.min(Math.max(Math.abs(u - FRASCO.cx) - semiAncho, Math.abs(v - cy) - semiAlto), 0);
  return Math.hypot(qx, qy) + dentro - FRASCO.redondeo;
}

const px = new Uint8Array(ANCHO * ALTO * 4);

function ponerPixel(i, r, g, b, a = 255) {
  px[i] = clamp(r, 0, 255);
  px[i + 1] = clamp(g, 0, 255);
  px[i + 2] = clamp(b, 0, 255);
  px[i + 3] = a;
}

for (let y = 0; y < ALTO; y++) {
  const v = y / ALTO;
  for (let x = 0; x < ANCHO; x++) {
    const u = x / ANCHO;
    const i = (y * ANCHO + x) * 4;

    /* ---- Fondo: seamless de estudio, cálido, con caída vertical ---- */
    let r = mezcla(46, 20, v);
    let g = mezcla(38, 16, v);
    let b = mezcla(31, 14, v);

    /* Luz clave cálida arriba a la derecha */
    const dKey = Math.hypot((u - 0.74) * 1.15, (v - 0.16) * 0.9);
    const key = Math.pow(1 - suave(0.0, 0.72, dKey), 1.6);
    r += key * 118;
    g += key * 92;
    b += key * 58;

    /* Luz de contorno fría a la izquierda */
    const dRim = Math.hypot((u - 0.06) * 1.4, (v - 0.5) * 0.55);
    const rim = Math.pow(1 - suave(0.0, 0.7, dRim), 2.2);
    r += rim * 22;
    g += rim * 34;
    b += rim * 62;

    /* Viñeta: el ojo va al producto, no a las esquinas */
    const vig = 1 - 0.55 * suave(0.42, 1.05, Math.hypot(u - 0.5, (v - 0.46) * 0.85) * 1.6);
    r *= vig;
    g *= vig;
    b *= vig;

    /* ---- Sombra de contacto: desplazada y desenfocada, la luz viene de arriba ---- */
    const sombraX = (u - (FRASCO.cx + 0.045)) / 0.29;
    const sombraY = (v - (FRASCO.cuerpoAbajo + 0.022)) / 0.045;
    const sombra = 1 - suave(0.0, 1.0, Math.hypot(sombraX, sombraY));
    const oscurecer = 1 - sombra * 0.78;
    r *= oscurecer;
    g *= oscurecer;
    b *= oscurecer;

    /* ---- Frasco ---- */
    const dx = (u - FRASCO.cx) / FRASCO.radio; // −1..1 dentro del cuerpo
    const sd = silueta(u, v);
    const dentroCuerpo = sd < 0;

    const dxTapa = (u - FRASCO.cx) / FRASCO.tapaRadio;
    const dentroTapa =
      Math.abs(dxTapa) <= 1 && v >= FRASCO.tapaArriba && v < FRASCO.cuerpoArriba + 0.005;

    if (dentroTapa) {
      /* Tapa: metal oscuro, cilíndrica, con estrías verticales sutiles */
      const cil = Math.sqrt(clamp(1 - dxTapa * dxTapa));
      const estria = 0.94 + 0.06 * Math.cos(dxTapa * 34);
      const luz = (0.24 + 0.76 * Math.pow(cil, 0.6)) * estria;
      const especular = Math.pow(clamp(1 - Math.abs(dxTapa - 0.42) * 4.2), 6) * 0.85;
      r = 44 * luz + especular * 210;
      g = 38 * luz + especular * 186;
      b = 32 * luz + especular * 150;
      /* Borde superior de la tapa, biselado */
      const bisel = suave(FRASCO.tapaArriba, FRASCO.tapaArriba + 0.012, v);
      r *= mezcla(1.45, 1, bisel);
      g *= mezcla(1.4, 1, bisel);
      b *= mezcla(1.3, 1, bisel);
    } else if (dentroCuerpo) {
      /* Cuerpo: vidrio ámbar. Sombreado cilíndrico + transmisión de luz. */
      const cil = Math.sqrt(clamp(1 - dx * dx));
      const alturaLocal = suave(FRASCO.cuerpoArriba, FRASCO.cuerpoAbajo, v);

      const base = 0.2 + 0.8 * Math.pow(cil, 0.55);
      /* El vidrio deja pasar luz: el borde opuesto a la clave se enciende */
      const transmision = Math.pow(clamp(1 - Math.abs(dx + 0.72) * 2.6), 3) * 0.55;
      const luz = base * mezcla(1.08, 0.72, alturaLocal) + transmision;

      r = 196 * luz;
      g = 118 * luz;
      b = 44 * luz;

      /* Banda especular de la luz clave */
      const especular = Math.pow(clamp(1 - Math.abs(dx - 0.46) * 3.4), 7);
      r += especular * 200;
      g += especular * 178;
      b += especular * 132;

      /* Contorno frío del lado izquierdo */
      const contorno = Math.pow(clamp(1 - Math.abs(dx + 0.94) * 9), 3);
      r += contorno * 40;
      g += contorno * 62;
      b += contorno * 116;

      /* Etiqueta: banda de papel mate en el tercio central */
      const etiquetaArriba = 0.5;
      const etiquetaAbajo = 0.71;
      if (v > etiquetaArriba && v < etiquetaAbajo) {
        const bordeH = suave(etiquetaArriba, etiquetaArriba + 0.006, v) *
          (1 - suave(etiquetaAbajo - 0.006, etiquetaAbajo, v));
        const papel = 0.35 + 0.65 * Math.pow(cil, 0.5);
        const lr = mezcla(r, 236 * papel, bordeH * 0.94);
        const lg = mezcla(g, 230 * papel, bordeH * 0.94);
        const lb = mezcla(b, 218 * papel, bordeH * 0.94);
        r = lr;
        g = lg;
        b = lb;

        /* Dos filetes impresos, para que la etiqueta lea como etiqueta */
        for (const fy of [0.545, 0.665]) {
          const filete = 1 - suave(0.0, 0.0045, Math.abs(v - fy));
          const dentroFilete = Math.abs(dx) < 0.62 ? filete : 0;
          r = mezcla(r, 60 * papel, dentroFilete * bordeH);
          g = mezcla(g, 44 * papel, dentroFilete * bordeH);
          b = mezcla(b, 30 * papel, dentroFilete * bordeH);
        }
      }

      /* Antialias del contorno completo, desde la distancia con signo */
      const borde = suave(0.0, -0.0025, sd);
      r = mezcla(mezcla(28, 16, v), r, borde);
      g = mezcla(mezcla(24, 13, v), g, borde);
      b = mezcla(mezcla(20, 11, v), b, borde);
    }

    /* ---- Grano fotográfico: el mismo mundo material del resto del sistema ---- */
    const ruido = (random() - 0.5) * 3.5;
    ponerPixel(i, r + ruido, g + ruido, b + ruido);
  }
}

const destino = resolve(dirname(fileURLToPath(import.meta.url)), "../public/pieza/frasco.png");
const bytes = escribirPNG(destino, ANCHO, ALTO, px);
console.log(`frasco.png · ${ANCHO}×${ALTO} · ${(bytes / 1024).toFixed(0)} KB`);
