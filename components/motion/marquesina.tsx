"use client";

import { useEffect, useRef } from "react";
import {
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useVelocity,
} from "motion/react";
import { asignarPaleta } from "@/lib/metodologia/paletas";
import { Lamina } from "@/components/marketing/lamina";
import { SPRING } from "@/lib/motion";

/**
 * M4 · El muestrario: la marquesina que sabe que estás scrolleando.
 *
 * Justo debajo del hero, una tira infinita de fotogramas 9:16. Su único
 * trabajo es probar que el producto produce, sin titular ni explicación.
 *
 * La animación base es CSS puro, así que corre fuera del hilo principal.
 * JS solo modula su DURACIÓN según la velocidad de scroll: cuando el usuario
 * scrollea rápido la tira acelera, cuando para vuelve a su ritmo. Eso es lo
 * que la hace sentir conectada a la página en vez de un GIF de fondo.
 *
 * Máximo una marquesina en toda la página.
 */

const PALETAS = [
  asignarPaleta("dispositivo-belleza", { genero: "f", edadMin: 25, edadMax: 45 }),
  asignarPaleta("suplemento-deportivo", { genero: "m", edadMin: 20, edadMax: 34 }),
  asignarPaleta("skincare-lujo", { genero: "f", edadMin: 28, edadMax: 50 }),
  asignarPaleta("electronica", { genero: "mixto", edadMin: 25, edadMax: 45 }),
  asignarPaleta("cosmetica", { genero: "f", edadMin: 30, edadMax: 55 }),
  asignarPaleta("suplemento-natural", { genero: "mixto", edadMin: 30, edadMax: 60 }),
];

const ORDEN = ["hero", "antes-despues", "testimonios", "estilo-de-vida", "confianza", "precios"] as const;

export function Marquesina() {
  const reduce = useReducedMotion();
  const pista = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const bruta = useVelocity(scrollY);
  const velocidad = useSpring(0, SPRING.attached);

  useMotionValueEvent(bruta, "change", (v) => {
    velocidad.set(Math.min(1, Math.abs(v) / 2400));
  });

  /* La duración se escribe directo sobre la variable CSS, así que la animación
     sigue corriendo fuera del hilo principal: JS solo la modula. */
  useEffect(() => {
    if (reduce) return;
    return velocidad.on("change", (v) => {
      const nodo = pista.current;
      if (!nodo) return;
      // De 48s en reposo a 14s a máxima velocidad de scroll.
      nodo.style.setProperty("--vel", `${(48 - v * 34).toFixed(1)}s`);
    });
  }, [reduce, velocidad]);

  const piezas = [...ORDEN, ...ORDEN];

  return (
    <section aria-label="Muestrario de secciones generadas" className="marquesina overflow-hidden py-6">
      <div ref={pista} className="marquesina-pista gap-5">
        {piezas.map((id, i) => (
          <div key={`${id}-${i}`} className="w-[180px] shrink-0 sm:w-[220px]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[14px] border border-scale bg-sunk">
              <Lamina tipologia={id} paleta={PALETAS[i % PALETAS.length]} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
