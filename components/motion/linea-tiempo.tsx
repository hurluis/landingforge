"use client";

import { useEffect, useRef } from "react";
import { useMovimientoReducido } from "@/lib/a11y/preferencias";
import { ACTOS, TOTAL_FOTOGRAMAS, actoDe, escuchar } from "@/lib/pelicula-reloj";

/**
 * LA LÍNEA DE TIEMPO · el scroll, enseñado como lo que es.
 *
 * Toda la apertura descansa en una idea: el scroll no mueve la página, mueve
 * el cabezal de una película. Esto la hace visible. Abajo, en el margen que ya
 * dejan las secciones, corre una línea de tiempo de montaje con los cinco
 * actos de la toma marcados, y el cabezal avanza —y retrocede— con el dedo.
 * Quien baja rápido ve que está pasando fotogramas; quien se para, ve en qué
 * acto se ha parado.
 *
 * No calcula nada: lee el reloj que publica `Pelicula`, así que el número de
 * fotograma que enseña es exactamente el que está pintado, no una estimación
 * paralela que pudiera discrepar por un suavizado distinto.
 *
 * Escribe directo al DOM en cada frame; un estado de React aquí sería un render
 * por frame. Es decorativa y lleva `data-decorativo`: desaparece donde
 * desaparece la película —papel, modo lectura— porque sin toma no hay nada que
 * cronometrar. Y se desvanece al terminar la apertura.
 */

const pad = (n: number) => String(n).padStart(4, "0");

export function LineaTiempo() {
  const reduce = useMovimientoReducido();
  const raiz = useRef<HTMLDivElement>(null);
  const fotograma = useRef<HTMLSpanElement>(null);
  const segundos = useRef<HTMLSpanElement>(null);
  const etiquetas = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    if (reduce) return;
    let actoPrevio = "";
    return escuchar(({ fotograma: f, salida }) => {
      const nodo = raiz.current;
      if (!nodo) return;
      nodo.style.setProperty("--cabezal", String(f / (TOTAL_FOTOGRAMAS - 1)));
      nodo.style.opacity = String(1 - salida);
      nodo.style.visibility = salida >= 1 ? "hidden" : "visible";
      if (fotograma.current) fotograma.current.textContent = pad(f + 1);
      if (segundos.current) segundos.current.textContent = (f / 24).toFixed(1).padStart(4, "0");
      /* El acto activo solo se reescribe al cambiar, no en cada frame. */
      const acto = actoDe(f).id;
      if (acto !== actoPrevio) {
        actoPrevio = acto;
        ACTOS.forEach((a, i) => {
          etiquetas.current[i]?.toggleAttribute("data-activo", a.id === acto);
        });
      }
    });
  }, [reduce]);

  /* Con la película quieta no hay cabezal que mover. */
  if (reduce) return null;

  return (
    <div
      ref={raiz}
      aria-hidden
      data-decorativo
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30"
      style={{ ["--cabezal" as string]: 0 }}
    >
      {/* Franja de fundido, como un letterbox. En los pasillos el contenido
          del capítulo siguiente entra por abajo, y sin esto pasaba justo por
          debajo de los rótulos de los actos y se pisaban. A 96 px de alto y
          denso a la altura de los rótulos, lo que pasa por debajo se hunde en
          negro y el rótulo queda encima. En reposo no tapa nada: los capítulos
          dejan exactamente esos 96 px libres abajo. */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0A0C10]/95 via-[#0A0C10]/70 to-transparent" />
      <div className="absolute inset-x-24 bottom-3 flex items-center gap-5 md:inset-x-28">
      <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.15em] text-ash/70 tabular-nums sobre-pelicula md:inline">
        Toma 01 · <span ref={fotograma}>0001</span>
        <span className="text-ash/40"> / {pad(TOTAL_FOTOGRAMAS)}</span> ·{" "}
        <span ref={segundos}>00.0</span> s
      </span>

      <div className="relative h-px flex-1 bg-ash/20">
        {/* Lo ya recorrido. */}
        <div
          className="absolute inset-y-0 left-0 w-full origin-left bg-ash/55"
          style={{ transform: "scaleX(var(--cabezal))" }}
        />

        {ACTOS.map((a, i) => {
          const x = a.desde / (TOTAL_FOTOGRAMAS - 1);
          return (
            <span key={a.id} className="absolute top-0" style={{ left: `${x * 100}%` }}>
              <span className="absolute -top-[3px] left-0 h-[7px] w-px bg-ash/45" />
              <span
                ref={(n) => { etiquetas.current[i] = n; }}
                className="absolute bottom-2.5 left-0 hidden -translate-x-0 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.15em] text-ash/45 transition-colors duration-300 sobre-pelicula data-[activo]:text-ash md:block"
              >
                {a.nombre}
              </span>
            </span>
          );
        })}

        {/* El cabezal. Naranja: en este sistema el calor es «en proceso». */}
        <span
          className="absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-heat shadow-[0_0_12px_var(--heat)]"
          style={{ left: "calc(var(--cabezal) * 100%)" }}
        />
      </div>
      </div>
    </div>
  );
}
