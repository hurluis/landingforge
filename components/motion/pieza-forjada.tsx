"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * LA PIEZA · el martillo de forja que cruza la página con el scroll.
 *
 * Vive dentro del campo de luz, entre las luces y el grano, así que recibe el
 * mismo grano que el resto del fondo y nunca se pone por delante del texto.
 *
 * Qué hace el scroll, y por qué cada cosa:
 *
 *   Cruza. Entra por la derecha en la primera pantalla y sale por la
 *   izquierda al final. La página se lee de arriba abajo y la herramienta
 *   la acompaña: es un solo gesto de principio a fin, no un adorno que gira
 *   en su sitio.
 *
 *   Gira. Tres vueltas largas sobre su eje, atadas al recorrido. Un objeto
 *   que gira solo, sin que nadie lo toque, es un salvapantallas; girar
 *   porque el usuario baja es una respuesta.
 *
 *   Se calienta. El acero arranca frío, alcanza la incandescencia hacia la
 *   mitad —donde la página explica el método— y al final ya no vuelve a
 *   apagarse del todo: se queda templado, del color del trabajo terminado.
 *   Es exactamente la curva de temperatura del campo de luz y exactamente el
 *   significado que la paleta le da al color.
 *
 * Piso de rendimiento, que aquí no es opcional porque es una superficie de
 * persuasión y no un visor de producto:
 *
 *   · three entra por `import()` dentro del efecto y en tiempo ocioso, así
 *     que no pesa ni un byte en el bundle inicial ni compite con el LCP.
 *   · El asset son 58 KB de malla sin una sola textura. El material y el
 *     entorno de reflexión se construyen en código con los tokens de la
 *     paleta (ver scripts/preparar-pieza3d.mjs).
 *   · 1.432 vértices y una sola llamada de dibujo. El bucle no toca React:
 *     lee `window.scrollY` y escribe matrices.
 *   · Se detiene con la pestaña oculta y cuando el usuario deja de mover el
 *     scroll y la pieza ya llegó a su sitio. Un rAF eterno en un fondo es
 *     batería quemada por nada.
 *
 * Degradación, en este orden: movimiento reducido → no se monta; sin WebGL o
 * si el modelo no carga → no se monta. En los tres casos queda el campo de
 * luz, que ya era un fondo completo por sí solo. Nada de esto es un fallback
 * visible, porque nada de esto es contenido.
 */
export function PiezaForjada() {
  const reduce = useReducedMotion();
  const lienzo = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduce) return;
    const canvas = lienzo.current;
    if (!canvas) return;

    let vivo = true;
    let desmontar: (() => void) | undefined;

    const arrancar = async () => {
      try {
        const [THREE, { GLTFLoader }] = await Promise.all([
          import("three"),
          import("three/examples/jsm/loaders/GLTFLoader.js"),
        ]);
        if (!vivo) return;
        desmontar = montar(THREE, GLTFLoader, canvas);
      } catch {
        /* Sin WebGL, con el módulo bloqueado o con el .gltf caído: la página
           se queda con el campo de luz y no se entera nadie. */
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

  if (reduce) return null;

  return (
    <canvas
      ref={lienzo}
      aria-hidden
      /* Empieza transparente: el fade lo hace el bucle al primer frame con la
         pieza ya colocada, para que nunca se vea aparecer en el sitio
         equivocado. */
      className="pointer-events-none absolute inset-0 size-full opacity-0 transition-opacity duration-700 ease-[var(--ease-out)]"
    />
  );
}

/* ------------------------------------------------------------------ */

type Three = typeof import("three");
type CargadorGLTF = typeof import("three/examples/jsm/loaders/GLTFLoader.js")["GLTFLoader"];

/** Distancia de la cámara a la pieza. Fija: el encuadre se ajusta con el FOV. */
const DISTANCIA = 3.4;
const FOV = 34;

/**
 * Techo de opacidad de la pieza. Es lo que la mantiene siendo fondo: a plena
 * opacidad el martillo compite con el titular, y en una página cuyo trabajo es
 * persuadir, lo que compite con el titular sobra. Aquí se lee como un objeto
 * dentro del estudio, medio metido en la penumbra.
 */
const OPACIDAD = 0.5;

/**
 * En vertical el texto ocupa el ancho entero, así que la pieza no tiene por
 * dónde pasar sin cruzarlo. Ahí se retira: más pequeña y más apagada. El
 * teléfono es donde se lee y donde se compra; el adorno cede.
 */
const OPACIDAD_COMPACTA = 0.3;

/** Tokens de la paleta, en el mismo orden en que los usa el campo de luz. */
const ACERO = 0x474c55;
const CALIENTE = 0xff5c2b;
const TEMPLADO = 0xc9a063;
const TEMPLE = 0x5cc8ff;

/** Interpolación lineal, y el mismo suavizado de rampa que usan las curvas. */
const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;
const rampa = (t: number) => Math.max(0, Math.min(1, t));

/**
 * Curva de temperatura del recorrido. Idéntica en forma a la del campo de luz:
 * frío arriba, incandescente hacia el método, templado al cerrar.
 */
function temperatura(p: number) {
  if (p < 0.45) return rampa(p / 0.45);
  if (p < 0.8) return mezcla(1, 0.45, rampa((p - 0.45) / 0.35));
  return mezcla(0.45, 0.22, rampa((p - 0.8) / 0.2));
}

function montar(THREE: Three, GLTFLoader: CargadorGLTF, canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: window.devicePixelRatio < 2,
    powerPreference: "low-power",
  });
  renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(FOV, 1, 0.1, 20);
  camara.position.set(0, 0, DISTANCIA);

  /* El entorno de reflexión ES el esquema de iluminación de la metodología:
     clave cálida arriba a la derecha, relleno tenue, contorno frío enfrente.
     Sin él un metal sin textura no tiene nada que reflejar y se ve como
     plástico gris. Se hornea una sola vez a un mapa PMREM y se tira la escena
     que lo generó. */
  const sala = new THREE.Scene();
  const emisor = (color: number, intensidad: number, x: number, y: number, z: number, s: number) => {
    const luz = new THREE.Mesh(
      new THREE.PlaneGeometry(s, s),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    luz.material.color.multiplyScalar(intensidad);
    luz.position.set(x, y, z);
    luz.lookAt(0, 0, 0);
    sala.add(luz);
    return luz;
  };
  emisor(0xffa05c, 2.4, 3.2, 3.4, 2.2, 6); // clave, cálida
  emisor(0x788496, 0.55, -3.6, 0.4, 1.6, 8); // relleno, neutro frío
  emisor(TEMPLE, 0.7, -1.4, -1.2, -3.4, 7); // contorno, frío
  emisor(0x0a0c10, 1, 0, -4, 0, 12); // suelo: el estudio es oscuro por debajo

  const pmrem = new THREE.PMREMGenerator(renderer);
  const entorno = pmrem.fromScene(sala, 0.04).texture;
  escena.environment = entorno;
  pmrem.dispose();
  sala.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      o.material.dispose();
    }
  });

  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(ACERO),
    metalness: 1,
    roughness: 0.5,
    emissive: new THREE.Color(CALIENTE),
    emissiveIntensity: 0,
    envMapIntensity: 0.75,
  });

  /* El pivote lleva la posición y la escala; la pieza, la rotación. Separarlos
     evita tener que recomponer una matriz a mano cada frame. */
  const pivote = new THREE.Group();
  const pieza = new THREE.Group();
  pivote.add(pieza);
  escena.add(pivote);

  let listo = false;
  const cargador = new GLTFLoader();
  cargador.load(
    "/pieza3d/martillo.gltf",
    (gltf) => {
      const malla = gltf.scene;
      malla.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.material = material;
          o.frustumCulled = false;
        }
      });

      /* El modelo viene en metros y descentrado. Se normaliza a una altura de
         mundo conocida para que el encuadre no dependa del asset. */
      const caja = new THREE.Box3().setFromObject(malla);
      const centro = caja.getCenter(new THREE.Vector3());
      const tamano = caja.getSize(new THREE.Vector3());
      malla.position.sub(centro);
      malla.scale.setScalar(0.62 / Math.max(tamano.x, tamano.y, tamano.z));
      pieza.add(malla);
      listo = true;
      canvas.style.opacity = String(compacto ? OPACIDAD_COMPACTA : OPACIDAD);
      despertar();
    },
    undefined,
    () => {
      /* 404 o malla corrupta: se queda el campo de luz. */
    },
  );

  /* ---- Encuadre ---- */

  let recorrido = 0;
  let compacto = false;
  const medir = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio, w < 768 ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
    /* Semiancho y semialto visibles a la distancia de la pieza: con esto la
       trayectoria se expresa en fracciones de pantalla y encuadra igual en
       cualquier viewport, que es justo lo que un fondo fijo necesita.

       El recorrido no puede ser el semiancho a secas. En un móvil el ancho es
       la mitad del alto, así que una excursión medida en anchos deja la pieza
       plantada sobre el titular durante media página. Se toma el mayor de los
       dos: en escritorio manda el ancho, y en vertical la pieza se va de
       verdad a los bordes en vez de vivir en el centro de la columna. */
    const semialto = Math.tan((FOV * Math.PI) / 360) * DISTANCIA;
    recorrido = Math.max(semialto * camara.aspect, semialto * 0.62);
    compacto = w < 768;
    if (listo) canvas.style.opacity = String(compacto ? OPACIDAD_COMPACTA : OPACIDAD);
  };
  medir();
  const observador = new ResizeObserver(() => {
    medir();
    despertar(); // el encuadre cambió: hay que repintarlo aunque nadie scrollee
  });
  observador.observe(canvas);

  /* ---- Bucle ---- */

  /* `p` es el progreso real de la página y `s` el que se dibuja: el segundo
     persigue al primero con un lerp, que es lo que le da masa a la pieza en
     vez de dejarla clavada al scrollbar. */
  let s = 0;
  let frame = 0;
  let quietos = 0;

  /* Colores de trabajo, instanciados una vez. Un `new Color` por frame es
     basura para el recolector a 60 Hz. */
  const caliente = new THREE.Color(CALIENTE);
  const templado = new THREE.Color(TEMPLADO);
  const acero = new THREE.Color(ACERO);

  const progreso = () => {
    const alto = document.documentElement.scrollHeight - window.innerHeight;
    return alto > 0 ? rampa(window.scrollY / alto) : 0;
  };

  /* Vuelve a encender el bucle si el freno de mano lo apagó. */
  function despertar() {
    quietos = 0;
    if (!frame) frame = requestAnimationFrame(dibujar);
  }

  const dibujar = (t: number) => {
    frame = 0;
    if (document.hidden) return; // lo reenciende `visibilitychange`

    const p = progreso();
    const antes = s;
    s += (p - s) * 0.08;

    /* Freno de mano: cuando la pieza ya alcanzó al scroll y el resto del
       movimiento es imperceptible, el bucle se apaga del todo en vez de
       seguir pintando el mismo fotograma. `despertar` lo reenciende. */
    const moviendo = Math.abs(p - s) > 0.0002 || Math.abs(s - antes) > 0.0002;
    quietos = moviendo ? 0 : quietos + 1;
    if (quietos > 90) return; // ~1,5 s de calma antes de soltar el rAF

    frame = requestAnimationFrame(dibujar);
    if (!listo) return;

    /* Trayectoria: de fuera del borde derecho a fuera del izquierdo. La pieza
       nunca se planta en el centro exacto, donde competiría con el texto. */
    /* Diagonal descendente, de arriba a la derecha a abajo a la izquierda: es
       la dirección de la luz clave del estudio, y deja el final del recorrido
       —donde vive el último CTA— por debajo de la línea del texto. */
    pivote.position.x = mezcla(0.8, -0.9, s) * recorrido;
    pivote.position.y = mezcla(0.25, -0.55, s) + Math.sin(t / 3400) * 0.04;
    pivote.position.z = mezcla(-0.6, 0.35, Math.sin(s * Math.PI));
    pivote.scale.setScalar(mezcla(0.92, 1.12, Math.sin(s * Math.PI)) * (compacto ? 0.72 : 1));

    pieza.rotation.y = s * Math.PI * 3 + 0.6;
    pieza.rotation.z = mezcla(-0.75, 0.6, s);
    pieza.rotation.x = Math.sin(s * Math.PI * 2) * 0.22 + Math.sin(t / 4200) * 0.03;

    /* Calor: emisivo y color. El acero al rojo también se pule —el óxido se
       quema—, así que la rugosidad baja con la temperatura. Pasado el pico, el
       naranja no vuelve al gris sino al templado: el trabajo ya está hecho. */
    const c = temperatura(s);
    material.emissiveIntensity = c * 0.32;
    material.emissive.copy(caliente).lerp(templado, rampa((s - 0.6) / 0.4));
    material.color.copy(acero).lerp(templado, rampa((s - 0.75) / 0.25) * 0.35);
    material.roughness = mezcla(0.56, 0.34, c);

    renderer.render(escena, camara);
  };
  frame = requestAnimationFrame(dibujar);

  window.addEventListener("scroll", despertar, { passive: true });
  document.addEventListener("visibilitychange", despertar);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", despertar);
    document.removeEventListener("visibilitychange", despertar);
    observador.disconnect();
    escena.traverse((o) => {
      if (o instanceof THREE.Mesh) o.geometry.dispose();
    });
    material.dispose();
    entorno.dispose();
    renderer.dispose();
  };
}
