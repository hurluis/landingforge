import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Wordmark — §3.1. `Landing` en Fraunces 300 y `Forge` en Fraunces 500, sin
 * espacio ni separador. La marca se lee dos veces: primero qué es, después
 * cómo se hace.
 */
export function Wordmark({
  className,
  como = "enlace",
  tamano = "1.0625rem",
}: {
  className?: string;
  como?: "enlace" | "texto";
  tamano?: string;
}) {
  const contenido = (
    <span
      style={{ fontSize: tamano }}
      className={cn(
        "font-[family-name:var(--font-fraunces)] leading-none tracking-[-0.02em] text-hi",
        className,
      )}
    >
      <span style={{ fontWeight: 300 }}>Landing</span>
      <span style={{ fontWeight: 500 }}>Forge</span>
    </span>
  );

  if (como === "texto") return contenido;

  return (
    <Link
      href="/"
      aria-label="LandingForge, ir al inicio"
      className="inline-flex no-underline transition-opacity duration-[140ms] ease-[var(--ease-out)] hf:opacity-80"
    >
      {contenido}
    </Link>
  );
}
