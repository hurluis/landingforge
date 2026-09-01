/**
 * LAS FORMAS · las nubes de puntos por las que pasa la constelación del fondo.
 *
 * Aquí no hay three, ni WebGL, ni DOM: solo `Float32Array` con coordenadas.
 * Está separado a propósito. La geometría es lo único de la constelación que
 * se puede razonar leyendo, y mezclarla con el montaje de la escena es lo que
 * convierte un fondo en un archivo que nadie vuelve a abrir.
 *
 * Cada forma significa el tramo de la página sobre el que se posa, porque un
 * objeto de fondo que no significa nada sobra:
 *
 *   chispa   · el hero, después del primer scroll. Un golpe sobre metal
 *              caliente, congelado: núcleo denso y reguero de filamentos.
 *   rejilla  · «las plantillas venden lo mismo diez mil veces». Una retícula
 *              perfecta, sin una sola partícula fuera de sitio y sin un solo
 *              jitter: la forma más muerta que se puede dibujar. La home no la
 *              usa —su sección es de papel y la taparía entera—; la usan las
 *              páginas cortas, donde el reparto es automático.
 *   toroide  · las nueve secciones. Un anillo cerrado: la tira que se recorre
 *              entera y vuelve a empezar.
 *   globo    · la metodología colombiana. Un mercado, un país, un planeta.
 *              Coincide con el pico de temperatura del campo de luz.
 *   helice   · los tres pasos. Tres hebras trenzadas que suben.
 *   lamina   · el cierre. Un plano 9:16 alabeado — el formato que el producto
 *              entrega, ya templado.
 *
 * Además de la figura hay AMBIENTE: partículas que no pertenecen a ninguna
 * forma y ocupan el mismo sitio en todas, así que las transiciones las dejan
 * quietas. Son la atmósfera de la página, no la nube.
 */

const TAU = Math.PI * 2;

export const NOMBRES = ["chispa", "rejilla", "toroide", "globo", "helice", "lamina"] as const;
export type NombreForma = (typeof NOMBRES)[number];

export type Nube = {
  /** Centros de cada partícula, `total * 3` floats, una entrada por forma. */
  formas: Record<NombreForma, Float32Array>;
  /** 1 si la partícula pertenece a la figura, 0 si es ambiente. `total` floats. */
  esForma: Float32Array;
  total: number;
};

/**
 * Generador congruencial lineal. Determinista a propósito: la constelación
 * tiene que ser la misma en cada carga y en cada máquina. Una nube distinta
 * en cada visita no es una identidad de marca, es ruido.
 */
export function aleatorio(semilla: number): () => number {
  let s = semilla >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Dirección uniforme sobre la esfera. Muestrear en z evita los polos densos. */
function direccion(r: () => number): [number, number, number] {
  const z = r() * 2 - 1;
  const a = r() * TAU;
  const s = Math.sqrt(Math.max(0, 1 - z * z));
  return [s * Math.cos(a), s * Math.sin(a), z];
}

/* ------------------------------------------------------------------ */

/**
 * El golpe. Mitad nube con caída radial —densa en el centro y deshilachada en
 * el borde—, mitad filamentos que salen disparados.
 *
 * Las dos mitades hacen falta. Solo nube es una bola de algodón y no significa
 * nada; solo filamentos son treinta cadenas de cuentas que se leen como
 * escombros y no como una chispa. Juntas dan lo que se ve cuando el martillo
 * pega: una masa incandescente con reguero.
 */
function chispa(d: Float32Array, n: number, r: () => number) {
  const RAMAS = 84;
  const ejes: [number, number, number][] = [];
  for (let k = 0; k < RAMAS; k++) ejes.push(direccion(r));

  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) {
      /* Exponente por encima de 1: la mitad de las partículas caben en el
         tercio interior, así el centro pesa y el borde se deshace. */
      const [x, y, z] = direccion(r);
      const rad = Math.pow(r(), 1.7) * 1.02;
      d[i * 3] = x * rad;
      d[i * 3 + 1] = y * rad * 0.86;
      d[i * 3 + 2] = z * rad;
      continue;
    }
    const e = ejes[i % RAMAS];
    /* Exponente por debajo de 1: la rama se puebla más cerca de la punta que
       del centro, que es como se ven las chispas de verdad. */
    const largo = 0.22 + Math.pow(r(), 0.8) * 0.92;
    const disp = largo * 0.12;
    d[i * 3] = e[0] * largo + (r() - 0.5) * disp;
    d[i * 3 + 1] = e[1] * largo * 0.86 + (r() - 0.5) * disp;
    d[i * 3 + 2] = e[2] * largo + (r() - 0.5) * disp;
  }
}

/** La plantilla. Retícula exacta, sin ruido. Ninguna partícula es especial. */
function rejilla(d: Float32Array, n: number) {
  const gz = 5;
  const gx = Math.max(2, Math.ceil(Math.sqrt((n / gz) * 1.5)));
  const gy = Math.max(2, Math.ceil(n / (gz * gx)));
  const ax = 1.66;
  const ay = 1.10;
  const az = 0.56;

  for (let i = 0; i < n; i++) {
    const x = i % gx;
    const y = Math.floor(i / gx) % gy;
    const z = Math.floor(i / (gx * gy)) % gz;
    d[i * 3] = (x / (gx - 1) - 0.5) * ax;
    d[i * 3 + 1] = (y / (gy - 1) - 0.5) * ay;
    d[i * 3 + 2] = (z / (gz - 1) - 0.5) * az;
  }
}

/** El anillo. Ángulo de tubo por razón áurea: cubre sin bandas ni costuras. */
function toroide(d: Float32Array, n: number, r: () => number) {
  const R = 0.72;
  const t = 0.24;
  const inc = Math.cos(0.52);
  const ins = Math.sin(0.52);

  for (let i = 0; i < n; i++) {
    const anillo = (i / n) * TAU;
    const tubo = ((i * 0.6180339887) % 1) * TAU;
    const cr = R + t * Math.cos(tubo);
    const x = cr * Math.cos(anillo) + (r() - 0.5) * 0.03;
    const y = t * Math.sin(tubo) + (r() - 0.5) * 0.03;
    const z = cr * Math.sin(anillo) + (r() - 0.5) * 0.03;
    /* Inclinado sobre X: un anillo visto de canto es una línea. */
    d[i * 3] = x;
    d[i * 3 + 1] = y * inc - z * ins;
    d[i * 3 + 2] = y * ins + z * inc;
  }
}

/** El planeta. Espiral de Fibonacci más un halo de satélites sueltos. */
function globo(d: Float32Array, n: number, r: () => number) {
  const RAD = 0.80;
  const halo = Math.floor(n * 0.12);
  const piel = Math.max(2, n - halo);

  for (let i = 0; i < piel; i++) {
    const y = 1 - (i / (piel - 1)) * 2;
    const anillo = Math.sqrt(Math.max(0, 1 - y * y));
    const th = i * 2.39996323; // ángulo áureo
    const j = 1 + (r() - 0.5) * 0.07;
    d[i * 3] = Math.cos(th) * anillo * RAD * j;
    d[i * 3 + 1] = y * RAD * j;
    d[i * 3 + 2] = Math.sin(th) * anillo * RAD * j;
  }
  for (let i = piel; i < n; i++) {
    const [x, y, z] = direccion(r);
    const rad = RAD * (1.24 + r() * 0.6);
    d[i * 3] = x * rad;
    d[i * 3 + 1] = y * rad;
    d[i * 3 + 2] = z * rad;
  }
}

/** Los tres pasos. Tres hebras, misma altura, desfasadas un tercio de vuelta. */
function helice(d: Float32Array, n: number, r: () => number) {
  const HEBRAS = 3;
  const VUELTAS = 2.15;
  const porHebra = Math.max(2, Math.floor(n / HEBRAS));

  for (let i = 0; i < n; i++) {
    const hebra = i % HEBRAS;
    const k = Math.min(1, Math.floor(i / HEBRAS) / (porHebra - 1));
    const ang = k * TAU * VUELTAS + (hebra / HEBRAS) * TAU;
    /* Cintura: la hélice se estrecha en el centro, como una pieza torneada. */
    const rad = 0.40 - Math.cos(k * Math.PI) * 0.06;
    const j = 0.035;
    d[i * 3] = Math.cos(ang) * rad + (r() - 0.5) * j;
    d[i * 3 + 1] = (k - 0.5) * 1.66 + (r() - 0.5) * j;
    d[i * 3 + 2] = Math.sin(ang) * rad + (r() - 0.5) * j;
  }
}

/** La pieza entregada: un plano 9:16, alabeado apenas para que coja luz. */
function lamina(d: Float32Array, n: number, r: () => number) {
  const W = 0.66;
  const H = 1.17; // 9:16
  const cols = Math.max(2, Math.ceil(Math.sqrt(n * (W / H))));
  const filas = Math.max(2, Math.ceil(n / cols));

  for (let i = 0; i < n; i++) {
    const u = (i % cols) / (cols - 1);
    const v = Math.min(1, Math.floor(i / cols) / (filas - 1));
    const j = 0.014;
    d[i * 3] = (u - 0.5) * W + (r() - 0.5) * j;
    d[i * 3 + 1] = (0.5 - v) * H + (r() - 0.5) * j;
    d[i * 3 + 2] = Math.sin(u * 5.2 + v * 3.1) * 0.07;
  }
}

/* ------------------------------------------------------------------ */

const GENERADORES: Record<NombreForma, (d: Float32Array, n: number, r: () => number) => void> = {
  chispa,
  rejilla,
  toroide,
  globo,
  helice,
  lamina,
};

/**
 * Construye la nube completa: `figura` partículas que cambian de forma y
 * `ambiente` que no. Las de ambiente ocupan exactamente la misma posición en
 * todas las formas, así que ninguna transición las mueve de sitio.
 *
 * El volumen de ambiente es más ancho que el encuadre a propósito: la nube
 * de la figura viaja con el scroll, y si el ambiente midiera lo mismo que la
 * pantalla se le vería el borde.
 *
 * Las de ambiente van REPARTIDAS entre las de la figura, no apiladas al final.
 * Es lo que hace que el guardarraíl de rendimiento pueda recortar el número de
 * instancias y llevarse la misma proporción de nube y de atmósfera: con los dos
 * bloques separados, cortar la cola habría borrado el ambiente entero y dejado
 * la figura intacta. El reparto es tipo Bresenham —exacto, sin sorteo—, así que
 * la nube sigue siendo la misma en cada carga.
 */
export function construirNube(figura: number, ambiente: number, semilla = 20260901): Nube {
  const total = figura + ambiente;
  const r = aleatorio(semilla);

  const esForma = new Float32Array(total);
  const deFigura = new Int32Array(figura);
  const deAmbiente = new Int32Array(ambiente);
  let nf = 0;
  let na = 0;
  for (let i = 0; i < total; i++) {
    const toca = Math.floor(((i + 1) * ambiente) / total) > Math.floor((i * ambiente) / total);
    if ((toca && na < ambiente) || nf >= figura) {
      deAmbiente[na++] = i;
    } else {
      esForma[i] = 1;
      deFigura[nf++] = i;
    }
  }

  const compacta = new Float32Array(figura * 3);
  const formas = {} as Record<NombreForma, Float32Array>;
  NOMBRES.forEach((nombre, i) => {
    compacta.fill(0);
    GENERADORES[nombre](compacta, figura, aleatorio(semilla + 1 + i));
    const destino = new Float32Array(total * 3);
    for (let k = 0; k < figura; k++) {
      const d = deFigura[k] * 3;
      destino[d] = compacta[k * 3];
      destino[d + 1] = compacta[k * 3 + 1];
      destino[d + 2] = compacta[k * 3 + 2];
    }
    formas[nombre] = destino;
  });

  for (let k = 0; k < ambiente; k++) {
    const x = (r() - 0.5) * 8.8;
    const y = (r() - 0.5) * 5.6;
    const z = -0.8 + (r() - 0.5) * 3.2;
    const d = deAmbiente[k] * 3;
    for (const nombre of NOMBRES) {
      const f = formas[nombre];
      f[d] = x;
      f[d + 1] = y;
      f[d + 2] = z;
    }
  }

  return { formas, esForma, total };
}
