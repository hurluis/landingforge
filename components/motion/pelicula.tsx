"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMovimientoReducido, usePreferencias } from "@/lib/a11y/preferencias";
import { useMedia } from "@/components/motion/medios";
import { TOTAL_FOTOGRAMAS, publicar } from "@/lib/pelicula-reloj";

/**
 * LA PELÍCULA · la toma de producto que protagoniza la apertura.
 *
 * Un canvas fijo a pantalla completa. El scroll no lo empuja: le mueve el
 * TIEMPO. Los 480 fotogramas —20 s a 24 fps, extraídos del vídeo con ffmpeg—
 * se reparten a lo largo de la zona de la apertura (`#pelicula-zona`), no del
 * documento entero. Es la decisión que hace que el copy caiga donde cae: la
 * apertura mide tres pantallas y dos pasillos, y con la toma repartida sobre
 * ella el estudio coincide con el hero, el primer plano de la marca con la
 * metodología y la mano con lo que el cliente se lleva. Repartida sobre la
 * página entera, el primer plano de la marca caía en la tabla de precios.
 *
 * Pasada la zona la toma se queda en su último fotograma y un velo baja sobre
 * ella: la toma terminó y empieza la página. Lo de abajo son precios y
 * preguntas, que se leen, no se miran, y no deben competir con un plano a
 * plena luz.
 *
 * Tres detalles que no se ven hasta que faltan:
 *
 *   Un solo árbol. El póster —el primer fotograma como <img>— está siempre
 *   debajo del canvas y nunca se desmonta. La versión anterior cambiaba de
 *   componente al hidratar, y entre que el <img> se iba y el canvas recibía su
 *   primer lote había un instante en negro.
 *
 *   Suavizado propio: `suave += (objetivo − suave) · 0.12` por frame, el de la
 *   referencia. El bucle solo corre mientras hay algo que alcanzar —scroll,
 *   ratón— y se duerme en cuanto converge: una página quieta no gasta CPU.
 *
 *   La cámara respira con el ratón. El plano está escalado un 6 % y se desplaza
 *   unos píxeles hacia donde no está el puntero, como si el visitante moviera
 *   la cabeza delante de una ventana. Solo con puntero fino y sin movimiento
 *   reducido: en táctil no hay puntero que seguir.
 *
 * Con movimiento reducido o modo lectura no se pide la secuencia: queda el
 * póster, bajo la misma viñeta, y la página conserva su fondo.
 */

const LOTE = 24;
const ruta = (i: number) => `/secuencia/${String(i + 1).padStart(4, "0")}.jpg`;

/* Casi nada: la toma se ve como se rodó. */
const GRADO = "saturate(0.96) contrast(1.04)";

/* VIÑETA. Sustituye al paño lateral de la versión anterior. Con el copy en una
   columna izquierda hacía falta oscurecer media pantalla; con el copy en las
   cuatro esquinas —el esquema de la referencia— basta con cerrar las
   esquinas, que es donde está la letra. Y es donde más falta hace: en el
   primer acto entra luz de ventana por las dos esquinas superiores. */
const VINETA =
  "radial-gradient(ellipse 78% 72% at 50% 50%, transparent 38%, rgba(8,9,12,0.55) 78%, rgba(8,9,12,0.86) 100%)";

/* Asiento para la fila inferior: titular a la izquierda, panel a la derecha. */
const ASIENTO =
  "linear-gradient(180deg, rgba(8,9,12,0.42) 0%, transparent 22%, transparent 52%, rgba(8,9,12,0.62) 100%)";

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
  /* Sobre papel la película no se ve —el CSS la oculta—, y montar el canvas
     igualmente descargaba los 11 MB de fotogramas para no enseñarlos. Aquí se
     replica la misma condición que usa el CSS para ocultarla. */
  const { preferencias } = usePreferencias();
  const sistemaClaro = useMedia("(prefers-color-scheme: light)");
  const oculta =
    preferencias.tema === "claro" || (preferencias.tema === "sistema" && sistemaClaro);
  const animada = montado && !reduce && !oculta;

  const capa = useRef<HTMLDivElement>(null);
  const velo = useRef<HTMLDivElement>(null);

  return (
    <div
      aria-hidden
      data-decorativo
      data-pelicula
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0A0C10]"
    >
      <div
        ref={capa}
        className="absolute inset-0 will-change-transform"
        style={{ filter: GRADO, transform: animada ? "scale(1.06)" : undefined }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- el primer
            fotograma de una secuencia, no un asset con layout propio. */}
        <img
          src={ruta(0)}
          alt=""
          aria-hidden
          fetchPriority="high"
          className="absolute inset-0 size-full object-cover"
        />
        {animada && <Lienzo capa={capa} velo={velo} />}
      </div>
      <div className="absolute inset-0" style={{ background: VINETA }} />
      <div className="absolute inset-0" style={{ background: ASIENTO }} />
      <div ref={velo} className="absolute inset-0 bg-[#0A0C10] opacity-0" />
      {/* El grano ata la imagen al resto del material de la página. */}
      <div className="grano absolute inset-0 opacity-[0.06]" />
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Lienzo({
  capa,
  velo,
}: {
  capa: React.RefObject<HTMLDivElement | null>;
  velo: React.RefObject<HTMLDivElement | null>;
}) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const imagenes = useRef<(HTMLImageElement | null)[]>(Array(TOTAL_FOTOGRAMAS).fill(null));
  const indice = useRef(-1);
  const [listo, setListo] = useState(false);

  /** Pinta el fotograma pedido o, si aún no llegó, el último disponible. */
  const pintar = useCallback((i: number) => {
    const canvas = lienzo.current;
    if (!canvas) return;
    let img: HTMLImageElement | null = null;
    for (let k = i; k >= 0 && !img; k--) img = imagenes.current[k];
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
     cuatrocientas peticiones a la vez. */
  useEffect(() => {
    let cancelado = false;
    (async () => {
      for (let i = 0; i < TOTAL_FOTOGRAMAS && !cancelado; i += LOTE) {
        await Promise.all(
          Array.from({ length: Math.min(LOTE, TOTAL_FOTOGRAMAS - i) }, (_, k) => {
            const n = i + k;
            return new Promise<void>((resolver) => {
              const img = new Image();
              img.decoding = "async";
              /* Un fotograma que falle no para la cadena: `pintar` retrocede. */
              img.onload = () => { imagenes.current[n] = img; resolver(); };
              img.onerror = () => resolver();
              img.src = ruta(n);
            });
          }),
        );
        if (cancelado) return;
        if (i === 0) setListo(true);
        pintar(Math.max(0, indice.current));
      }
    })();
    return () => { cancelado = true; };
  }, [pintar]);

  /* Píxeles físicos: a 2dpr, un canvas en píxeles lógicos se ve borroso. */
  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      pintar(Math.max(0, indice.current));
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [pintar]);

  /* El bucle: progreso de la zona, suavizado, parallax, velo y publicación. */
  useEffect(() => {
    let raf = 0;
    let suave = -1;
    let objetivo = 0;
    let salida = 0;
    let px = 0, py = 0, mx = 0, my = 0;
    const fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const medir = () => {
      const vh = window.innerHeight;
      const zona = document.getElementById("pelicula-zona");
      if (zona) {
        const top = zona.getBoundingClientRect().top + window.scrollY;
        const recorrido = Math.max(1, zona.offsetHeight - vh);
        const y = window.scrollY - top;
        objetivo = limitar(y / recorrido);
        /* Pasada la zona, el velo baja a lo largo de 0,6 pantallas. */
        salida = limitar((y - recorrido) / (vh * 0.6));
      } else {
        /* Páginas sin apertura: la toma se reparte sobre el documento. */
        const recorrido = Math.max(1, document.documentElement.scrollHeight - vh);
        objetivo = limitar(window.scrollY / recorrido);
        salida = 0.55;
      }
    };

    const paso = () => {
      medir();
      /* Primer frame: se coloca sin transición, no se viaja desde 0. */
      suave = suave < 0 ? objetivo : suave + (objetivo - suave) * 0.12;
      if (Math.abs(objetivo - suave) < 0.0004) suave = objetivo;
      px += (mx - px) * 0.08;
      py += (my - py) * 0.08;

      const f = Math.round(suave * (TOTAL_FOTOGRAMAS - 1));
      if (f !== indice.current) {
        indice.current = f;
        pintar(f);
      }
      if (capa.current) {
        capa.current.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0) scale(1.06)`;
      }
      /* 0,82 y no menos: medido en móvil, con 0,74 algún rótulo de las secciones
         de abajo se quedaba en 4,4:1 sobre el último fotograma. */
      if (velo.current) velo.current.style.opacity = (salida * 0.82).toFixed(3);
      publicar({ fotograma: f, progreso: suave, salida });

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
  }, [pintar, capa, velo]);

  return (
    <canvas
      ref={lienzo}
      aria-hidden
      className="absolute inset-0 size-full"
      style={{ opacity: listo ? 1 : 0, transition: "opacity 500ms var(--ease-out)" }}
    />
  );
}
