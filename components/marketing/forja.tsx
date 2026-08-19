"use client";

import * as React from "react";
import Image from "next/image";
import {
  animate,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useTransform,
  motion,
} from "motion/react";
import { ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * LA FORJA — el elemento firma (§4.7). Movimiento 1 del inventario (§5.3).
 *
 * Muestra el producto entero en un solo gesto: de prosa a imagen. A la
 * izquierda el prompt se escribe solo siguiendo la estructura real de la
 * metodología; a la derecha la pieza pasa de material en bruto —casi negra,
 * con grano y desenfoque fuerte— a pieza terminada. En el instante exacto en
 * que queda lista, la hairline del fotograma pasa a la rampa metálica: la
 * única vez que el oro aparece en todo el hero.
 *
 * Ingredientes: clip-path + filter: blur + typewriter · 2.4s · --ease-in-out ·
 * una sola vez · useInView({ once: true }).
 *
 * Toda la animación corre SIN un solo render de React: el progreso vive en un
 * MotionValue, las propiedades se derivan de él, y tanto el texto como el
 * estado «terminado» se escriben directamente sobre el DOM. `will-change` se
 * pone al arrancar y se quita al terminar, como pide §12.
 */

const DURACION = 2.4;

/** Las cinco frases de la estructura real: formato y paleta → titular →
 *  visual principal → bloque de iluminación → cierre de mood. */
const FRASES = [
  "PALETA: #1A1512 fondo · #C87941 acento · #F6EFE7 texto · #2A2119 secundario · #E8C39E energía. Formato vertical 9:16.",
  "Titular «Piel firme en 8 semanas» como el elemento de texto más grande de la pieza, arriba a la izquierda.",
  "Visual principal: el frasco ámbar de pie sobre piedra caliza, ocupando tres cuartos de la altura del fotograma, con sombra de contacto.",
  "ILUMINACIÓN: clave cálida a 45° arriba a la derecha, relleno suave a la izquierda, contorno frío que separa el envase del fondo.",
  "Cierre de mood: sereno y caro, sin brillos de plástico. Sello de contraentrega abajo y precio $129.900 en la esquina.",
] as const;

/** La paleta asignada a esta campaña de ejemplo — «Cal y cobre» de la matriz. */
const SWATCHES = [
  { hex: "#1A1512", rol: "fondo" },
  { hex: "#C87941", rol: "acento" },
  { hex: "#F6EFE7", rol: "texto" },
  { hex: "#2A2119", rol: "secundario" },
  { hex: "#E8C39E", rol: "energía" },
] as const;

const TOTAL_CARACTERES = FRASES.reduce((n, f) => n + f.length, 0);
/** La escritura ocupa el 88 % del recorrido; el resto es el asentado. */
const VENTANA_TIPEO = 0.88;

const mezcla = (a: number, b: number, t: number) => a + (b - a) * t;
const recorte = (v: number) => Math.max(0, Math.min(1, v));

export function Forja({ className }: { className?: string }) {
  const contenedor = React.useRef<HTMLDivElement>(null);
  const marco = React.useRef<HTMLDivElement>(null);
  const capa = React.useRef<HTMLDivElement>(null);
  const nodosFrase = React.useRef<(HTMLSpanElement | null)[]>([]);
  const enVista = useInView(contenedor, { once: true, margin: "-80px" });
  const reduce = useReducedMotion();

  const progreso = useMotionValue(0);

  /* ---- Propiedades derivadas. Cero renders de React. ---- */

  const filtro = useTransform(progreso, (p) => {
    const t = Math.min(1, p / 0.82); // la imagen se forma antes que el texto
    return `blur(${mezcla(20, 0, t).toFixed(2)}px) saturate(${mezcla(0.05, 1, t).toFixed(3)}) brightness(${mezcla(0.22, 1, t).toFixed(3)}) contrast(${mezcla(0.75, 1.02, t).toFixed(3)})`;
  });

  const escalaPieza = useTransform(
    progreso,
    (p) => `scale(${mezcla(1.06, 1, Math.min(1, p / 0.82)).toFixed(4)})`,
  );

  const opacidadGrano = useTransform(progreso, (p) =>
    mezcla(0.62, 0.12, Math.min(1, p / 0.82)),
  );

  /* Los elementos de la sección se asientan al final con clip-path: el titular
     se imprime sobre la pieza en vez de aparecer de la nada. */
  const clipTitular = useTransform(
    progreso,
    (p) => `inset(0 ${((1 - recorte((p - 0.7) / 0.22)) * 100).toFixed(1)}% 0 0)`,
  );
  const opacidadSellos = useTransform(progreso, (p) => recorte((p - 0.82) / 0.16));
  const ySellos = useTransform(
    progreso,
    (p) => `translateY(${mezcla(6, 0, recorte((p - 0.86) / 0.14)).toFixed(2)}px)`,
  );

  /* ---- Escritura del prompt, directamente sobre los nodos ---- */

  const escribir = React.useCallback((p: number) => {
    let restantes = Math.round(TOTAL_CARACTERES * Math.min(1, p / VENTANA_TIPEO));
    for (let i = 0; i < FRASES.length; i++) {
      const nodo = nodosFrase.current[i];
      if (!nodo) continue;
      const frase = FRASES[i];
      const visibles = Math.max(0, Math.min(frase.length, restantes));
      const texto = frase.slice(0, visibles);
      if (nodo.textContent !== texto) nodo.textContent = texto;
      if (visibles > 0 && visibles < frase.length) nodo.dataset.activa = "true";
      else delete nodo.dataset.activa;
      restantes -= frase.length;
    }
  }, []);

  useMotionValueEvent(progreso, "change", escribir);

  /* ---- Arranque ---- */

  const forjar = React.useCallback(() => {
    if (marco.current) delete marco.current.dataset.terminado;

    /* Movimiento reducido: la pieza aparece ya terminada con un fundido de
       300ms y el prompt se muestra completo, sin tipeo (§4.7). */
    if (reduce) {
      progreso.set(1);
      escribir(1);
      if (marco.current) marco.current.dataset.terminado = "true";
      return;
    }

    if (capa.current) capa.current.style.willChange = "filter, transform";
    progreso.set(0);
    escribir(0);

    const control = animate(progreso, 1, {
      duration: DURACION,
      ease: [0.77, 0, 0.175, 1], // --ease-in-out
      onComplete: () => {
        if (capa.current) capa.current.style.willChange = "auto";
        if (marco.current) marco.current.dataset.terminado = "true";
      },
    });
    return () => control.stop();
  }, [escribir, progreso, reduce]);

  React.useEffect(() => {
    if (!enVista) return;
    return forjar();
  }, [enVista, forjar]);

  return (
    <div ref={contenedor} className={cn("flex flex-col gap-6", className)}>
      <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-end">
        {/* ---------- El prompt escribiéndose ---------- */}
        <div
          className="order-2 sm:order-1 min-w-0"
          aria-label="Prompt construido por LandingForge"
        >
          <ol className="flex flex-col gap-2.5 mono-sm leading-relaxed text-smoke">
            {FRASES.map((_, i) => (
              <li key={i} className="min-h-[1.4em]">
                <span
                  ref={(n) => {
                    nodosFrase.current[i] = n;
                  }}
                  className={cn(
                    "align-baseline",
                    // El cursor solo existe mientras esa frase se escribe.
                    "data-[activa=true]:after:content-[''] data-[activa=true]:after:inline-block",
                    "data-[activa=true]:after:w-[0.5em] data-[activa=true]:after:h-[1em]",
                    "data-[activa=true]:after:translate-y-[0.15em]",
                    "data-[activa=true]:after:bg-[var(--quench)] data-[activa=true]:after:ml-0.5",
                  )}
                />
              </li>
            ))}
          </ol>

          {/* Fila de swatches de la paleta asignada, con sus hex en mono. */}
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2">
            {SWATCHES.map((s) => (
              <div key={s.hex} className="flex items-center gap-2">
                <span
                  aria-hidden
                  style={{ background: s.hex }}
                  className="size-3.5 rounded-[3px] border border-[var(--scale)]"
                />
                <span className="mono-sm text-slag">{s.hex}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---------- El fotograma ---------- */}
        <div className="order-1 sm:order-2 mx-auto sm:mx-0 w-full max-w-[268px]">
          <div ref={marco} className="marco-forja relative aspect-[9/16] w-full overflow-hidden rounded-[12px] bg-[var(--sunk)]">
            <motion.div
              ref={capa}
              style={{ filter: filtro, transform: escalaPieza }}
              className="absolute inset-0"
            >
              <Image
                src="/pieza/frasco.png"
                alt="Sección hero generada: frasco de colágeno sobre superficie de piedra, con luz de estudio cálida"
                width={540}
                height={960}
                priority
                sizes="268px"
                className="size-full object-cover"
              />
            </motion.div>

            {/* Grano: asset de ruido real, no un filtro SVG (§4.8). */}
            <motion.div
              aria-hidden
              style={{ opacity: opacidadGrano }}
              className="absolute inset-0 z-[2] mix-blend-overlay bg-[url('/textura/grano.png')] bg-[length:128px_128px]"
            />

            {/* Elementos de la sección que se asientan sobre el fotograma. */}
            <div className="absolute inset-0 z-[3] flex flex-col justify-between p-4">
              <motion.p
                style={{ clipPath: clipTitular }}
                className="display-md text-[1.35rem] leading-[1.1] text-[#F6EFE7] drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
              >
                Piel firme en 8 semanas
              </motion.p>

              <div className="flex items-end justify-between gap-2">
                <motion.span
                  style={{ transform: ySellos, opacity: opacidadSellos }}
                  className="mono-sm rounded-[6px] bg-[#1A1512]/85 px-2 py-1 text-[#E8C39E] backdrop-blur-[2px]"
                >
                  $129.900
                </motion.span>
                <motion.span
                  style={{ opacity: opacidadSellos }}
                  className="mono-sm rounded-full border border-[#C87941] px-2.5 py-1 text-[0.6875rem] text-[#E8C39E]"
                >
                  contraentrega
                </motion.span>
              </div>
            </div>
          </div>

          {/* Control discreto para volver a verlo. */}
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="mono-sm text-slag">9:16 · 2K</span>
            <button
              type="button"
              onClick={() => forjar()}
              className={cn(
                "grupo inline-flex items-center gap-1.5 mono-sm text-slag",
                "transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-smoke",
              )}
            >
              <ArrowCounterClockwise 
                aria-hidden
                className="size-3.5 transition-transform duration-[300ms] ease-[var(--ease-out)] hf-grupo:-rotate-90"
              />
              Volver a forjar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
