"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useMotionValueEvent, useScroll, useSpring } from "motion/react";
import { useMovimientoReducido } from "@/lib/a11y/preferencias";
import { SPRING } from "@/lib/motion";

/**
 * LA PELÍCULA · el fondo de la página entera.
 *
 * Un solo canvas fijo a pantalla completa detrás de todo el documento. El
 * scroll no lo empuja: le mueve el TIEMPO. Los 480 fotogramas del frasco —20 s
 * a 24 fps— se reparten a lo largo de los trece mil y pico de píxeles que mide
 * la home: un fotograma cada 26 px de scroll. La cámara avanza mientras el
 * visitante lee, y no hay un solo corte entre el principio y el final.
 *
 * Esta es la diferencia con la versión anterior, que era una sección de cuatro
 * pantallas con la toma dentro: una sección con vídeo es un momento de la
 * página, y esto es la página. Sustituye al campo de luz y a la constelación,
 * que ocupaban este mismo hueco. Dos fondos a pantalla completa no pueden
 * convivir: uno tapa al otro, y el que sobrevive no es el que se eligió.
 *
 * Cómo se integra —el punto de la referencia—: el contenido NO va sobre cajas
 * opacas. Va sobre la película, con un velo por encima que hace legible el
 * texto sin apagar la imagen. Por eso el velo no es plano: pesa arriba y abajo,
 * donde se apoyan los titulares, y se abre en el centro, donde está el frasco.
 * Un velo uniforme al 70 % haría legible la página y mataría la toma; este deja
 * ver la toma y sostiene el texto.
 *
 * Piso de rendimiento y de respeto:
 *
 *   Los fotogramas se piden por lotes de 24, en orden. Los primeros —los
 *   únicos necesarios para que la página no arranque en negro— llegan antes,
 *   y no se abren cuatrocientas peticiones a la vez.
 *
 *   Mientras un fotograma no ha llegado se pinta el último que sí llegó. Nunca
 *   un hueco. Bajar rápido por una zona no cargada se ve como una toma lenta.
 *
 *   Con movimiento reducido —o en modo lectura— no se descarga la secuencia:
 *   queda un solo fotograma fijo bajo el mismo velo. Quien pidió que la
 *   pantalla se esté quieta no debería pagar 9 MB por una animación que no va
 *   a ver, y la página tiene que seguir teniendo fondo.
 */

const TOTAL = 480;
const LOTE = 24;

const ruta = (i: number) => `/secuencia/${String(i + 1).padStart(4, "0")}.jpg`;

/* El velo. Pesado en los bordes, abierto en el centro: los titulares y el copy
   viven arriba y abajo del encuadre, y el sujeto de la toma vive en medio. */
const VELO =
  "linear-gradient(180deg," +
  "rgba(10,12,16,0.90) 0%," +
  "rgba(10,12,16,0.70) 22%," +
  "rgba(10,12,16,0.58) 50%," +
  "rgba(10,12,16,0.74) 78%," +
  "rgba(10,12,16,0.92) 100%)";

/* GRADO. La toma se rodó como pieza de producto: frasco casi blanco sobre
   negro. Como imagen aislada está bien; como fondo de lectura, ese blanco es
   el problema —contra él no hay tinta secundaria que pase el piso de 4.5:1 sin
   volverse blanca del todo—. Bajando la exposición a la mitad, el pico del
   fotograma deja de ser papel y pasa a ser gris medio, que es un fondo sobre
   el que sí se puede escribir. El movimiento, que es lo que lleva la
   identidad, no pierde nada: lo que se ve es la cámara, no el brillo. */
const GRADO = "brightness(0.5) saturate(0.85) contrast(1.02)";

/* Viñeta lateral: cierra las esquinas para que el texto no compita con lo que
   pasa en los bordes del fotograma. */
const VINETA =
  "radial-gradient(120vmax 90vmax at 50% 50%, transparent 30%, rgba(10,12,16,0.55) 100%)";

/* `false` en el servidor y en el primer render del cliente; `true` a partir
   del segundo. Sin efectos ni setState —que el lint prohíbe dentro de uno—:
   es el mismo patrón que `medios.ts`. */
const suscribirNada = () => () => {};
const useMontado = () => useSyncExternalStore(suscribirNada, () => true, () => false);

export function Pelicula() {
  const reduce = useMovimientoReducido();
  /* Hasta que no se ha montado NO se pinta la variante animada, aunque no haya
     movimiento reducido. El servidor no puede leer localStorage, así que si
     montara el canvas de entrada, su efecto dispararía el primer lote de
     fotogramas antes de que la preferencia llegue: medido, 24 peticiones que
     alguien que pidió la pantalla quieta no iba a mirar. Un tick de retraso en
     un fondo es gratis; 24 imágenes que nadie ve, no. */
  const montado = useMontado();
  return !montado || reduce ? <Fija /> : <Animada />;
}

/* ---------------------------------------------------------------- */

function Animada() {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const imagenes = useRef<(HTMLImageElement | null)[]>(Array(TOTAL).fill(null));
  const indice = useRef(0);
  const [listo, setListo] = useState(false);

  /* Sin `target`: el progreso es el del documento entero, de la primera línea
     del hero al pie. Ese es el cambio que convierte una sección en una
     identidad. */
  const { scrollYProgress } = useScroll();
  const p = useSpring(scrollYProgress, SPRING.scroll);

  const pintar = useCallback((i: number) => {
    const canvas = lienzo.current;
    if (!canvas) return;
    let img: HTMLImageElement | null = null;
    for (let k = i; k >= 0 && !img; k--) img = imagenes.current[k];
    if (!img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    /* Encaje «cover» a mano: el canvas ocupa la ventana y el fotograma es 16:9,
       así que en pantallas altas hay que recortar en vez de deformar. */
    const { width: w, height: h } = canvas;
    const escala = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * escala;
    const dh = img.naturalHeight * escala;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }, []);

  /* Aquí no hay IntersectionObserver: la película es lo primero que se ve, así
     que la descarga arranca con la página. Lo que la mantiene barata es el
     orden por lotes, no el retraso. */
  useEffect(() => {
    let cancelado = false;

    (async () => {
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
        if (i === 0) setListo(true);
        pintar(indice.current);
      }
    })();

    return () => { cancelado = true; };
  }, [pintar]);

  /* El canvas se dimensiona en píxeles físicos: a 2dpr, un canvas de 1440
     lógicos pintado en 2880 reales es la diferencia entre nítido y borroso. */
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
    <Marco>
      <canvas
        ref={lienzo}
        aria-hidden
        className="absolute inset-0 size-full"
        style={{
          filter: GRADO,
          opacity: listo ? 1 : 0,
          transition: "opacity 700ms var(--ease-out)",
        }}
      />
    </Marco>
  );
}

/* ---------------------------------------------------------------- */

function Fija() {
  return (
    <Marco>
      {/* eslint-disable-next-line @next/next/no-img-element -- un fotograma de
          una secuencia, no un asset con layout propio. */}
      <img
        src={ruta(0)}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover"
        style={{ filter: GRADO }}
      />
    </Marco>
  );
}

/* ---------------------------------------------------------------- */

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      data-decorativo
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#0A0C10]"
    >
      {children}
      <div className="absolute inset-0" style={{ background: VELO }} />
      <div className="absolute inset-0" style={{ background: VINETA }} />
      {/* El grano ata la imagen al resto del material de la página. */}
      <div className="grano absolute inset-0 opacity-[0.07]" />
    </div>
  );
}
