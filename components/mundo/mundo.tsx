"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ESCENAS, PANTALLAS_TOTALES, TRAMOS, type Escena } from "@/lib/mundo/escenas";
import { construirDiorama, crearTaller, type Diorama } from "@/components/mundo/geometria";
import { Boton } from "@/components/ui/boton";
import { cn } from "@/lib/utils";

/**
 * EL MUNDO · la apertura de la página.
 *
 * Reemplaza al hero de La Forja por un vuelo continuo de cámara a través de
 * seis dioramas. La idea es la de las landings «scroll-through world», pero
 * construida con geometría en vez de con vídeo pre-renderizado por un modelo
 * generativo. Esa decisión no es de presupuesto, es de producto:
 *
 *   · Pesa kilobytes. Un vídeo de seis escenas son decenas de megas que hay
 *     que descargar antes de que el visitante vea nada.
 *   · Escala a cualquier resolución y a cualquier proporción sin recortar.
 *     Un vídeo 16:9 en un móvil vertical enseña su centro y pierde la escena.
 *   · Es coherente con lo que ya es esta página. Un vuelo fotorrealista
 *     pegado a una interfaz deliberadamente material y geométrica se leería
 *     como dos productos distintos.
 *   · No depende de que un servicio externo siga existiendo el año que viene.
 *
 * Cómo se mueve la cámara, que es lo único que de verdad importa aquí:
 *
 *   Cada escena ocupa un tramo de scroll. Dentro de su tramo, la cámara
 *   PERMANECE en la escena y avanza despacio hacia ella —ahí es cuando el
 *   texto está a plena opacidad—, y en el último tercio VIAJA a la siguiente
 *   por una curva cuadrática que pasa por un punto elevado. La velocidad es
 *   cero al llegar y al salir, así que no hay tirón en ninguna costura, y
 *   como el recorrido es una función pura del scroll, subir la rueda lo
 *   reproduce hacia atrás exactamente igual de bien.
 *
 * Piso de rendimiento, con el mismo criterio que la constelación:
 *
 *   · `three` entra por `import()` en tiempo ocioso: cero bytes en el bundle
 *     inicial y cero competencia con el LCP.
 *   · Cero assets. Ni un .gltf, ni una textura, ni una petición de red.
 *   · El bucle no toca React ni una vez por frame: lee `window.scrollY`,
 *     mueve la cámara y escribe opacidades directo en el estilo de los nodos.
 *   · Solo se animan las escenas vecinas a la actual; el resto quedan
 *     detenidas y la niebla las tapa.
 *   · Con la sección fuera de pantalla el bucle se apaga del todo.
 *
 * Degradación: con movimiento reducido no se monta nada de esto y se sirve
 * `MundoEstatico`, que cuenta las mismas seis escenas en flujo normal. Sin
 * WebGL, el lienzo se queda vacío y el texto —que es lo que vende— sigue
 * funcionando sobre el fondo del sistema.
 */

/** Fracción del tramo que la cámara pasa EN la escena antes de viajar. */
const REPOSO = 0.56;

export function Mundo() {
  const reduce = useReducedMotion();
  if (reduce) return <MundoEstatico />;
  return <MundoVivo />;
}

/* ================================================================ */

function MundoVivo() {
  const seccion = useRef<HTMLElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const copias = useRef<(HTMLDivElement | null)[]>([]);
  const marca = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const canvas = lienzo.current;
    const host = seccion.current;
    if (!canvas || !host) return;

    let vivo = true;
    let desmontar: (() => void) | undefined;

    const arrancar = async () => {
      if (!hayWebGL()) return;
      try {
        const THREE = await import("three");
        if (!vivo) return;
        desmontar = montar(THREE, canvas, host, copias.current, marca.current);
      } catch {
        /* Sin WebGL o con el módulo bloqueado: queda el texto, que es lo que
           tiene que vender de todas formas. */
      }
    };

    const ocioso =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(() => void arrancar(), { timeout: 2000 })
        : window.setTimeout(() => void arrancar(), 400);

    return () => {
      vivo = false;
      if (typeof window.cancelIdleCallback === "function" && typeof ocioso === "number") {
        window.cancelIdleCallback(ocioso);
      }
      window.clearTimeout(ocioso as number);
      desmontar?.();
    };
  }, []);

  return (
    <section
      ref={seccion}
      aria-labelledby="mundo-titulo"
      className="relative bg-[var(--void)]"
      style={{ height: `${PANTALLAS_TOTALES * 100}vh` }}
    >
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <canvas
          ref={lienzo}
          aria-hidden
          className="absolute inset-0 size-full opacity-0 transition-opacity duration-1000 ease-[var(--ease-out)]"
        />

        {/* Velo inferior: separa el texto del diorama sin taparlo. El degradado
            sale de --void, así que sigue al sistema si el fondo cambia. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(to_top,var(--void)_30%,color-mix(in_oklab,var(--void)_90%,transparent)_60%,transparent_100%)] lg:h-[62%] lg:bg-[linear-gradient(to_top,var(--void)_8%,color-mix(in_oklab,var(--void)_78%,transparent)_46%,transparent_100%)]"
        />

        {/* Riel de ruta: dónde vas en el recorrido. */}
        <nav
          aria-label="Recorrido"
          className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 lg:block"
        >
          <ol className="flex flex-col gap-3">
            {ESCENAS.map((e, i) => (
              <li
                key={e.id}
                ref={(n) => {
                  marca.current[i] = n;
                }}
                className="flex items-center justify-end gap-2.5 opacity-40 transition-opacity duration-300 ease-[var(--ease-out)] [text-shadow:0_1px_6px_var(--void)] [&>span:last-child]:shadow-[0_0_6px_var(--void)]"
              >
                <span className="mono-sm text-slag">{e.indice}</span>
                <span className="block h-px w-6 bg-[var(--scale-hi)]" />
              </li>
            ))}
          </ol>
        </nav>

        {/* La copia. Las seis van en el DOM siempre y el scroll decide cuál
            está viva: el recorrido completo sigue siendo accesible, una
            escena a la vez, en vez de seis superpuestas anunciándose juntas.
            Quien prefiere movimiento reducido recibe `MundoEstatico`, que las
            presenta las seis en flujo normal.

            Todas nacen `inert` menos la primera. Entre el HTML del servidor y
            el primer frame del bucle hay una ventana en la que las seis
            están a opacidad 0; sin esto, el tabulador las recorre todas. */}
        <div className="absolute inset-0">
          {ESCENAS.map((e, i) => (
            <div
              key={e.id}
              ref={(n) => {
                copias.current[i] = n;
              }}
              inert={i !== 0}
              aria-hidden={i !== 0}
              className="absolute inset-x-0 bottom-0 px-6 pb-16 opacity-0 sm:pb-20 lg:px-10 lg:pb-24"
            >
              <BloqueCopia escena={e} principal={i === 0} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */

function BloqueCopia({ escena, principal }: { escena: Escena; principal: boolean }) {
  const Titulo = principal ? "h1" : "h2";
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="max-w-[42rem]">
        <p className="flex items-center gap-3">
          <span className="mono-sm text-[var(--heat)]">{escena.indice}</span>
          <span className="h-px w-8 bg-[var(--scale-hi)]" />
          <span className="etiqueta text-smoke">{escena.eyebrow}</span>
        </p>

        <Titulo
          id={principal ? "mundo-titulo" : undefined}
          className={cn("mt-5", principal ? "display-lg" : "display-md")}
        >
          {escena.titulo}
        </Titulo>

        <p className="mt-5 cuerpo-lg text-smoke">{escena.cuerpo}</p>

        {escena.etiquetas.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {escena.etiquetas.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-[var(--scale)] px-3 py-1 mono-sm text-slag"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        {escena.id === "tienda" && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Boton asChild variante="heat" tamano="lg">
              <Link href="/app/nueva">
                Forjar mi landing
                <ArrowRight weight="bold" />
              </Link>
            </Boton>
            <Link
              href="/metodologia"
              className="etiqueta text-[var(--quench)] no-underline hf:underline"
            >
              Ver la metodología
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================ */
/* El motor                                                          */
/* ================================================================ */

type Three = typeof import("three");

function hayWebGL() {
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") ?? c.getContext("webgl");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

const limitar = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
/** Suaviza los extremos: velocidad cero al entrar y al salir. */
const suave = (k: number) => k * k * (3 - 2 * k);

/** Rampa 0→1 entre `a` y `b`, ya suavizada. */
function rampa(v: number, a: number, b: number) {
  return suave(limitar((v - a) / (b - a)));
}

function montar(
  THREE: Three,
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  copias: (HTMLDivElement | null)[],
  marcas: (HTMLLIElement | null)[],
) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x101216, 1);

  const escena3d = new THREE.Scene();
  /* La niebla da profundidad y, de paso, disuelve el diorama vecino durante
     el vuelo en vez de dejarlo aparecer como un objeto pegado al borde. */
  escena3d.fog = new THREE.Fog(0x101216, 16, 46);

  const camara = new THREE.PerspectiveCamera(50, 1, 0.1, 260);

  /* Ambiente y clave MUY bajos a propósito. El volumen lo hacen las luces
     propias de cada diorama, y por eso el caos puede leerse frío mientras la
     forja arde: si la clave global fuera fuerte, todas las escenas tendrían
     la misma temperatura y el naranja dejaría de significar «en proceso». */
  escena3d.add(new THREE.AmbientLight(0x2b3038, 1.1));
  const clave = new THREE.DirectionalLight(0xffa05c, 0.34);
  clave.position.set(6, 12, 8);
  escena3d.add(clave);
  const contorno = new THREE.DirectionalLight(0x5cc8ff, 0.34);
  contorno.position.set(-8, 6, -10);
  escena3d.add(contorno);

  const taller = crearTaller(THREE);
  const dioramas: Diorama[] = ESCENAS.map((e) => {
    const d = construirDiorama(taller, e);
    escena3d.add(d.grupo);
    return d;
  });

  /* --- Vectores reutilizados: cero basura por frame --- */
  const pos = new THREE.Vector3();
  const mira = new THREE.Vector3();
  const a = new THREE.Vector3();
  const control = new THREE.Vector3();
  const desde = new THREE.Vector3();
  const hasta = new THREE.Vector3();
  const lateral = new THREE.Vector3();

  /** Bézier cuadrática en `destino`. */
  function curva(
    destino: import("three").Vector3,
    p0: import("three").Vector3,
    p1: import("three").Vector3,
    p2: import("three").Vector3,
    k: number,
  ) {
    const u = 1 - k;
    destino.set(0, 0, 0);
    destino.addScaledVector(p0, u * u);
    destino.addScaledVector(p1, 2 * u * k);
    destino.addScaledVector(p2, k * k);
  }

  /**
   * ¿Está la cámara viajando entre dos dioramas, o posada en uno? Lo escribe
   * `volar` y lo lee el bucle para decidir qué se dibuja: en reposo, SOLO la
   * escena actual, porque es cuando el visitante lee y ver la escena vecina
   * asomando por el borde rompe la ilusión —y, en el caso del caos, rompe la
   * regla de que ahí no puede haber una sola chispa naranja.
   */
  let viaje = false;
  /** Cuánto se desplaza la mirada para dejar el lado izquierdo al texto. */
  let encuadre = 0;
  /**
   * Cuánto se aleja la cámara. En vertical, el cuadro pierde ángulo
   * horizontal y el diorama se sale por los lados; retroceder lo devuelve
   * entero. Se hace con distancia y no subiendo el FOV porque un FOV de 110°
   * deforma la perspectiva y rompe el aire de maqueta.
   */
  let retroceso = 1;
  /**
   * Desplazamiento vertical del encuadre. En vertical la copia ocupa la mitad
   * de abajo, así que el diorama tiene que subir a la mitad de arriba: se
   * apunta MÁS ABAJO del sujeto y el sujeto sube en cuadro.
   */
  let encuadreY = 0;

  /**
   * Dónde está la cámara para un progreso global. Es una función PURA del
   * scroll: por eso el vuelo se reproduce hacia atrás sin ningún trabajo
   * extra, y por eso no hay estado que se pueda desincronizar.
   */
  function volar(g: number) {
    let i = 0;
    while (i < TRAMOS.length - 1 && g > TRAMOS[i][1]) i++;
    const [ini, fin] = TRAMOS[i];
    const local = limitar((g - ini) / (fin - ini));
    const esc = ESCENAS[i];
    const ultima = i === ESCENAS.length - 1;

    /**
     * Posición de reposo, escrita en `destino`. La cámara avanza despacio
     * hacia lo que mira: como mucho un 22% del trayecto, que es un empuje y
     * no una llegada.
     */
    const acercar = (destino: import("three").Vector3, k: number) => {
      destino.set(esc.camara[0], esc.camara[1], esc.camara[2]);
      a.set(esc.mira[0], esc.mira[1], esc.mira[2]);
      destino.lerp(a, 0.22 * suave(k) * (0.6 + esc.reposo * 0.8));
    };

    if (ultima || local <= REPOSO) {
      const k = ultima ? local : local / REPOSO;
      acercar(pos, k);
      mira.set(esc.mira[0], esc.mira[1], esc.mira[2]);
      /* Deriva lateral mínima: mantiene viva la toma sin marear. */
      mira.x += Math.sin(k * Math.PI) * 0.6;
      viaje = false;
      return i;
    }
    viaje = true;

    /* Viaje a la escena siguiente. Arranca exactamente donde terminó el
       reposo, así que la costura no existe. */
    const sig = ESCENAS[i + 1];
    const k = suave((local - REPOSO) / (1 - REPOSO));

    acercar(desde, 1);
    hasta.set(sig.camara[0], sig.camara[1], sig.camara[2]);
    /* Punto de control elevado: el salto aéreo entre dioramas. */
    control.addVectors(desde, hasta).multiplyScalar(0.5);
    control.y += sig.salto;
    curva(pos, desde, control, hasta, k);

    desde.set(esc.mira[0], esc.mira[1], esc.mira[2]);
    hasta.set(sig.mira[0], sig.mira[1], sig.mira[2]);
    control.addVectors(desde, hasta).multiplyScalar(0.5);
    control.y += sig.salto * 0.4;
    curva(mira, desde, control, hasta, k);

    return k < 0.5 ? i : i + 1;
  }

  /* --- Bucle --- */
  let raf = 0;
  let visible = true;
  let arranque = 0;
  let alto = 1;
  let cima = 0;
  let anterior = -1;

  function medir() {
    const r = host.getBoundingClientRect();
    cima = r.top + window.scrollY;
    alto = Math.max(1, host.offsetHeight - window.innerHeight);

    const ancho = canvas.clientWidth || window.innerWidth;
    const altoC = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(ancho, altoC, false);
    camara.aspect = ancho / altoC;
    camara.updateProjectionMatrix();

    /* En pantallas anchas el texto ocupa la mitad izquierda, así que el
       diorama se corre a la derecha. En móvil el texto va abajo a todo lo
       ancho y el sujeto tiene que quedarse centrado: sin esto, en vertical
       el diorama se saldría del cuadro. */
    encuadre = ancho >= 1024 ? 0.2 : ancho >= 700 ? 0.1 : 0;
    const aspecto = ancho / altoC;
    retroceso = aspecto >= 1.3 ? 1 : 1 + (1.3 - aspecto) * 0.85;
    encuadreY = ancho >= 1024 ? 0 : ancho >= 700 ? 0.12 : 0.26;
  }

  function pintar(ahora: number) {
    raf = requestAnimationFrame(pintar);
    if (!visible) return;

    if (!arranque) arranque = ahora;
    const t = (ahora - arranque) / 1000;

    const g = limitar((window.scrollY - cima) / alto);
    const activa = volar(g);

    /* Retroceso vertical: se aleja la cámara sobre su propio eje de visión,
       así que el encuadre se mantiene y solo cambia cuánto mundo cabe. */
    if (retroceso !== 1) {
      lateral.subVectors(pos, mira);
      pos.copy(mira).addScaledVector(lateral, retroceso);
    }

    /* Encuadre: se apunta a la IZQUIERDA del sujeto para que el sujeto caiga
       en la mitad derecha del cuadro y el texto tenga la suya limpia. Se
       desplaza la MIRADA y no la cámara, porque mover la cámara cambiaría el
       punto de vista del diorama y no solo su sitio en pantalla. */
    const distancia = pos.distanceTo(mira);
    if (encuadre !== 0) {
      lateral.subVectors(mira, pos).cross(camara.up).normalize();
      mira.addScaledVector(lateral, -encuadre * distancia);
    }
    if (encuadreY !== 0) mira.y -= encuadreY * distancia;

    camara.position.copy(pos);
    camara.lookAt(mira);

    /* En reposo se dibuja SOLO la escena actual; durante el viaje, también la
       de destino, que es cuando ver las dos conectadas es justamente el
       efecto que se busca. En reposo, una vecina asomando por el borde rompe
       la ilusión —y en el caos rompería la regla de que ahí no puede haber
       una sola chispa naranja. */
    for (let i = 0; i < dioramas.length; i++) {
      const dibujar = viaje ? Math.abs(i - activa) <= 1 : i === activa;
      dioramas[i].grupo.visible = dibujar;
      if (dibujar) {
        const [ini, fin] = TRAMOS[i];
        const local = limitar((g - ini) / (fin - ini));
        dioramas[i].animar?.(t, local);
      }
    }

    /* La copia se escribe directo en el estilo: React no se entera de que
       existe un bucle, y por tanto no vuelve a renderizar nunca. */
    for (let i = 0; i < copias.length; i++) {
      const nodo = copias[i];
      if (!nodo) continue;
      const [ini, fin] = TRAMOS[i];
      const local = (g - ini) / (fin - ini);
      const ultima = i === ESCENAS.length - 1;
      const primera = i === 0;
      /* Entra al llegar, se sostiene mientras la cámara reposa, y sale
         justo cuando empieza el viaje. La última no se va nunca.

         La PRIMERA no entra: ya se está en ella. Con rampa de entrada, en
         scroll 0 su opacidad era exactamente 0 y la portada abría con el
         diorama y sin una sola palabra —el h1 invisible hasta que el
         visitante adivinaba que había que bajar. Es el mismo fallo que
         DECISIONES.md da por corregido en la v2 («el fotograma del hero
         estaba vacío en la primera pantalla»), reintroducido por el mundo
         sobre la copia en vez de sobre la imagen. */
      const entrada = primera ? 1 : rampa(local, 0.02, 0.2);
      const op = ultima ? entrada : entrada * (1 - rampa(local, REPOSO - 0.06, REPOSO + 0.1));
      nodo.style.opacity = String(op);
      nodo.style.transform = `translateY(${(1 - op) * 18}px)`;

      /* Un solo umbral para las tres modalidades de entrada.
         Antes el ratón se apagaba en 0.55 y el árbol de accesibilidad en
         0.05, y en esa franja quedaba una escena que no se podía clicar pero
         sí tabular: el teclado aterrizaba en un CTA invisible y Enter
         navegaba a ciegas. `inert` saca el subárbol del orden de tabulación
         y del árbol de accesibilidad a la vez, así que ratón, teclado y
         lector de pantalla ven ahora exactamente la misma escena. */
      const interactiva = op > 0.55;
      nodo.style.pointerEvents = interactiva ? "auto" : "none";
      nodo.setAttribute("aria-hidden", interactiva ? "false" : "true");
      if (interactiva) nodo.removeAttribute("inert");
      else nodo.setAttribute("inert", "");
    }

    if (activa !== anterior) {
      for (let i = 0; i < marcas.length; i++) {
        const m = marcas[i];
        if (m) m.style.opacity = i === activa ? "1" : "0.32";
      }
      anterior = activa;
    }

    renderer.render(escena3d, camara);
  }

  /* Primer fotograma con la cámara ya colocada, y solo entonces se revela el
     lienzo: nunca se ve aparecer el mundo en el sitio equivocado. */
  medir();
  volar(0);
  camara.position.copy(pos);
  camara.lookAt(mira);
  renderer.render(escena3d, camara);
  requestAnimationFrame(() => {
    canvas.style.opacity = "1";
  });

  const observador = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
    },
    { rootMargin: "120px" },
  );
  observador.observe(host);

  let remedir = 0;
  const alRedimensionar = () => {
    window.clearTimeout(remedir);
    remedir = window.setTimeout(medir, 120);
  };
  window.addEventListener("resize", alRedimensionar);
  window.addEventListener("orientationchange", alRedimensionar);

  raf = requestAnimationFrame(pintar);

  return () => {
    cancelAnimationFrame(raf);
    observador.disconnect();
    window.removeEventListener("resize", alRedimensionar);
    window.removeEventListener("orientationchange", alRedimensionar);
    window.clearTimeout(remedir);
    for (const d of dioramas) escena3d.remove(d.grupo);
    escena3d.traverse((o) => {
      const m = o as import("three").Mesh;
      if (m.geometry && !Object.values(taller).includes(m.geometry)) m.geometry.dispose();
    });
    taller.liberar();
    renderer.dispose();
  };
}

/* ================================================================ */
/* Movimiento reducido                                               */
/* ================================================================ */

/**
 * Las mismas seis escenas, en flujo normal y sin lienzo. Movimiento reducido
 * significa menos movimiento, no menos historia: el texto es idéntico y el
 * recorrido se sigue leyendo de arriba abajo.
 */
function MundoEstatico() {
  return (
    <section aria-labelledby="mundo-titulo" className="pt-32 pb-24">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        <ol className="flex flex-col gap-24">
          {ESCENAS.map((e, i) => (
            <li key={e.id} className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <BloqueCopia escena={e} principal={i === 0} />
              </div>
              {/* Sustituto del diorama: un campo de temperatura plano, que
                  dice lo mismo que la escena sin mover un píxel. */}
              <div
                aria-hidden
                className="aspect-[4/3] rounded-[16px] border border-[var(--scale)]"
                style={{
                  background: `radial-gradient(120% 90% at 50% 100%, color-mix(in oklab, ${
                    e.calor > 0.5 ? "var(--heat)" : "var(--quench)"
                  } ${Math.round(12 + e.calor * 26)}%, var(--anvil)) 0%, var(--void) 72%)`,
                }}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
