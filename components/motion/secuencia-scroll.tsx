"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useMovimientoReducido } from "@/lib/a11y/preferencias";
import { SPRING } from "@/lib/motion";

/**
 * M11 · La toma de producto, fotograma a fotograma con el scroll.
 *
 * El scroll no anima nada: mueve el TIEMPO de una toma ya rodada. Es la
 * técnica de las páginas de producto de Apple, y la razón de que se sienta
 * caro es que la cámara se movió de verdad —el navegador solo decide qué
 * fotograma toca—. Aquí son los 480 fotogramas del vídeo del frasco, 20
 * segundos a 24 fps extraídos con ffmpeg a `public/secuencia`.
 *
 * Por qué fotogramas sueltos y no un <video> con `currentTime`:
 * un `seek` sobre H.264 tiene que decodificar desde el keyframe anterior, así
 * que un scroll rápido encola búsquedas y la imagen se congela —justo en el
 * gesto que el usuario nota—. Un JPEG ya decodificado se pinta en el mismo
 * frame en que se pide. Cuesta 9 MB en vez de 22, y no depende de que el host
 * sirva peticiones por rango.
 *
 * Piso de rendimiento y de respeto:
 *
 *   No se descarga nada hasta que la sección se acerca. Son 9 MB: pedirlos en
 *   la carga inicial le robaría el ancho de banda al hero, que es lo único que
 *   el visitante está mirando todavía.
 *
 *   Se carga por lotes en orden, no los 480 de golpe. Así los primeros
 *   fotogramas —los únicos que hacen falta para empezar— llegan antes, y en
 *   móvil no se abren cuatrocientas peticiones a la vez.
 *
 *   Mientras un fotograma no ha llegado se pinta el último que sí llegó, nunca
 *   un hueco en negro. Scrollear rápido sobre la parte no cargada se ve como
 *   una toma lenta, no como una imagen rota.
 *
 *   Con movimiento reducido no se monta el canvas ni se pide la secuencia:
 *   queda el primer fotograma como imagen fija. Alguien que pidió que la
 *   pantalla se esté quieta no debería pagar 9 MB por una animación que no va
 *   a ver.
 */

const TOTAL = 480;
/** Tamaño de lote. Suficiente para ir por delante del scroll sin saturar la cola. */
const LOTE = 24;

const ruta = (i: number) => `/secuencia/${String(i + 1).padStart(4, "0")}.jpg`;

export function SecuenciaScroll() {
  const reduce = useMovimientoReducido();
  if (reduce) return <SecuenciaFija />;
  return <SecuenciaCanvas />;
}

/* ---------------------------------------------------------------- */

function SecuenciaCanvas() {
  const pista = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const imagenes = useRef<(HTMLImageElement | null)[]>(Array(TOTAL).fill(null));
  const indice = useRef(0);
  const [listo, setListo] = useState(false);

  const { scrollYProgress } = useScroll({
    target: pista,
    offset: ["start start", "end end"],
  });
  /* Mismo suavizado que el resto de la página: mata el jitter de la rueda sin
     despegarse de la barra de scroll. */
  const p = useSpring(scrollYProgress, SPRING.scroll);

  /** Pinta el fotograma pedido o, si aún no llegó, el último disponible. */
  const pintar = useCallback((i: number) => {
    const canvas = lienzo.current;
    if (!canvas) return;
    let img: HTMLImageElement | null = null;
    for (let k = i; k >= 0 && !img; k--) img = imagenes.current[k];
    if (!img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* Encaje «cover» a mano: el canvas ocupa la ventana y el vídeo es 16:9, así
       que en pantallas altas hay que recortar en vez de deformar. */
    const { width: w, height: h } = canvas;
    const escala = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * escala;
    const dh = img.naturalHeight * escala;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }, []);

  /* Descarga por lotes, disparada solo cuando la sección se acerca. */
  useEffect(() => {
    const nodo = pista.current;
    if (!nodo) return;
    let cancelado = false;

    const descargar = async () => {
      for (let i = 0; i < TOTAL && !cancelado; i += LOTE) {
        await Promise.all(
          Array.from({ length: Math.min(LOTE, TOTAL - i) }, (_, k) => {
            const n = i + k;
            return new Promise<void>((resolver) => {
              const img = new Image();
              img.decoding = "async";
              /* Un fotograma que falle no puede parar la cadena: se queda en
                 null y `pintar` retrocede al anterior. */
              img.onload = () => { imagenes.current[n] = img; resolver(); };
              img.onerror = () => resolver();
              img.src = ruta(n);
            });
          }),
        );
        if (cancelado) return;
        /* En cuanto hay algo que enseñar, se enseña. */
        if (i === 0) setListo(true);
        pintar(indice.current);
      }
    };

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) return;
        observador.disconnect();
        void descargar();
      },
      { rootMargin: "50% 0px" },
    );
    observador.observe(nodo);

    return () => { cancelado = true; observador.disconnect(); };
  }, [pintar]);

  /* El canvas se dimensiona en píxeles físicos: a 2dpr, un canvas de 1280
     lógicos pintado en 2560 reales es la diferencia entre nítido y borroso. */
  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return;
    const medir = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      pintar(indice.current);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [pintar]);

  useMotionValueEvent(p, "change", (v) => {
    const i = Math.min(TOTAL - 1, Math.max(0, Math.round(v * (TOTAL - 1))));
    if (i === indice.current) return;
    indice.current = i;
    pintar(i);
  });

  return (
    <section aria-labelledby="secuencia-titulo" className="relative bg-sunk">
      {/* Cuatro pantallas de recorrido para 20 segundos de toma: menos y el
          gesto se siente acelerado, más y el visitante cree que se atascó. */}
      <div ref={pista} className="relative h-[400vh]">
        <div className="sticky top-0 h-[100dvh] overflow-hidden">
          <canvas
            ref={lienzo}
            aria-hidden
            className="absolute inset-0 size-full"
            style={{ opacity: listo ? 1 : 0, transition: "opacity 480ms var(--ease-out)" }}
          />
          {/* Velo inferior: el copy tiene que leerse sobre cualquier fotograma,
              y los del final son casi blancos. */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-1/2"
            style={{ background: "linear-gradient(to top, var(--sunk), transparent)" }}
          />
          <Copia />
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */

function SecuenciaFija() {
  return (
    <section aria-labelledby="secuencia-titulo" className="relative bg-sunk">
      <div className="relative h-[100dvh] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- un fotograma
            suelto de una secuencia, no un asset con layout propio. */}
        <img
          src={ruta(0)}
          alt=""
          aria-hidden
          className="absolute inset-0 size-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/2"
          style={{ background: "linear-gradient(to top, var(--sunk), transparent)" }}
        />
        <Copia />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */

function Copia() {
  return (
    <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[1400px] px-6 pb-16 lg:px-10 lg:pb-20">
      <p className="etiqueta text-slag">La toma de producto</p>
      <h2 id="secuencia-titulo" className="mt-3 display-lg max-w-[18ch]">
        Así se ve tu producto cuando la campaña está lista.
      </h2>
      <p className="mt-4 medida cuerpo-lg text-smoke">
        Veinte segundos de cámara rodados a partir de una sola foto de producto.
        El scroll no anima nada: mueve el tiempo de la toma.
      </p>
    </div>
  );
}
