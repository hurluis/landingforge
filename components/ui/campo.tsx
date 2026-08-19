"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { contarCaracteres } from "@/lib/formato";

/**
 * Campos de formulario — §12: <label> real asociado, nunca el placeholder
 * haciendo de etiqueta; error enlazado con aria-describedby y anunciado con
 * aria-live="polite".
 */

const SUPERFICIE = [
  "w-full bg-[var(--surface-1)] text-hi",
  "border border-[var(--line)] rounded-[10px]",
  "placeholder:text-lo",
  "transition-[border-color,background-color] duration-[140ms] ease-[var(--ease-out)]",
  "hf:border-[var(--line-strong)]",
  "focus:border-[var(--line-strong)]",
  "disabled:opacity-40 disabled:cursor-not-allowed",
  "aria-[invalid=true]:border-[var(--danger)]",
].join(" ");

interface EnvoltorioProps {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  /** Contador a la derecha de la etiqueta, en mono. */
  contador?: string;
  opcional?: boolean;
  children: React.ReactNode;
}

export function Envoltorio({
  id,
  etiqueta,
  ayuda,
  error,
  contador,
  opcional,
  children,
}: EnvoltorioProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="etiqueta text-mid">
          {etiqueta}
          {opcional && <span className="text-lo"> · opcional</span>}
        </label>
        {contador && <span className="mono-sm text-lo tabular-nums">{contador}</span>}
      </div>
      {children}
      {ayuda && !error && (
        <p id={`${id}-ayuda`} className="text-[0.8125rem] text-lo">
          {ayuda}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          aria-live="polite"
          className="text-[0.8125rem] text-[var(--danger)]"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export interface CampoProps extends React.ComponentPropsWithoutRef<"input"> {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  contador?: string;
  opcional?: boolean;
}

export function Campo({
  id,
  etiqueta,
  ayuda,
  error,
  contador,
  opcional,
  className,
  ...props
}: CampoProps) {
  return (
    <Envoltorio
      id={id}
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      contador={contador}
      opcional={opcional}
    >
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined}
        className={cn(SUPERFICIE, "h-10 px-3 text-[0.9375rem]", className)}
        {...props}
      />
    </Envoltorio>
  );
}

export interface AreaTextoProps extends React.ComponentPropsWithoutRef<"textarea"> {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string;
  opcional?: boolean;
  /** Muestra «n / max» en mono junto a la etiqueta. */
  limite?: number;
}

export function AreaTexto({
  id,
  etiqueta,
  ayuda,
  error,
  opcional,
  limite,
  className,
  value,
  ...props
}: AreaTextoProps) {
  const usados = typeof value === "string" ? contarCaracteres(value) : 0;
  return (
    <Envoltorio
      id={id}
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      opcional={opcional}
      contador={limite ? `${usados} / ${limite}` : undefined}
    >
      <textarea
        id={id}
        value={value}
        maxLength={limite}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined}
        className={cn(SUPERFICIE, "min-h-24 p-3 text-[0.9375rem] resize-y", className)}
        {...props}
      />
    </Envoltorio>
  );
}
