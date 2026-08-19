"use client";

import { memo, useCallback, useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import { SPRING } from "@/lib/motion";
import { usePunteroFino } from "@/components/motion/medios";
import { cn } from "@/lib/utils";

/**
 * M10 · Botón magnético. UNO SOLO en toda la página, en el CTA del hero.
 * Más de uno se lee como truco.
 *
 * El contenedor se desplaza hacia el cursor hasta 8px; la etiqueta interna se
 * mueve a 0.35x de ese desplazamiento, y esa diferencia es lo que crea la
 * sensación de capas magnéticas.
 */
export const Magnetico = memo(function Magnetico({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const fino = usePunteroFino();
  const reduce = useReducedMotion();
  const caja = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING.magnetic);
  const sy = useSpring(y, SPRING.magnetic);

  const contenedor = useMotionTemplate`translate3d(${sx}px, ${sy}px, 0)`;
  const interiorX = useTransform(sx, (v) => v * 0.35);
  const interiorY = useTransform(sy, (v) => v * 0.35);
  const interior = useMotionTemplate`translate3d(${interiorX}px, ${interiorY}px, 0)`;

  const mover = useCallback(
    (e: React.PointerEvent) => {
      const r = caja.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const tope = 8;
      x.set(Math.max(-tope, Math.min(tope, dx * 0.35)));
      y.set(Math.max(-tope, Math.min(tope, dy * 0.35)));
    },
    [x, y],
  );

  const soltar = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  if (!fino || reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={caja}
      onPointerMove={mover}
      onPointerLeave={soltar}
      style={{ transform: contenedor }}
      className={cn("inline-block", className)}
    >
      <motion.div style={{ transform: interior }}>{children}</motion.div>
    </motion.div>
  );
});

/**
 * M9 · Spotlight de cursor. La superficie reacta a la presencia.
 * Nunca `useState`: un re-render por movimiento de mouse es un desastre.
 */
export const Spotlight = memo(function Spotlight({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const fino = usePunteroFino();
  const caja = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);

  const fondo = useMotionTemplate`radial-gradient(400px circle at ${x}px ${y}px, color-mix(in oklab, var(--heat) 12%, transparent), transparent 70%)`;

  const mover = useCallback(
    (e: React.PointerEvent) => {
      const r = caja.current?.getBoundingClientRect();
      if (!r) return;
      x.set(e.clientX - r.left);
      y.set(e.clientY - r.top);
    },
    [x, y],
  );

  if (!fino) return <div className={className}>{children}</div>;

  return (
    <div
      ref={caja}
      onPointerMove={mover}
      onPointerLeave={() => { x.set(-9999); y.set(-9999); }}
      className={cn("relative", className)}
    >
      <motion.span
        aria-hidden
        style={{ background: fondo }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-[var(--dur-hover)] [div:hover>&]:opacity-100"
      />
      {children}
    </div>
  );
});

/**
 * M8 · Parallax por capas. Máximo dos capas móviles por pantalla: tres o más
 * no lee como riqueza, lee como mareo.
 *
 * Todo pasa por un spring sobreamortiguado, para que se sienta pegado y no
 * flotando. Con movimiento reducido el desplazamiento es CERO, no una versión
 * más lenta.
 */
export const Parallax = memo(function Parallax({
  children,
  className,
  velocidad = 0.6,
  recorrido = 80,
}: {
  children: React.ReactNode;
  className?: string;
  /** 0.6 para capa de fondo, 1.0 a 1.15 para capa de frente. */
  velocidad?: number;
  /** Recorrido total en px. Solo el hero puede pasar de 80. */
  recorrido?: number;
}) {
  const reduce = useReducedMotion();
  const caja = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: caja,
    offset: ["start end", "end start"],
  });

  const bruto = useTransform(
    scrollYProgress,
    [0, 1],
    [recorrido * (1 - velocidad), -recorrido * (1 - velocidad)],
  );
  const suave = useSpring(bruto, SPRING.attached);
  const transform = useMotionTemplate`translate3d(0, ${suave}px, 0)`;

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <div ref={caja} className={className}>
      <motion.div style={{ transform }}>{children}</motion.div>
    </div>
  );
});

/**
 * M11 · Contador atado al scroll. Nunca `setState` por frame: el valor se
 * escribe directo al `textContent`. Elemento de apoyo pequeño, jamás la
 * estructura de una sección: el hero de métrica está prohibido.
 */
export const ContadorScroll = memo(function ContadorScroll({
  hasta,
  className,
  sufijo = "",
}: {
  hasta: number;
  className?: string;
  sufijo?: string;
}) {
  const reduce = useReducedMotion();
  const nodo = useRef<HTMLSpanElement>(null);
  const caja = useRef<HTMLSpanElement>(null);

  const { scrollYProgress } = useScroll({
    target: caja,
    offset: ["start 0.9", "start 0.45"],
  });
  const valor = useTransform(scrollYProgress, [0, 1], [0, hasta]);

  useMotionValueEvent(valor, "change", (v) => {
    if (!nodo.current) return;
    nodo.current.textContent = new Intl.NumberFormat("es-CO").format(Math.round(v));
  });

  return (
    <span ref={caja} className={cn("tabular-nums", className)}>
      <span ref={nodo}>{reduce ? new Intl.NumberFormat("es-CO").format(hasta) : "0"}</span>
      {sufijo}
    </span>
  );
});
