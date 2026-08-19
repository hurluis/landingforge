"use client";

import * as React from "react";
import { useInView } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Movimiento 5 del inventario — reveal diferenciado (§5.3).
 *
 * La regla que más delata una página generada es la misma entrada `fade-up`
 * en todas las secciones. Aquí la dirección es obligatoria y la elige quien
 * escribe la sección, derivada de su contenido:
 *
 *   · lista vertical de reglas  → `arriba`    (una hoja que se imprime)
 *   · tira horizontal           → `izquierda` (una tira de negativo)
 *   · elementos comparables     → no usar esto: `Escalonado`, para que el ojo
 *                                 pueda recorrerlos
 *   · bloque de cierre          → sin reveal. No moverse también es decisión
 *
 * Corre una sola vez. Re-animar al volver a pasar es una interfaz peleándose
 * con su lector.
 */

type Desde = "arriba" | "izquierda" | "derecha" | "abajo";

interface RevelarProps extends React.ComponentPropsWithoutRef<"div"> {
  desde?: Desde;
  as?: "div" | "section" | "ul" | "ol" | "aside";
}

export function Revelar({
  desde = "arriba",
  className,
  children,
  as = "div",
  ...props
}: RevelarProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: "-100px" });
  const Etiqueta = as as React.ElementType;

  return (
    <Etiqueta
      ref={ref}
      data-desde={desde}
      data-visible={visible ? "true" : undefined}
      className={cn("revelar", className)}
      {...props}
    >
      {children}
    </Etiqueta>
  );
}

/**
 * Movimiento 6 — stagger de entrada. Para elementos comparables, donde el
 * clip-path sería incorrecto porque el ojo debe poder recorrerlos.
 * Máximo 8 escalonados; el resto entra junto (lo resuelve el CSS).
 */
interface EscalonadoProps extends React.ComponentPropsWithoutRef<"div"> {
  /** Stagger de 60ms en vez de 40ms, para elementos que se comparan entre sí. */
  lento?: boolean;
  as?: "div" | "ul" | "ol";
}

export function Escalonado({
  className,
  children,
  lento = false,
  as = "div",
  ...props
}: EscalonadoProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, margin: "-80px" });
  const Etiqueta = as as React.ElementType;

  return (
    <Etiqueta
      ref={ref}
      data-visible={visible ? "true" : undefined}
      className={cn("escalonado", lento && "escalonado-lento", className)}
      {...props}
    >
      {children}
    </Etiqueta>
  );
}
