"use client";

import { useSyncExternalStore } from "react";

/**
 * Consulta de media sin setState dentro de un efecto: `useSyncExternalStore`
 * se suscribe al propio `matchMedia`, devuelve el valor del servidor sin
 * romper la hidratación, y no provoca renders en cascada.
 */
export function useMedia(consulta: string, porDefecto = false): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(consulta);
      mq.addEventListener("change", avisar);
      return () => mq.removeEventListener("change", avisar);
    },
    () => window.matchMedia(consulta).matches,
    () => porDefecto,
  );
}

/** Escritorio: donde la asimetría y el pin son decisiones. En móvil son errores. */
export const useEsEscritorio = () => useMedia("(min-width: 1024px)");

/** Puntero fino: spotlight, magnético y velocidad de marquesina viven aquí. */
export const usePunteroFino = () => useMedia("(hover: hover) and (pointer: fine)");
