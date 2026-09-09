"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useMotionTemplate } from "motion/react";
import { useMovimientoReducido } from "@/lib/a11y/preferencias";
import { cn } from "@/lib/utils";

/**
 * M7 · Sticky stack.
 *
 * Cuatro afirmaciones que se apilan físicamente, como fichas que se van
 * dejando sobre la mesa. Lo que hace que se sienta profundidad y no un
 * apilado simple: cuando la siguiente card alcanza a la de abajo, la de abajo
 * RETROCEDE. Y el retroceso lo controla el progreso de la card SIGUIENTE, no
 * el de la propia.
 *
 * En móvil se degrada a lista vertical: apilar en una pantalla estrecha no
 * lee como profundidad, lee como contenido tapado.
 */

export interface Tarjeta {
  id: string;
  titulo: string;
  texto: string;
  sello: React.ReactNode;
}

export function StickyStack({ tarjetas }: { tarjetas: Tarjeta[] }) {
  const reduce = useMovimientoReducido();
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  return (
    <div className="relative">
      {tarjetas.map((t, i) => (
        <Ficha
          key={t.id}
          tarjeta={t}
          indice={i}
          total={tarjetas.length}
          registrar={(n) => { refs.current[i] = n; }}
          reduce={Boolean(reduce)}
        />
      ))}
    </div>
  );
}

function Ficha({
  tarjeta,
  indice,
  total,
  registrar,
  reduce,
}: {
  tarjeta: Tarjeta;
  indice: number;
  total: number;
  registrar: (n: HTMLDivElement | null) => void;
  reduce: boolean;
}) {
  const propia = useRef<HTMLDivElement>(null);

  /* El retroceso lo manda la card siguiente al acercarse. */
  const { scrollYProgress } = useScroll({
    target: propia,
    offset: ["start start", "end start"],
  });

  const escala = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const opacidad = useTransform(scrollYProgress, [0, 1], [1, 0.5]);
  const transform = useMotionTemplate`scale(${escala})`;

  const esUltima = indice === total - 1;

  if (reduce) {
    return (
      <div className="border-t border-scale py-10 first:border-t-0">
        <Contenido tarjeta={tarjeta} />
      </div>
    );
  }

  return (
    <div
      ref={(n) => { propia.current = n; registrar(n); }}
      className="lg:sticky"
      style={{ top: `${96 + indice * 14}px` }}
    >
      <motion.div
        style={esUltima ? undefined : { transform, opacity: opacidad }}
        className={cn(
          "mb-5 rounded-[14px] vidrio p-8 lg:p-10",
          "origin-top",
        )}
      >
        <Contenido tarjeta={tarjeta} />
      </motion.div>
    </div>
  );
}

function Contenido({ tarjeta }: { tarjeta: Tarjeta }) {
  return (
    <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-10">
      <div>
        <h3 className="display-md">{tarjeta.titulo}</h3>
        <p className="mt-3 medida cuerpo-lg text-smoke">{tarjeta.texto}</p>
      </div>
      {/* El único lugar de la página donde el metal templado aparece a este
          tamaño: es un objeto físico, un sello. */}
      <span
        aria-hidden
        className="relative grid size-16 shrink-0 place-items-center rounded-full text-[#1A1206] shadow-[0_8px_20px_-8px_rgba(0,0,0,0.85)]"
        style={{ background: "var(--templado)" }}
      >
        <span className="absolute inset-[4px] rounded-full border border-black/25" />
        <span className="relative">{tarjeta.sello}</span>
      </span>
    </div>
  );
}
