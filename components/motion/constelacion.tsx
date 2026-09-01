"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion, type MotionValue } from "motion/react";
import { aleatorio, construirNube, NOMBRES, type NombreForma } from "@/components/motion/formas";

/**
 * LA CONSTELACIÓN · el objeto 3D del fondo.
 *
 * Sustituye al martillo. Un martillo era un objeto: entraba, cruzaba y salía,
 * y decía una sola cosa durante toda la página. Esto es un material: miles de
 * triángulos diminutos que se reorganizan en una figura distinta sobre cada
 * sección, y que por tanto pueden decir seis cosas seguidas sin cambiar de
 * identidad. Es la misma idea que hace funcionar la referencia —una nube de
 * partículas que se transforma con el scroll— traída a esta paleta y a este
 * argumento, no copiada con sus colores.
 *
 * Qué hace, y por qué:
 *
 *   Cambia de forma con la sección, no con un reloj. Cada figura significa el
 *   tramo sobre el que se posa (ver `formas.ts`): la retícula muerta cae justo
 *   donde el texto acusa a las plantillas de vender lo mismo diez mil veces, y
 *   el globo cae justo donde la página habla de vender en Colombia. Las anclas
 *   se miden del DOM real, no de fracciones a ojo, así que si mañana se añade
 *   una sección la coreografía sigue cuadrando sola.
 *
 *   Se calienta. Misma curva de temperatura que el campo de luz y que tenía la
 *   pieza: acero frío arriba, incandescencia en el método, templado al cerrar.
 *   El color sigue significando estado del trabajo.
 *
 *   Suelta chispas al cambiar. Durante la transición las partículas se abren
 *   hacia fuera y brillan, y vuelven a cerrarse en la forma siguiente. Un golpe
 *   sobre metal caliente hace exactamente eso, y evita el efecto de sopa que
 *   tiene un morfeo interpolado en línea recta.
 *
 *   Escalona. Cada partícula sale con su propio retraso, así que la nube se
 *   reorganiza como un enjambre y no como un bloque.
 *
 * Piso de rendimiento, que aquí no es opcional porque esto es una superficie
 * de persuasión y no un visor de producto:
 *
 *   · `three` entra por `import()` en tiempo ocioso: cero bytes en el bundle
 *     inicial, cero competencia con el LCP.
 *   · Cero assets. La nube se calcula al vuelo; no hay .gltf, ni .bin, ni
 *     texturas, ni una sola petición de red.
 *   · UNA llamada de dibujo para toda la constelación. Geometría instanciada:
 *     seis vértices de plantilla y el resto son atributos por instancia. El
 *     morfeo, el giro y el calor ocurren en el vertex shader; la CPU solo
 *     escribe uniformes.
 *   · El bucle no toca React ni una vez por frame: lee `window.scrollY` y
 *     escribe uniformes. En reposo baja a 30 fps y con la pestaña oculta se
 *     apaga del todo.
 *   · Al cambiar de tramo se copian dos buffers de `total * 3` floats. Ocurre
 *     cinco veces en toda la página.
 *
 * Degradación: sin WebGL no se monta y queda el campo de luz, que ya era un
 * fondo completo por sí solo. Con movimiento reducido se monta pero no anima:
 * dibuja UN fotograma de la primera figura y suelta el bucle. Movimiento
 * reducido significa menos movimiento, no una página desnuda.
 */
export function Constelacion({ luzX, luzY }: { luzX?: MotionValue<number>; luzY?: MotionValue<number> }) {
  const reduce = useReducedMotion();
  const lienzo = useRef<HTMLCanvasElement>(null);
  /* Los valores del puntero entran por ref para que cambiarlos no vuelva a
     montar la escena entera. */
  const luz = useRef<{ x?: MotionValue<number>; y?: MotionValue<number> }>({});
  useEffect(() => {
    luz.current = { x: luzX, y: luzY };
  }, [luzX, luzY]);

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;

    let vivo = true;
    let desmontar: (() => void) | undefined;

    const arrancar = async () => {
      /* Si no hay WebGL no se descarga ni three: la sonda cuesta un contexto
         que se devuelve acto seguido, y evita además el error de consola que
         suelta el renderer al no poder crear el suyo. */
      if (!hayWebGL()) return;
      try {
        const THREE = await import("three");
        if (!vivo) return;
        desmontar = montar(THREE, canvas, Boolean(reduce), luz);
      } catch {
        /* Sin WebGL o con el módulo bloqueado: queda el campo de luz y no se
           entera nadie. */
      }
    };

    /* En tiempo ocioso: primero que pinte y sea interactiva la página. */
    const ocioso =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(() => void arrancar(), { timeout: 2500 })
        : window.setTimeout(() => void arrancar(), 600);

    return () => {
      vivo = false;
      if (typeof window.cancelIdleCallback === "function" && typeof ocioso === "number") {
        window.cancelIdleCallback(ocioso);
      }
      window.clearTimeout(ocioso as number);
      desmontar?.();
    };
  }, [reduce]);

  return (
    <canvas
      ref={lienzo}
      aria-hidden
      /* Empieza transparente: el fade lo hace el bucle en el primer fotograma
         con la nube ya colocada, para que nunca se vea aparecer en el sitio
         equivocado. */
      className="pointer-events-none absolute inset-0 size-full opacity-0 transition-opacity duration-700 ease-[var(--ease-out)]"
    />
  );
}

/* ------------------------------------------------------------------ */

/** ¿Hay WebGL? Se prueba con un lienzo de usar y tirar, y se devuelve el
 *  contexto en el acto: los navegadores solo permiten unos pocos vivos. */
function hayWebGL() {
  try {
    const lienzo = document.createElement("canvas");
    const gl = lienzo.getContext("webgl2") ?? lienzo.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

type Three = typeof import("three");

/** Distancia de la cámara a la nube. Fija: el encuadre se ajusta con el FOV. */
const DISTANCIA = 3.4;
const FOV = 34;

/**
 * Techo de opacidad. Es lo que la mantiene siendo fondo. A plena opacidad una
 * nube de partículas aditivas compite con el titular, y en una página cuyo
 * trabajo es persuadir, lo que compite con el titular sobra.
 */
const OPACIDAD = 0.45;

/**
 * En vertical el texto ocupa el ancho entero y la nube no tiene por dónde
 * pasar sin cruzarlo. Ahí se retira: más pequeña, menos partículas y más
 * apagada. El teléfono es donde se lee y donde se compra; el adorno cede.
 */
const OPACIDAD_COMPACTA = 0.24;

/** Cuántas partículas. La figura cambia de forma; el ambiente nunca se mueve. */
const CENSO = {
  ancho: { figura: 2400, ambiente: 750 },
  compacto: { figura: 950, ambiente: 300 },
} as const;

/**
 * Guardarraíl de rendimiento. Un fondo no puede costarle fotogramas a la
 * página. Si la mediana de fotograma durante el scroll pasa de este techo, la
 * constelación se recorta ella sola —menos instancias y un píxel por píxel— en
 * vez de dejar la página a tirones. Medido: el coste crece con el número de
 * instancias, así que recortarlas es la palanca que sirve.
 */
const TECHO_MS = 26;
const RECORTE = 0.45;

/**
 * Dónde se posa cada figura. Se busca la SECCIÓN por el `aria-labelledby` que
 * ya tiene puesto, así que la coreografía no depende de ningún atributo nuevo
 * ni de ninguna fracción escrita a mano: si la página crece, las anclas se
 * vuelven a medir solas. `en` es la altura DENTRO de la sección donde la figura
 * queda formada, y puede ser negativa para posarse justo antes de que llegue.
 *
 * La regla que ordena todo esto: las figuras se posan sobre las secciones
 * OSCURAS y los cambios ocurren sobre las de PAPEL. El papel es opaco, así que
 * tapa el fondo entero; usarlo de telón hace que la nube desaparezca siendo una
 * cosa y reaparezca siendo otra, que es mejor que verla derretirse. Por eso
 * ninguna figura está anclada a una sección de papel aunque su significado
 * viviera ahí: una figura invisible no significa nada.
 *
 *   chispa  · el hero. El golpe: la nube envuelve el fotograma que se está
 *             formando, como las chispas envuelven la pieza en el yunque.
 *   toroide · la tira de las nueve secciones: un anillo que se recorre entero
 *             y vuelve a empezar.
 *   globo   · se forma al FINAL de la tira, para que ya esté ahí cuando entra
 *             la sección de vender en Colombia, que es de papel y la taparía.
 *   helice  · los tres pasos y el estudio en vivo. Tres hebras que suben.
 *   lamina  · el cierre. El plano 9:16 que el producto entrega, ya templado.
 *
 * `peso` es cuánta presencia se le permite a cada figura. No todas las
 * secciones tienen el mismo sitio libre: el hero y el cierre son dos titulares
 * y aire, y la nube puede ocuparlos entera; la tira de las nueve secciones es
 * lo más cargado de la página —nueve tarjetas, sus etiquetas y una barra de
 * progreso— y ahí el fondo tiene que retirarse o le come el contraste a las
 * etiquetas de 13px. Medido: sin retirarse, «06 Autoridad» cae de 5,18:1 a
 * 3,83:1, por debajo del piso de 4,5:1 del propio proyecto. Esto no es un
 * ajuste de gusto, es el fondo cediendo donde la página tiene trabajo que hacer.
 *
 * Son cinco y no seis. La `rejilla` significaba el mundo de las plantillas y su
 * sección es de papel, así que no se vería nunca; ponerla en cualquier otro
 * sitio le habría quitado el significado, que era lo único que la justificaba.
 * Sigue existiendo y la usa el reparto automático de las páginas cortas, donde
 * no hay secciones que anclar y el orden lo pone `NOMBRES`.
 */
const MAPA: ReadonlyArray<{ sel: string; forma: NombreForma; en: number; peso: number }> = [
  { sel: '[aria-labelledby="hero-titulo"]', forma: "chispa", en: 0.1, peso: 1 },
  { sel: '[aria-labelledby="tira-titulo"],[aria-labelledby="tira-titulo-movil"]', forma: "toroide", en: 0.3, peso: 0.4 },
  { sel: '[aria-labelledby="metodologia-titulo"]', forma: "globo", en: -0.35, peso: 0.85 },
  { sel: '[aria-labelledby="pasos-titulo"]', forma: "helice", en: 0.45, peso: 0.7 },
  { sel: '[aria-labelledby="cierre-titulo"]', forma: "lamina", en: 0.5, peso: 1 },
];

/** Paleta de la nube. Pesos: el acero manda y el color es el acento. */
const PALETA: ReadonlyArray<[number, number]> = [
  [0x7c8794, 0.40], // acero frío, el material sin trabajar
  [0xffa05c, 0.16], // ember
  [0xff5c2b, 0.12], // heat
  [0xc9a063, 0.12], // forged
  [0x5cc8ff, 0.11], // quench
  [0xf4f5f7, 0.09], // ash, las pocas que van al blanco
];

const CALIENTE = 0xff5c2b;
const ORO = 0xc9a063;

const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;
const rampa = (t: number) => Math.max(0, Math.min(1, t));
/** Componentes sRGB 0..1. El shader escribe crudo, sin gestión de color. */
const rgb = (hex: number): [number, number, number] => [
  ((hex >> 16) & 255) / 255,
  ((hex >> 8) & 255) / 255,
  (hex & 255) / 255,
];

/**
 * Curva de temperatura del recorrido. Idéntica en forma a la del campo de luz:
 * frío arriba, incandescente hacia el método, templado al cerrar.
 */
function temperatura(p: number) {
  if (p < 0.45) return rampa(p / 0.45);
  if (p < 0.8) return mezcla(1, 0.45, rampa((p - 0.45) / 0.35));
  return mezcla(0.45, 0.22, rampa((p - 0.8) / 0.2));
}

/** Interpolación por fotogramas clave, para escribir trayectorias legibles. */
function curva(t: number, claves: ReadonlyArray<readonly [number, number]>) {
  if (t <= claves[0][0]) return claves[0][1];
  for (let i = 1; i < claves.length; i++) {
    if (t <= claves[i][0]) {
      const [a, va] = claves[i - 1];
      const [b, vb] = claves[i];
      return mezcla(va, vb, (t - a) / (b - a));
    }
  }
  return claves[claves.length - 1][1];
}

const VERTEX = /* glsl */ `
attribute vec3 iDesde;
attribute vec3 iHasta;
attribute vec3 iEjeX;
attribute vec3 iEjeY;
attribute vec3 iTinte;
attribute float iSemilla;
attribute float iTam;
attribute float iBrillo;
attribute float iForma;

uniform float uT;
uniform float uTiempo;
uniform float uCalor;
uniform float uTemplado;
uniform float uEscalaNube;
uniform float uEscalaGlifo;
uniform mat3  uGiro;
uniform vec3  uCentro;
uniform mat3  uGiroAmb;
uniform vec3  uCentroAmb;
uniform vec3  uCaliente;
uniform vec3  uOro;
uniform float uCerca;
uniform float uLejos;
uniform float uPeso;

varying vec3  vColor;
varying float vAlfa;

void main() {
  /* Escalonado: cada partícula sale con su propio retraso. Sin esto la nube
     se reorganiza como un bloque y se ve el truco. */
  float t = clamp((uT - iSemilla * 0.28) / 0.72, 0.0, 1.0);
  t = t * t * (3.0 - 2.0 * t);

  vec3 base = mix(iDesde, iHasta, t);

  /* En mitad del cambio la partícula se abre hacia fuera y vuelve: el golpe
     levanta chispas antes de que la pieza se cierre en la forma siguiente. */
  float pico = sin(t * 3.14159265);
  base += normalize(base + vec3(1e-4)) * pico * mix(0.08, 0.24, iForma);

  /* Deriva: la nube nunca queda del todo quieta, ni siquiera en reposo. */
  float f = uTiempo * 0.35 + iSemilla * 6.2831853;
  base += vec3(sin(f), cos(f * 0.83), sin(f * 1.27)) * mix(0.030, 0.016, iForma);

  vec3 loc = position.x * iEjeX + position.y * iEjeY;

  /* La figura viaja y gira con el scroll; el ambiente se queda donde está y
     solo deriva. Se resuelve con dos transformaciones y una mezcla, y así toda
     la constelación cabe en una sola llamada de dibujo. */
  vec3 cFig = uGiro * (base * uEscalaNube) + uCentro;
  vec3 cAmb = uGiroAmb * base + uCentroAmb;
  vec3 c    = mix(cAmb, cFig, iForma);
  vec3 lFig = uGiro * loc;
  vec3 lAmb = uGiroAmb * loc;
  vec3 l    = mix(lAmb, lFig, iForma);

  vec3 mundo = c + l * iTam * uEscalaGlifo * (1.0 + pico * 0.35);
  vec4 mv = modelViewMatrix * vec4(mundo, 1.0);
  gl_Position = projectionMatrix * mv;

  /* Color: la paleta de la partícula, calentada por el scroll. El núcleo se
     pone al blanco antes que el borde, como el metal en la fragua. */
  float nucleo = (1.0 - smoothstep(0.12, 1.0, length(base))) * iForma;
  vec3 color = mix(iTinte, uCaliente, uCalor * (0.28 + 0.72 * iSemilla));
  color = mix(color, uOro, uTemplado * 0.5);
  color += nucleo * (0.10 + 0.32 * uCalor);
  color += pico * 0.18 * iForma;

  /* Profundidad: lo que está detrás se apaga, y así la nube tiene volumen.
     La rampa va invertida a mano y no con los bordes cruzados: smoothstep con
     edge0 > edge1 es comportamiento indefinido por especificación de GLSL, y
     hay drivers que lo cumplen al pie de la letra. */
  float prof = 1.0 - smoothstep(uCerca, uLejos, -mv.z);

  vColor = color;
  vAlfa = iBrillo * mix(0.28, 1.0, prof) * uPeso;
}
`;

const FRAGMENT = /* glsl */ `
varying vec3  vColor;
varying float vAlfa;
void main() {
  gl_FragColor = vec4(vColor, clamp(vAlfa, 0.0, 1.0));
}
`;

function montar(
  THREE: Three,
  canvas: HTMLCanvasElement,
  estatico: boolean,
  luz: { current: { x?: MotionValue<number>; y?: MotionValue<number> } },
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: window.devicePixelRatio < 2,
    powerPreference: "low-power",
  });
  renderer.setClearAlpha(0);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(FOV, 1, 0.1, 24);
  camara.position.set(0, 0, DISTANCIA);

  let compacto = window.innerWidth < 768;
  const censo = compacto ? CENSO.compacto : CENSO.ancho;
  const nube = construirNube(censo.figura, censo.ambiente);
  const total = nube.total;

  /* ---- Geometría: seis vértices de plantilla, el resto por instancia ---- */

  const geo = new THREE.InstancedBufferGeometry();
  geo.instanceCount = total;

  const paso = (Math.PI * 2) / 3;
  const esq = [0, 1, 2].map((k) => {
    const a = Math.PI / 2 + k * paso;
    return [Math.cos(a), Math.sin(a)];
  });
  /* Tres aristas: el triángulo va CONTORNEADO, no relleno. Es lo que hace que
     miles de ellos se lean como una constelación y no como una mancha. */
  geo.setAttribute(
    "position",
    new THREE.BufferAttribute(
      new Float32Array([
        esq[0][0], esq[0][1], 0, esq[1][0], esq[1][1], 0,
        esq[1][0], esq[1][1], 0, esq[2][0], esq[2][1], 0,
        esq[2][0], esq[2][1], 0, esq[0][0], esq[0][1], 0,
      ]),
      3,
    ),
  );

  const r = aleatorio(987654321);

  const desde = new Float32Array(total * 3);
  const hasta = new Float32Array(total * 3);
  const ejeX = new Float32Array(total * 3);
  const ejeY = new Float32Array(total * 3);
  const tinte = new Float32Array(total * 3);
  const semilla = new Float32Array(total);
  const tam = new Float32Array(total);
  const brillo = new Float32Array(total);

  /* Reparto acumulado de la paleta, para sortear el tinte de cada partícula. */
  const acumulado: number[] = [];
  let suma = 0;
  for (let i = 0; i < PALETA.length; i++) {
    suma += PALETA[i][1];
    acumulado[i] = suma;
  }

  for (let i = 0; i < total; i++) {
    /* Base ortonormal por partícula: cada triángulo mira a un sitio distinto,
       que es de donde sale la variedad de la referencia. */
    const nz = [r() * 2 - 1, r() * 2 - 1, r() * 2 - 1];
    const ln = Math.hypot(nz[0], nz[1], nz[2]) || 1;
    nz[0] /= ln; nz[1] /= ln; nz[2] /= ln;
    const arriba = Math.abs(nz[1]) > 0.92 ? [1, 0, 0] : [0, 1, 0];
    let x = [
      arriba[1] * nz[2] - arriba[2] * nz[1],
      arriba[2] * nz[0] - arriba[0] * nz[2],
      arriba[0] * nz[1] - arriba[1] * nz[0],
    ];
    const lx = Math.hypot(x[0], x[1], x[2]) || 1;
    x = [x[0] / lx, x[1] / lx, x[2] / lx];
    const y = [
      nz[1] * x[2] - nz[2] * x[1],
      nz[2] * x[0] - nz[0] * x[2],
      nz[0] * x[1] - nz[1] * x[0],
    ];
    ejeX.set(x, i * 3);
    ejeY.set(y, i * 3);

    const sorteo = r();
    let k = 0;
    while (k < acumulado.length - 1 && sorteo > acumulado[k]) k++;
    tinte.set(rgb(PALETA[k][0]), i * 3);

    semilla[i] = r();
    /* Exponente alto: casi todas diminutas y unas pocas grandes. Es el reparto
       de tamaños que tiene la referencia y lo que le da profundidad. */
    tam[i] = 0.0045 + Math.pow(r(), 3) * 0.042;
    brillo[i] = nube.esForma[i] > 0.5 ? 0.38 + r() * 0.4 : 0.13 + r() * 0.22;
  }

  const instancia = (nombre: string, datos: Float32Array, ancho: number) => {
    const attr = new THREE.InstancedBufferAttribute(datos, ancho);
    geo.setAttribute(nombre, attr);
    return attr;
  };

  const aDesde = instancia("iDesde", desde, 3);
  const aHasta = instancia("iHasta", hasta, 3);
  instancia("iEjeX", ejeX, 3);
  instancia("iEjeY", ejeY, 3);
  instancia("iTinte", tinte, 3);
  instancia("iSemilla", semilla, 1);
  instancia("iTam", tam, 1);
  instancia("iBrillo", brillo, 1);
  instancia("iForma", nube.esForma, 1);

  const uniformes = {
    uT: { value: 0 },
    uTiempo: { value: 0 },
    uCalor: { value: 0 },
    uTemplado: { value: 0 },
    uEscalaNube: { value: compacto ? 0.52 : 0.78 },
    uEscalaGlifo: { value: compacto ? 0.8 : 1 },
    uGiro: { value: new THREE.Matrix3() },
    uCentro: { value: new THREE.Vector3() },
    uGiroAmb: { value: new THREE.Matrix3() },
    uCentroAmb: { value: new THREE.Vector3() },
    uCaliente: { value: new THREE.Vector3(...rgb(CALIENTE)) },
    uOro: { value: new THREE.Vector3(...rgb(ORO)) },
    uCerca: { value: 2.1 },
    uLejos: { value: 5.8 },
    uPeso: { value: 1 },
  };

  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: uniformes,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const malla = new THREE.LineSegments(geo, material);
  /* La caja envolvente que three calcularía es la del triángulo plantilla, de
     un par de milímetros. Sin esto la constelación entera se descarta. */
  malla.frustumCulled = false;
  escena.add(malla);

  /* ---- Encuadre ---- */

  /* Semiancho útil de la trayectoria y si ya se pintó el primer fotograma. */
  let recorrido = 1;
  let pintado = false;
  /* ¿Ya actuó el guardarraíl? El encuadre se remide muchas veces y no puede
     devolverle a una máquina lenta el píxel ratio que se le acaba de quitar. */
  const recortada = () => geo.instanceCount < total;

  const medir = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const dpr = recortada() ? 1 : Math.min(window.devicePixelRatio, w < 768 ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    compacto = w < 768;
    uniformes.uEscalaNube.value = compacto ? 0.52 : 0.78;
    uniformes.uEscalaGlifo.value = compacto ? 0.8 : 1;
    /* Semiancho visible a la distancia de la nube: con esto la trayectoria se
       expresa en fracciones de pantalla y encuadra igual en cualquier viewport.
       No puede ser el semiancho a secas: en vertical el ancho es la mitad del
       alto y la nube se quedaría plantada sobre el titular media página. */
    const semialto = Math.tan((FOV * Math.PI) / 360) * DISTANCIA;
    recorrido = Math.max(semialto * camara.aspect, semialto * 0.7);
    if (pintado) canvas.style.opacity = String(compacto ? OPACIDAD_COMPACTA : OPACIDAD);
  };

  medir();

  /* ---- Anclas: dónde se posa cada figura ---- */

  type Ancla = { forma: NombreForma; en: number; peso: number };
  let anclas: Ancla[] = [];
  /* Cuánto scroll dura un cambio de figura, en fracción de página. Se expresa
     en PANTALLAS y no en fracción del tramo: una sección larga no debe tener
     una transición larga, debe tener una figura quieta más rato. Esa confusión
     es lo que deja la nube permanentemente a medio camino, que es cuando se ve
     el truco y deja de parecer una figura. */
  let ventana = 0.06;

  const medirAnclas = () => {
    const alto = document.documentElement.scrollHeight - window.innerHeight;
    const vh = window.innerHeight;
    const halladas: Ancla[] = [];
    ventana = rampa((vh * 1.05) / Math.max(1, alto)) || 0.06;

    if (alto > vh * 0.5) {
      for (const { sel, forma, en, peso } of MAPA) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const caja = el.getBoundingClientRect();
        const arriba = caja.top + window.scrollY;
        /* Cada figura elige a qué altura de su sección se posa. Un hero de
           cuatro pantallas y un cierre de media no quieren lo mismo. */
        halladas.push({ forma, peso, en: rampa((arriba + caja.height * en) / alto) });
      }
    }

    if (halladas.length >= 2) {
      halladas.sort((a, b) => a.en - b.en);
      /* La primera manda desde el tope y la última hasta el final: si no, el
         primer y el último tramo se quedarían sin figura. */
      halladas[0].en = 0;
      halladas[halladas.length - 1].en = 1;
      /* Monotonía estricta: dos anclas en el mismo punto dividirían por cero. */
      for (let i = 1; i < halladas.length; i++) {
        halladas[i].en = Math.max(halladas[i].en, halladas[i - 1].en + 0.02);
      }
      const ultima = halladas[halladas.length - 1].en;
      if (ultima > 1) for (const a of halladas) a.en /= ultima;
      anclas = halladas;
    } else {
      /* Cualquier otra página: tantas figuras como pantallas tenga, repartidas
         por igual. Una página corta no debe atravesar las seis a la carrera. */
      const pantallas = alto / Math.max(1, vh) + 1;
      const cuantas = Math.max(2, Math.min(NOMBRES.length, Math.floor(pantallas / 2.2)));
      anclas = Array.from({ length: cuantas }, (_, i) => ({
        forma: NOMBRES[i],
        peso: 1,
        en: i / (cuantas - 1),
      }));
    }

    tramo = -1; // fuerza recolocar los buffers
  };

  /* ---- Bucle ---- */

  /* `s` persigue al progreso real con un lerp: es lo que le da masa a la nube
     en vez de dejarla clavada al scrollbar. */
  let s = 0;
  let tramo = -1;
  let frame = 0;
  let ultimo = 0;
  /* Muestreo del guardarraíl: solo fotogramas a pleno gas, y una sola vez. */
  let muestras: number[] = [];
  let previo = 0;
  let aforado = false;
  let px = 0.5;
  let py = 0.5;

  const eGiro = new THREE.Euler();
  const mGiro = new THREE.Matrix4();

  const progreso = () => {
    const alto = document.documentElement.scrollHeight - window.innerHeight;
    return alto > 0 ? rampa(window.scrollY / alto) : 0;
  };

  const colocar = (k: number) => {
    tramo = k;
    aDesde.array.set(nube.formas[anclas[k].forma]);
    aHasta.array.set(nube.formas[anclas[Math.min(k + 1, anclas.length - 1)].forma]);
    aDesde.needsUpdate = true;
    aHasta.needsUpdate = true;
  };

  const escribir = (t: number) => {
    uniformes.uTiempo.value = t / 1000;

    /* Tramo actual y avance dentro de él. Las ventanas de reposo de los
       extremos son lo que hace que la figura se lea quieta un rato antes de
       deshacerse: sin ellas la nube estaría siempre a medio camino. */
    let k = 0;
    while (k < anclas.length - 2 && s >= anclas[k + 1].en) k++;
    if (k !== tramo) colocar(k);

    /* La figura se mantiene quieta todo el tramo y solo se deshace en la
       última pantalla, justo antes de que llegue la sección siguiente. */
    const a = anclas[k].en;
    const b = anclas[k + 1].en;
    const v = Math.min(ventana, (b - a) * 0.55);
    uniformes.uT.value = v > 0 ? rampa((s - (b - v)) / v) : 1;

    /* El peso cruza el tramo entero, no la ventana de cambio: así el fondo se
       va retirando mientras la sección se acerca, y no de golpe. */
    const u = b > a ? rampa((s - a) / (b - a)) : 1;
    uniformes.uPeso.value = mezcla(anclas[k].peso, anclas[k + 1].peso, u * u * (3 - 2 * u));

    const c = temperatura(s);
    uniformes.uCalor.value = c;
    uniformes.uTemplado.value = rampa((s - 0.72) / 0.28);

    /* Trayectoria. La nube VIVE EN LA MITAD DERECHA y no cruza. Esta página
       tiene todos sus titulares alineados a la izquierda, de la primera
       pantalla a la última; una figura que atraviesa se planta encima del texto
       exactamente donde hay que leer. Deriva de arriba abajo y de más lejos a
       más cerca, que es movimiento suficiente para que no parezca pegada. */
    const paralaje = compacto ? 0 : 1;
    uniformes.uCentro.value.set(
      curva(s, [[0, 0.56], [0.3, 0.44], [0.55, 0.58], [0.8, 0.46], [1, 0.5]]) * recorrido +
        (px - 0.5) * 0.16 * paralaje,
      curva(s, [[0, 0.06], [0.35, -0.1], [0.7, 0.08], [1, -0.02]]) + (py - 0.5) * -0.1 * paralaje,
      mezcla(-0.35, 0.15, Math.sin(s * Math.PI)),
    );
    uniformes.uCentroAmb.value.set((px - 0.5) * 0.07 * paralaje, (py - 0.5) * -0.05 * paralaje, 0);

    /* Gira porque el usuario baja. Un objeto que gira solo, sin que nadie lo
       toque, es un salvapantallas; girar por el scroll es una respuesta. */
    const seg = t / 1000;
    eGiro.set(
      Math.sin(s * Math.PI * 2) * 0.16 + Math.sin(seg * 0.11) * 0.03,
      s * Math.PI * 1.7 + seg * 0.02,
      mezcla(-0.12, 0.1, s),
    );
    uniformes.uGiro.value.setFromMatrix4(mGiro.makeRotationFromEuler(eGiro));

    eGiro.set(0, seg * 0.008, 0);
    uniformes.uGiroAmb.value.setFromMatrix4(mGiro.makeRotationFromEuler(eGiro));

    renderer.render(escena, camara);

    if (!pintado) {
      pintado = true;
      canvas.style.opacity = String(compacto ? OPACIDAD_COMPACTA : OPACIDAD);
    }
  };

  /* ---- Movimiento reducido: un fotograma y a callar ---- */

  if (estatico) {
    medirAnclas();
    s = progreso();
    escribir(0);
    let remedir = 0;
    const observador = new ResizeObserver(() => {
      if (remedir) return;
      remedir = requestAnimationFrame(() => {
        remedir = 0;
        medir();
        medirAnclas();
        s = progreso();
        escribir(0);
      });
    });
    observador.observe(canvas);
    return () => {
      cancelAnimationFrame(remedir);
      observador.disconnect();
      geo.dispose();
      material.dispose();
      renderer.dispose();
    };
  }

  /* ---- Movimiento completo ---- */

  medirAnclas();
  s = progreso();

  const dibujar = (t: number) => {
    if (document.hidden) {
      frame = 0; // lo reenciende `visibilitychange`
      return;
    }
    frame = requestAnimationFrame(dibujar);

    const p = progreso();
    const activo = Math.abs(p - s) > 0.0004;
    /* En reposo la nube sigue derivando, pero a 30 fps. Un rAF a pleno gas
       para un fondo que casi no se mueve es batería quemada por nada. */
    if (!activo && t - ultimo < 33) return;
    /* Se mide solo con el scroll en marcha: en reposo el bucle va a 30 fps a
       propósito y tomarlo por lentitud sería recortar la nube por nada. */
    if (!aforado && pintado && activo) {
      if (previo) muestras.push(t - previo);
      previo = t;
      if (muestras.length >= 100) {
        aforado = true;
        const utiles = muestras.slice(15).sort((a, b) => a - b);
        if (utiles[utiles.length >> 1] > TECHO_MS) {
          geo.instanceCount = Math.max(400, Math.round(total * RECORTE));
          renderer.setPixelRatio(1);
          renderer.setSize(canvas.clientWidth || window.innerWidth, canvas.clientHeight || window.innerHeight, false);
        }
        muestras = [];
      }
    } else if (!activo) {
      previo = 0;
    }

    ultimo = t;
    s += (p - s) * 0.08;

    const lx = luz.current.x?.get();
    const ly = luz.current.y?.get();
    if (typeof lx === "number") px += (lx / 100 - px) * 0.06;
    if (typeof ly === "number") py += (ly / 100 - py) * 0.06;

    escribir(t);
  };

  const despertar = () => {
    if (!frame && !document.hidden) frame = requestAnimationFrame(dibujar);
  };
  frame = requestAnimationFrame(dibujar);

  /* Los dos observadores comparten un rAF. Medir dentro del callback de un
     ResizeObserver es leer el layout desde dentro del propio layout, y eso
     dispara el aviso de bucle del navegador; aplazarlo un fotograma no. */
  let remedir = 0;
  const volverAMedir = () => {
    if (remedir) return;
    remedir = requestAnimationFrame(() => {
      remedir = 0;
      medir();
      medirAnclas();
      despertar();
    });
  };
  const observador = new ResizeObserver(volverAMedir);
  observador.observe(canvas);
  /* El alto del documento cambia cuando montan las secciones de cliente: hay
     que volver a medir las anclas o la coreografía queda desfasada media
     página. */
  const observadorDoc = new ResizeObserver(volverAMedir);
  observadorDoc.observe(document.body);

  document.addEventListener("visibilitychange", despertar);

  return () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(remedir);
    frame = 0;
    document.removeEventListener("visibilitychange", despertar);
    observador.disconnect();
    observadorDoc.disconnect();
    geo.dispose();
    material.dispose();
    renderer.dispose();
  };
}
