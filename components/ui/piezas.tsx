import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Piezas menores del sistema. Todas nacen de §4.4: radios de píldora solo en
 * controles pequeños, elevación declarada una vez, hairlines de 1px.
 */

/* ---------- Chip ---------- */

export function Chip({
  className,
  activo,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & { activo?: boolean }) {
  return (
    <button
      type="button"
      data-activo={activo || undefined}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 h-8",
        "text-[0.8125rem] font-medium",
        "transition-[background-color,border-color,color,transform] duration-[140ms] ease-[var(--ease-out)]",
        "active:scale-[0.97]",
        activo
          ? "bg-[var(--surface-2)] text-hi border-[var(--key)]"
          : "bg-transparent text-mid border-[var(--line)] hf:text-hi hf:border-[var(--line-strong)]",
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Badge ---------- */

type TonoBadge = "neutro" | "ok" | "aviso" | "peligro" | "maquina" | "metal";

const TONOS: Record<TonoBadge, string> = {
  neutro: "text-mid border-[var(--line)]",
  ok: "text-[var(--ok)] border-[color-mix(in_oklab,var(--ok)_40%,transparent)]",
  aviso: "text-[var(--warn)] border-[color-mix(in_oklab,var(--warn)_40%,transparent)]",
  peligro:
    "text-[var(--danger)] border-[color-mix(in_oklab,var(--danger)_40%,transparent)]",
  maquina: "text-[var(--rim-soft)] border-[color-mix(in_oklab,var(--rim)_40%,transparent)]",
  metal: "text-[var(--key-hi)] border-[var(--key-lo)]",
};

export function Badge({
  tono = "neutro",
  className,
  ...props
}: React.ComponentPropsWithoutRef<"span"> & { tono?: TonoBadge }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 h-6",
        "mono-sm leading-none",
        TONOS[tono],
        className,
      )}
      {...props}
    />
  );
}

/* ---------- Hairline ---------- */

export function Hairline({ className }: { className?: string }) {
  return <div aria-hidden className={cn("h-px w-full bg-[var(--line)]", className)} />;
}

/* ---------- Sello metálico ----------
   El degradado metálico solo va sobre superficies físicas que imiten metal
   cepillado (§4.2). Este es uno de esos sitios: el sello es un objeto. */

export function Sello({
  children,
  className,
  tamano = 48,
}: {
  children: React.ReactNode;
  className?: string;
  tamano?: number;
}) {
  return (
    <span
      aria-hidden
      style={{ width: tamano, height: tamano }}
      className={cn(
        "relative inline-grid place-items-center rounded-full shrink-0",
        "bg-[var(--metal)] text-[#1A1206]",
        // Sombra con desplazamiento y desenfoque: la luz viene de arriba.
        "shadow-[0_6px_16px_-6px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {/* Anillo interior: le da relieve de medalla en vez de disco plano. */}
      <span className="absolute inset-[3px] rounded-full border border-[rgba(26,18,6,0.28)]" />
      <span className="relative">{children}</span>
    </span>
  );
}

/* ---------- Fotograma 9:16 ----------
   La unidad atómica de composición de todo el producto (§4.1). */

export function Fotograma({
  className,
  interior,
  activo,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & {
  /** Clases para el lienzo interior. */
  interior?: string;
  /** El fotograma seleccionado gana la hairline metálica. */
  activo?: boolean;
}) {
  return (
    <div
      data-activo={activo || undefined}
      className={cn(
        "relative aspect-[9/16] overflow-hidden rounded-[12px]",
        "bg-[var(--surface-sunk)]",
        activo ? "borde-metal" : "border border-[var(--line)]",
        className,
      )}
      {...props}
    >
      <div className={cn("absolute inset-0", interior)}>{children}</div>
    </div>
  );
}

/* ---------- Dato en mono ---------- */

export function Dato({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <span className={cn("mono-sm text-lo", className)}>{children}</span>;
}
