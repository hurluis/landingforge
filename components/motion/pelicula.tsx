"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMovimientoReducido } from "@/lib/a11y/preferencias";

/**
 * LA PELÍCULA · las dos tomas que protagonizan la página.
 *
 * Un canvas fijo a pantalla completa. El scroll no lo empuja: le mueve el
 * TIEMPO. Cada toma se reparte sobre su propia zona de la página, no sobre el
 * documento entero:
 *
 *   #pelicula-zona  La toma principal, 415 fotogramas: el frasco en su
 *                   pedestal, el despegue, el vuelo, la marca y la mano. Los
 *                   seis tramos de la apertura caen cada uno en su acto.
 *   #cierre-zona    Un tarro de crema girando en la mano, 240 fotogramas,
 *                   bajo el cierre. Otro producto: la página termina
 *                   enseñando que lo que vende no es una plantilla para un
 *                   frasco, sino una landing para el tuyo.
 *
 * Entre zonas la toma se queda en su último fotograma y un velo baja sobre
 * ella: lo de en medio son precios y preguntas, que se leen, no se miran, y
 * no deben competir con un plano a plena luz. La toma activa es la de la
 * última zona que ha empezado a entrar, así que el relevo entre una y otra
 * ocurre siempre con el velo bajado, nunca a la vista.
 *
 * Tres detalles que no se ven hasta que faltan:
 *
 *   Un solo árbol. El póster —el primer fotograma como <img>— está siempre
 *   debajo del canvas y nunca se desmonta: entre que el canvas monta y recibe
 *   su primer lote no hay un instante en negro.
 *
 *   Suavizado propio: `suave += (objetivo − suave) · 0.12` por frame. El bucle
 *   solo corre mientras hay algo que alcanzar —scroll, ratón— y se duerme en
 *   cuanto converge: una página quieta no gasta CPU.
 *
 *   La cámara respira con el ratón. El plano está escalado un 6 % y se desplaza
 *   unos píxeles hacia donde no está el puntero, como si el visitante moviera
 *   la cabeza delante de una ventana. Solo con puntero fino.
 *
 * Sobre papel la toma no se apaga: se revela en clave alta (`--pelicula-*` en
 * globals.css). Con movimiento reducido o modo lectura no se pide la
 * secuencia: queda el póster.
 */

const TOMAS = [
  { zona: "pelicula-zona", carpeta: "secuencia", total: 415 },
  { zona: "cierre-zona", carpeta: "secuencia-crema", total: 240 },
];

const LOTE = 24;

/* El velo mínimo en móvil, dentro de las zonas. Medido: sobre el frasco
   blanco, 0,6 deja la letra blanca por encima de 5:1. */
const VELO_MOVIL = 0.6;
const ruta = (t: number, i: number) =>
  `/${TOMAS[t].carpeta}/${String(i + 1).padStart(4, "0")}.jpg`;

/* Los paños van en `--pelicula-sombra` y no en negro: sobre papel el mismo
   paño aclara en vez de oscurecer, y la letra oscura se apoya igual. */
const SOMBRA = "rgb(var(--pelicula-sombra)";

/* VIÑETA. Cierra los bordes, que es donde vive la letra: los tramos van a
   izquierda y derecha y el centro es del producto. */
const VINETA = `radial-gradient(ellipse 78% 72% at 50% 50%, transparent 38%, ${SOMBRA} / 0.55) 78%, ${SOMBRA} / 0.86) 100%)`;

/* Asiento arriba para el nav y abajo para el hero y los botones flotantes. */
const ASIENTO = `linear-gradient(180deg, ${SOMBRA} / 0.42) 0%, transparent 22%, transparent 52%, ${SOMBRA} / 0.62) 100%)`;

/* `false` en el servidor y en el primer render; `true` después. */
const suscribirNada = () => () => {};
const useMontado = () => useSyncExternalStore(suscribirNada, () => true, () => false);

const limitar = (v: number) => Math.min(1, Math.max(0, v));

export function Pelicula() {
  const reduce = useMovimientoReducido();
  /* Hasta montar no se monta el canvas: el servidor no puede leer la
     preferencia de movimiento, y si el canvas arrancara su descarga antes de
     que llegue, alguien que pidió la pantalla quieta pagaría fotogramas que no
     va a ver. El póster cubre ese tick. */
  const montado = useMontado();
  const animada = montado && !reduce;

  const raiz = useRef<HTMLDivElement>(null);
  const capa = useRef<HTMLDivElement>(null);
  const velo = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={raiz}
      aria-hidden
      data-decorativo
      data-pelicula
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ background: `${SOMBRA})` }}
    >
      <div
        ref={capa}
        className="pelicula-capa absolute inset-0 will-change-transform"
        style={{ transform: animada ? "scale(1.06)" : undefined }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- el primer
            fotograma de una secuencia, no un asset con layout propio. */}
        <img
          src={ruta(0, 0)}
          alt=""
          aria-hidden
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
        />
        {animada && <Lienzo raiz={raiz} capa={capa} velo={velo} />}
      </div>
      <div className="absolute inset-0" style={{ background: VINETA }} />
      <div className="absolute inset-0" style={{ background: ASIENTO }} />
      <div
        ref={velo}
        data-velo
        className="absolute inset-0 opacity-0"
        style={{ background: `${SOMBRA})` }}
      />
      {/* El grano ata la imagen al resto del material de la página. */}
      <div className="grano absolute inset-0 opacity-[0.06]" />
    </div>
  );
}

/* ---------------------------------------------------------------- */

type Ref = React.RefObject<HTMLDivElement | null>;

function Lienzo({ raiz, capa, velo }: { raiz: Ref; capa: Ref; velo: Ref }) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const imagenes = useRef(TOMAS.map((t) => Array<HTMLImageElement | null>(t.total).fill(null)));
  /* f = -1: nada pintado aún, así que el primer frame del bucle siempre pinta. */
  const pintado = useRef({ toma: 0, f: -1 });
  const pedidas = useRef(new Set<number>());
  const vivo = useRef(true);
  const [listo, setListo] = useState(false);

  /** Pinta el fotograma pedido o, si aún no llegó, el último disponible. */
  const pintar = useCallback(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    const { toma, f } = pintado.current;
    let img: HTMLImageElement | null = null;
    for (let k = f; k >= 0 && !img; k--) img = imagenes.current[toma][k];
    if (!img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    /* Encaje «cover»: el fotograma es 16:9 y la ventana casi nunca lo es. */
    const { width: w, height: h } = canvas;
    const escala = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * escala;
    const dh = img.naturalHeight * escala;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }, []);

  /* Descarga por lotes, en orden: los primeros llegan antes, y no se abren
     cuatrocientas peticiones a la vez. La toma del cierre no se pide hasta
     que el visitante deja atrás la apertura: quien no baja, no la paga, y
     quien baja tiene cinco secciones de margen para que llegue. */
  const pedir = useCallback((t: number) => {
    if (pedidas.current.has(t)) return;
    pedidas.current.add(t);
    (async () => {
      const total = TOMAS[t].total;
      for (let i = 0; i < total && vivo.current; i += LOTE) {
        await Promise.all(
          Array.from({ length: Math.min(LOTE, total - i) }, (_, k) => {
            const n = i + k;
            return new Promise<void>((resolver) => {
              const img = new Image();
              img.decoding = "async";
              /* Un fotograma que falle no para la cadena: `pintar` retrocede. */
              img.onload = () => { imagenes.current[t][n] = img; resolver(); };
              img.onerror = () => resolver();
              img.src = ruta(t, n);
            });
          }),
        );
        if (!vivo.current) return;
        if (t === 0 && i === 0) setListo(true);
        if (pintado.current.toma === t) pintar();
      }
    })();
  }, [pintar]);

  useEffect(() => {
    vivo.current = true;
    pedir(0);
    return () => { vivo.current = false; };
  }, [pedir]);

  /* Píxeles físicos: a 2dpr, un canvas en píxeles lógicos se ve borroso. */
  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      pintar();
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [pintar]);

  /* El bucle: toma activa, progreso, suavizado, parallax y velo. */
  useEffect(() => {
    let raf = 0;
    let suave = -1;
    let tomaSuave = -1;
    let toma = 0, objetivo = 0, presencia = 1;
    let px = 0, py = 0, mx = 0, my = 0;
    const fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const estrecha = window.matchMedia("(max-width: 767px)");

    const medir = () => {
      const vh = window.innerHeight;
      const sy = window.scrollY;
      let hay = false;
      let pasada = false;
      TOMAS.forEach((t, k) => {
        const zona = document.getElementById(t.zona);
        if (!zona) return;
        const top = zona.getBoundingClientRect().top + sy;
        const recorrido = Math.max(1, zona.offsetHeight - vh);
        const y = sy - top;
        if (k > 0 && pasada) pedir(k);
        pasada = y > recorrido;
        /* Una zona que aún no empieza a entrar no le quita el sitio a la
           anterior, que se queda en su último fotograma bajo el velo. */
        if (hay && y < -vh * 0.6) return;
        hay = true;
        toma = k;
        objetivo = limitar(y / recorrido);
        /* Entra y sale con 0,6 pantallas de fundido. Una zona que empieza en
           la primera pantalla ya está presente al cargar. */
        const entra = top < vh ? 1 : limitar(1 + y / (vh * 0.6));
        const sale = limitar(1 - (y - recorrido) / (vh * 0.6));
        presencia = Math.min(entra, sale);
      });
      if (!hay) {
        /* Páginas sin zonas —metodología, precios, legales—: la toma se
           reparte sobre el documento con el velo bajado, como entre las zonas
           de la home. A medio velo, el texto de la metodología que cruzaba el
           frasco blanco se quedaba por debajo de 4,5:1. */
        toma = 0;
        objetivo = limitar(sy / Math.max(1, document.documentElement.scrollHeight - vh));
        presencia = 0;
      }
    };

    const paso = () => {
      medir();
      /* Primer frame o cambio de toma: se coloca sin transición. Viajar desde
         el fotograma de la otra toma sería pasar por fotogramas que no tocan. */
      if (suave < 0 || toma !== tomaSuave) {
        suave = objetivo;
        tomaSuave = toma;
      } else {
        suave += (objetivo - suave) * 0.12;
      }
      if (Math.abs(objetivo - suave) < 0.0004) suave = objetivo;
      px += (mx - px) * 0.08;
      py += (my - py) * 0.08;

      const f = Math.round(suave * (TOMAS[toma].total - 1));
      if (toma !== pintado.current.toma || f !== pintado.current.f) {
        pintado.current = { toma, f };
        pintar();
        /* Legible desde fuera: la verificación de la apertura lo lee para
           saber en qué acto cae cada tramo. */
        if (raiz.current) {
          raiz.current.dataset.toma = String(toma);
          raiz.current.dataset.fotograma = String(f);
        }
      }
      if (capa.current) {
        capa.current.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0) scale(1.06)`;
      }
      /* 0,82 y no menos: medido en móvil, con 0,74 algún rótulo de las secciones
         de abajo se quedaba en 4,4:1 sobre el último fotograma.
         Dentro de una zona, en vertical, el velo no se levanta del todo: el
         recorte deja el frasco blanco ocupando media pantalla, y el texto, que
         en escritorio vive en su tercio, aquí lo cruza entero. */
      const suelo = estrecha.matches ? VELO_MOVIL : 0;
      if (velo.current) {
        velo.current.style.opacity = ((1 - presencia) * 0.82 + presencia * suelo).toFixed(3);
      }

      const quieto = suave === objetivo && Math.abs(mx - px) < 0.05 && Math.abs(my - py) < 0.05;
      raf = quieto ? 0 : requestAnimationFrame(paso);
    };

    const despertar = () => {
      if (!raf) raf = requestAnimationFrame(paso);
    };
    const alMover = (e: PointerEvent) => {
      /* Hacia donde NO está el puntero: la ventana se desplaza al contrario
         que la cabeza. Unos 22 px de recorrido total en horizontal. */
      mx = (0.5 - e.clientX / window.innerWidth) * 22;
      my = (0.5 - e.clientY / window.innerHeight) * 14;
      despertar();
    };

    window.addEventListener("scroll", despertar, { passive: true });
    window.addEventListener("resize", despertar);
    if (fino) window.addEventListener("pointermove", alMover, { passive: true });
    despertar();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", despertar);
      window.removeEventListener("resize", despertar);
      window.removeEventListener("pointermove", alMover);
    };
  }, [pintar, pedir, raiz, capa, velo]);

  return (
    <canvas
      ref={lienzo}
      aria-hidden
      className="absolute inset-0 size-full"
      style={{ opacity: listo ? 1 : 0, transition: "opacity 500ms var(--ease-out)" }}
    />
  );
}
