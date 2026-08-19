import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Botón — los seis estados de §11: reposo, hover, foco visible, presionado,
 * cargando y deshabilitado.
 *
 * Movimiento 2 (press) y 3 (elevación de luz) del inventario de §5.3:
 *  · press    → scale(0.97) en :active, 160ms var(--ease-out)
 *  · hover    → la superficie sube su luminancia, la hairline pasa a --key
 *               y el botón sube 1px. 140ms. Gated con `hf:` = (hover: hover)
 *               and (pointer: fine).
 *  · cargando → el barrido de luz de contorno (movimiento 9), en CSS, para que
 *               siga fluido mientras la página está ocupada generando.
 */

type Variante = "primario" | "papel" | "secundario" | "fantasma" | "peligro";
type Tamano = "sm" | "md" | "lg";

const BASE = [
  "relative inline-flex items-center justify-center gap-2",
  "font-sans font-medium whitespace-nowrap select-none",
  "rounded-[10px] border",
  // Solo las propiedades exactas. Nunca `transition: all`.
  "transition-[transform,background-color,border-color,color,opacity]",
  "duration-[140ms] ease-[var(--ease-out)]",
  "active:scale-[0.97] active:duration-[var(--dur-press)]",
  "disabled:pointer-events-none disabled:opacity-40",
  "[&_svg]:shrink-0",
].join(" ");

const VARIANTES: Record<Variante, string> = {
  /* El oro. Acento primario: uno por vista, no más (§4.2). */
  primario: cn(
    "bg-[var(--key)] text-[#17120A] border-transparent",
    "hf:bg-[var(--key-hi)] hf:-translate-y-px",
  ),
  /* Papel fotográfico. Para el CTA de la barra, que convive con el del hero
     sin gastar una segunda mancha de oro en la misma pantalla. */
  papel: cn(
    "bg-[var(--text-hi)] text-[var(--canvas)] border-transparent",
    "hf:bg-white hf:-translate-y-px",
  ),
  secundario: cn(
    "bg-[var(--surface-1)] text-hi border-[var(--line)]",
    "hf:bg-[var(--surface-2)] hf:border-[var(--key)] hf:-translate-y-px",
  ),
  fantasma: cn(
    "bg-transparent text-mid border-transparent",
    "hf:text-hi hf:bg-[var(--surface-1)]",
  ),
  peligro: cn(
    "bg-transparent text-[var(--danger)] border-[var(--line)]",
    "hf:bg-[color-mix(in_oklab,var(--danger)_12%,transparent)] hf:border-[var(--danger)]",
  ),
};

const TAMANOS: Record<Tamano, string> = {
  sm: "h-8 px-3 text-[0.8125rem] [&_svg]:size-4",
  md: "h-10 px-4 text-[0.875rem] [&_svg]:size-4",
  lg: "h-12 px-6 text-[0.9375rem] [&_svg]:size-5",
};

export interface BotonProps extends React.ComponentPropsWithoutRef<"button"> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  /** Texto que reemplaza al hijo mientras carga. Verbo en gerundio. */
  textoCargando?: string;
  asChild?: boolean;
}

export const Boton = React.forwardRef<HTMLButtonElement, BotonProps>(
  function Boton(
    {
      className,
      variante = "secundario",
      tamano = "md",
      cargando = false,
      textoCargando,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-cargando={cargando || undefined}
        disabled={disabled ?? (asChild ? undefined : cargando)}
        aria-busy={cargando || undefined}
        className={cn(
          BASE,
          VARIANTES[variante],
          TAMANOS[tamano],
          cargando && "barrido-rim cursor-progress",
          className,
        )}
        {...props}
      >
        {cargando && textoCargando ? textoCargando : children}
      </Comp>
    );
  },
);

/**
 * Enlace con flecha — la acción secundaria del hero. La flecha avanza en
 * hover: 140ms, transform, gated con `hf-grupo`. Sin subrayado permanente.
 * La flecha es un icono dibujado (lucide), no el glifo Unicode → (§4.5).
 */
export function BotonEnlace({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"a">) {
  return (
    <a
      className={cn(
        "grupo inline-flex items-center gap-2 text-hi no-underline",
        "transition-colors duration-[140ms] ease-[var(--ease-out)]",
        "hf:text-[var(--key)]",
        className,
      )}
      {...props}
    >
      {children}
      <ArrowRight
        aria-hidden
        strokeWidth={1.5}
        className={cn(
          "size-4 transition-transform duration-[140ms] ease-[var(--ease-out)]",
          "hf-grupo:translate-x-1",
        )}
      />
    </a>
  );
}
