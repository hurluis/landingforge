"use client";

import { useEffect } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { SPRING } from "@/lib/motion";
import { usePunteroFino } from "@/components/motion/medios";
import { PiezaForjada } from "@/components/motion/pieza-forjada";

/**
 * EL CAMPO DE LUZ · el fondo del estudio.
 *
 * Esto no es un aurora ni una malla de gradientes: ese efecto es el más
 * clonado de la década y el brief lo prohíbe por nombre. Es un aparejo de
 * iluminación de estudio, que es el mundo material del producto, y usa
 * exactamente el mismo esquema que la metodología le prescribe a sus
 * usuarios en cada prompt:
 *
 *   luz clave cálida  ·  relleno suave  ·  luz de contorno fría  ·  grano
 *
 * Interacción, y por qué cada una:
 *
 *   El puntero mueve la luz clave. Mover una luz por un estudio es un gesto
 *   real del oficio, no un truco. Va con un resorte muy amortiguado para que
 *   la luz tenga masa y arrastre, en vez de pegarse al cursor.
 *
 *   El scroll sube la temperatura. Arriba la página está fría, del color del
 *   material sin trabajar; a medida que se baja hacia el método y el estudio
 *   en vivo, la forja se calienta. Al final vuelve a enfriarse. Es la misma
 *   curva que sigue el argumento.
 *
 * Rendimiento: capa fija, `pointer-events-none`, fuera del flujo. Todo se
 * escribe con MotionValues y `useMotionTemplate`, así que la interacción no
 * provoca ni un render de React. Con movimiento reducido, o sin puntero fino,
 * las luces se quedan quietas en su posición de reposo: el fondo sigue
 * existiendo, solo deja de seguir a nadie.
 */
export function CampoDeLuz() {
  const reduce = useReducedMotion();
  const fino = usePunteroFino();

  /* Posición de la luz clave, en porcentaje del viewport. Reposo: arriba a
     la derecha, que es donde la metodología pone la clave. */
  const x = useMotionValue(72);
  const y = useMotionValue(18);

  const sx = useSpring(x, SPRING.attached);
  const sy = useSpring(y, SPRING.attached);

  /* La luz de contorno es fría y vive enfrente de la clave, como en un set
     real: si la clave sube, el contorno baja. */
  const rx = useTransform(sx, (v) => 100 - v);
  const ry = useTransform(sy, (v) => 100 - v * 0.55);

  const { scrollYProgress } = useScroll();
  const temp = useSpring(scrollYProgress, SPRING.scroll);

  /* La forja se calienta a mitad de recorrido y se vuelve a enfriar. */
  const intensidadClave = useTransform(temp, [0, 0.45, 0.8, 1], [20, 42, 34, 16]);
  const intensidadRim = useTransform(temp, [0, 0.5, 1], [26, 14, 22]);

  useEffect(() => {
    if (!fino || reduce) return;
    const mover = (e: PointerEvent) => {
      x.set((e.clientX / window.innerWidth) * 100);
      y.set((e.clientY / window.innerHeight) * 100);
    };
    window.addEventListener("pointermove", mover, { passive: true });
    return () => window.removeEventListener("pointermove", mover);
  }, [fino, reduce, x, y]);

  const clave = useMotionTemplate`radial-gradient(58vmax 52vmax at ${sx}% ${sy}%, color-mix(in oklab, var(--ember) ${intensidadClave}%, transparent) 0%, transparent 62%)`;
  const contorno = useMotionTemplate`radial-gradient(50vmax 46vmax at ${rx}% ${ry}%, color-mix(in oklab, var(--quench) ${intensidadRim}%, transparent) 0%, transparent 58%)`;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Suelo: grafito con caída vertical, para que el campo tenga sobre qué caer. */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#12151A_0%,#0D0F13_55%,#141821_100%)]" />

      <motion.div style={{ background: clave }} className="absolute inset-0" />
      <motion.div style={{ background: contorno }} className="absolute inset-0" />

      {/* Relleno suave: una lámina difusa que evita que las sombras se cierren. */}
      <div className="absolute inset-0 bg-[radial-gradient(80vmax_60vmax_at_50%_120%,rgba(120,132,150,0.10)_0%,transparent_60%)]" />

      {/* La pieza va aquí y no en el layout: entra después de las luces, así
          que el relleno no la lava, y antes del grano, así que la recibe. Es
          un objeto del estudio, no una capa encima del estudio. */}
      <PiezaForjada />

      {/* Grano real. Capa fija y sin eventos, como manda el piso de rendimiento. */}
      <div className="grano absolute inset-0 opacity-[0.09]" />
    </div>
  );
}
