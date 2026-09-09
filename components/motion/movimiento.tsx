"use client";

import { useEffect } from "react";
import { MotionConfig } from "motion/react";
import { useMovimientoReducido } from "@/lib/a11y/preferencias";
import Lenis from "lenis";

/**
 * Montaje base del movimiento — §6.3.
 *
 * `MotionConfig reducedMotion="user"` desactiva las animaciones de transform y
 * layout preservando opacidad y color, sin tocar componente por componente.
 * No reemplaza al bloque CSS: lo complementa. El CSS de prefers-reduced-motion
 * no hace absolutamente nada contra un `useTransform(scrollYProgress, ...)`,
 * porque ese motion value sigue recalculando cada frame. Por eso además cada
 * componente de scroll ramifica su valor.
 *
 * Lenis da la sensación de peso de las referencias de §4, con guardarraíles:
 * no toca el scroll táctil, no rompe anclas ni teclado, y si el usuario pidió
 * movimiento reducido no se monta en absoluto. Pelear contra el scroll nativo
 * no es premium, es molesto.
 */
export function Movimiento({ children }: { children: React.ReactNode }) {
  const reduce = useMovimientoReducido();

  useEffect(() => {
    if (reduce) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      // El scroll táctil se deja al sistema operativo: ahí la inercia nativa
      // ya es buena y suplantarla se siente mal.
      syncTouch: false,
      touchMultiplier: 1,
    });

    let frame = 0;
    const bucle = (tiempo: number) => {
      lenis.raf(tiempo);
      frame = requestAnimationFrame(bucle);
    };
    frame = requestAnimationFrame(bucle);

    // Los anclas internos siguen funcionando, y por la ruta de Lenis para que
    // no peleen dos scrolls a la vez.
    const alClic = (e: MouseEvent) => {
      const objetivo = (e.target as HTMLElement | null)?.closest?.('a[href^="#"]');
      if (!objetivo) return;
      const id = objetivo.getAttribute("href");
      if (!id || id === "#") return;
      const destino = document.querySelector(id);
      if (!destino) return;
      e.preventDefault();
      lenis.scrollTo(destino as HTMLElement, { offset: -96 });
    };
    document.addEventListener("click", alClic);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("click", alClic);
      lenis.destroy();
    };
  }, [reduce]);

  /* "user" solo mira el media query del sistema. Si el visitante pidió la
     página quieta desde el panel, hay que decírselo a Motion explícitamente o
     los componentes que animan por `MotionConfig` seguirían moviéndose. */
  return (
    <MotionConfig reducedMotion={reduce ? "always" : "user"}>{children}</MotionConfig>
  );
}
