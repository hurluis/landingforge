"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

/**
 * El trazo que conecta los tres pasos de "cómo funciona".
 *
 * `pathLength` atado a `scrollYProgress`: la línea se dibuja a medida que el
 * usuario baja. Es la única sección de la página que usa este mecanismo, y
 * está ganado porque ahí sí hay una secuencia real que el usuario necesita
 * leer en orden.
 */
export function TrazoConectado({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const caja = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: caja,
    offset: ["start 0.85", "end 0.6"],
  });
  const dibujo = useSpring(scrollYProgress, { stiffness: 180, damping: 30, restDelta: 0.001 });

  return (
    <div ref={caja} className={className} aria-hidden>
      {/* Escritorio: horizontal entre las tres columnas. */}
      <svg
        viewBox="0 0 1000 20"
        preserveAspectRatio="none"
        className="hidden h-5 w-full md:block"
        fill="none"
      >
        <motion.path
          d="M 40 10 L 960 10"
          stroke="var(--heat)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="0 1"
          style={{ pathLength: reduce ? 1 : dibujo }}
        />
        {[40, 500, 960].map((x) => (
          <motion.circle
            key={x}
            cx={x}
            cy={10}
            r={3.5}
            fill="var(--void)"
            stroke="var(--heat)"
            strokeWidth="1.5"
            style={{ pathLength: reduce ? 1 : dibujo }}
          />
        ))}
      </svg>

      {/* Móvil: vertical, porque los pasos se apilan. */}
      <svg
        viewBox="0 0 20 600"
        preserveAspectRatio="none"
        className="h-full w-5 md:hidden"
        fill="none"
      >
        <motion.path
          d="M 10 20 L 10 580"
          stroke="var(--heat)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ pathLength: reduce ? 1 : dibujo }}
        />
      </svg>
    </div>
  );
}
