import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Wordmark — §7.1. `Landing` en Bricolage 300 y `Forge` en 700, sin espacio
 * ni separador. La marca se lee dos veces: primero qué entregas, después
 * cómo lo entregas.
 */
export function Wordmark({
  className,
  como = "enlace",
  tamano = "1.125rem",
}: {
  className?: string;
  como?: "enlace" | "texto";
  tamano?: string;
}) {
  const contenido = (
    <span
      style={{ fontSize: tamano }}
      className={cn(
        "font-[family-name:var(--font-round)] leading-none tracking-[-0.02em] text-ash",
        className,
      )}
    >
      <span style={{ fontWeight: 400 }}>Landing</span>
      <span style={{ fontWeight: 800 }}>Forge</span>
    </span>
  );

  if (como === "texto") return contenido;

  return (
    <Link
      href="/"
      aria-label="LandingForge, ir al inicio"
      className="inline-flex no-underline transition-opacity duration-[var(--dur-hover)] ease-[var(--ease-out)] hf:opacity-70"
    >
      {contenido}
    </Link>
  );
}
