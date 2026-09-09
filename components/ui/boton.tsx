import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Botón — los seis estados de §12: reposo, hover, foco visible, presionado,
 * cargando y deshabilitado.
 *
 * `--heat` es el ÚNICO color de acción del producto, y aparece como máximo
 * dos veces por pantalla. El texto sobre él es `--void`, nunca blanco.
 *
 * El press escala también a los hijos, y por eso se lee como un empuje
 * físico y no como un cambio de tamaño. El hover motion vive detrás de
 * `hf:`, que exige (hover: hover) y (pointer: fine).
 */

type Variante = "heat" | "heat-linea" | "contorno" | "fantasma" | "peligro";
type Tamano = "sm" | "md" | "lg";

/* `whitespace-nowrap` estuvo aquí y era un desbordamiento esperando etiqueta
   larga: un inline-flex con nowrap crece hasta el ancho del texto y se sale
   de la pantalla en vez de ajustarse. En /metodologia, «Probar la metodología
   con mi producto» medía 418px sobre un viewport de 375 y hacía que la página
   entera se desplazara 59px de lado.

   Quitarlo no cambia nada en los botones cortos —un inline-flex ya se ajusta
   a su contenido— y solo actúa cuando no cabe, que es justo el caso roto.
   Por eso las alturas de TAMANOS pasaron de `h-*` a `min-h-*`: si el texto
   parte en dos líneas, la caja crece en vez de recortarlo. */
const BASE = [
  "relative inline-flex items-center justify-center gap-2 text-center text-balance select-none",
  "max-w-full font-sans font-medium rounded-[10px] border",
  // Solo las propiedades exactas. Nunca `transition: all`.
  "transition-[transform,background-color,border-color,color,opacity]",
  "duration-[var(--dur-hover)] ease-[var(--ease-out)]",
  "active:scale-[0.97] active:duration-[var(--dur-press)]",
  "disabled:pointer-events-none disabled:opacity-40",
].join(" ");

const VARIANTES: Record<Variante, string> = {
  /* Relleno solo en tamaño lg: ver la nota de contraste más abajo. */
  heat: "bg-heat text-void border-transparent hf:bg-ember hf:-translate-y-px",
  /* Mismo significado, sin relleno: para heat en tamaños pequeños. */
  "heat-linea": "bg-transparent text-ash border-heat hf:bg-[color-mix(in_oklab,var(--heat)_14%,transparent)] hf:-translate-y-px",
  contorno: "bg-transparent text-ash border-scale-hi hf:border-heat hf:-translate-y-px",
  fantasma: "bg-transparent text-smoke border-transparent hf:text-ash hf:bg-anvil",
  peligro: cn(
    "bg-transparent text-[var(--danger)] border-scale",
    "hf:bg-[color-mix(in_oklab,var(--danger)_14%,transparent)] hf:border-[var(--danger)]",
  ),
};

const TAMANOS: Record<Tamano, string> = {
  sm: "min-h-9 py-1.5 px-3.5 text-[0.8125rem]",
  md: "min-h-11 py-2 px-5 text-[0.9375rem]",
  lg: "min-h-14 py-3 px-8 text-[1.1875rem] font-semibold leading-tight",
};

export interface BotonProps extends React.ComponentPropsWithoutRef<"button"> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  /** Reemplaza al hijo mientras carga. Verbo en gerundio. */
  textoCargando?: string;
  asChild?: boolean;
}

export const Boton = React.forwardRef<HTMLButtonElement, BotonProps>(function Boton(
  {
    className,
    variante = "contorno",
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
  /* Contraste, comprobado por scripts/verificar-contraste.mjs:
     --void sobre --heat da 3.47:1. Eso cumple el piso de 3:1 de texto grande
     pero NO el de 4.5:1 de texto normal, y §5.3 prohíbe poner blanco encima.
     La salida no es cambiar el color de marca ni saltarse la regla: es que el
     relleno naranja exista solo donde la etiqueta ES texto grande, o sea en
     tamaño lg (19px semibold). En sm y md el mismo botón pasa a contorno con
     borde heat, que conserva el significado y sube muy por encima del piso. */
  const varianteFinal: Variante =
    variante === "heat" && tamano !== "lg" ? "heat-linea" : variante;

  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      disabled={disabled ?? (asChild ? undefined : cargando)}
      aria-busy={cargando || undefined}
      className={cn(
        BASE,
        VARIANTES[varianteFinal],
        TAMANOS[tamano],
        // Cargando: el barrido de calor (M13), en CSS, para que siga fluido
        // mientras la página está ocupada llamando a la API.
        cargando && "barrido-calor cursor-progress",
        className,
      )}
      {...props}
    >
      {cargando && textoCargando ? textoCargando : children}
    </Comp>
  );
});

/**
 * Enlace con flecha. La flecha avanza en hover, gated con `hf-grupo`.
 * Es un icono dibujado de Phosphor, no un glifo Unicode.
 */
export function BotonEnlace({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"a">) {
  return (
    <a
      className={cn(
        "grupo inline-flex items-center gap-2 text-ash no-underline",
        "transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out)] hf:text-heat",
        className,
      )}
      {...props}
    >
      {children}
      <ArrowRight
        aria-hidden
        className="size-4 transition-transform duration-[var(--dur-hover)] ease-[var(--ease-out)] hf-grupo:translate-x-1"
      />
    </a>
  );
}
