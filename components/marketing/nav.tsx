"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Boton } from "@/components/ui/boton";
import { Wordmark } from "@/components/marketing/wordmark";

/**
 * Barra de navegación — §6.2.1. Fija, 64px. El backdrop-filter solo aparece
 * cuando hay scroll, y aquí el blur es real: hay contenido pasando por detrás.
 * La hairline inferior aparece con el mismo gesto.
 */

const ENLACES = [
  { href: "/metodologia", texto: "Metodología" },
  { href: "/precios", texto: "Precios" },
] as const;

export function Nav() {
  const [conScroll, setConScroll] = React.useState(false);
  const [menuAbierto, setMenuAbierto] = React.useState(false);

  React.useEffect(() => {
    const alScrollear = () => setConScroll(window.scrollY > 8);
    alScrollear();
    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => window.removeEventListener("scroll", alScrollear);
  }, []);

  // El menú móvil bloquea el scroll de fondo mientras está abierto.
  React.useEffect(() => {
    if (!menuAbierto) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [menuAbierto]);

  return (
    <header
      data-scroll={conScroll || undefined}
      className={cn(
        "fixed inset-x-0 top-0 z-40 h-16",
        "transition-[background-color,backdrop-filter,border-color] duration-[200ms] ease-[var(--ease-out)]",
        "border-b",
        conScroll
          ? "bg-[color-mix(in_oklab,var(--canvas)_72%,transparent)] backdrop-blur-[12px] border-[var(--line)]"
          : "bg-transparent border-transparent",
      )}
    >
      <nav
        aria-label="Principal"
        className="mx-auto flex h-full max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-8"
      >
        <div className="flex items-center gap-8">
          <Wordmark />
          <ul className="hidden md:flex items-center gap-6">
            {ENLACES.map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className={cn(
                    "etiqueta text-mid no-underline",
                    "transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-hi",
                  )}
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/entrar"
            className={cn(
              "hidden sm:inline-flex etiqueta text-mid no-underline px-2",
              "transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-hi",
            )}
          >
            Entrar
          </Link>
          {/* Papel, no oro: el oro del hero es de La Forja y del CTA principal.
              Dos manchas doradas en la misma pantalla ya sería una de más. */}
          <Boton asChild variante="papel" tamano="sm" className="hidden sm:inline-flex">
            <Link href="/app/nueva">Crear mi primera landing</Link>
          </Boton>
          <Boton asChild variante="papel" tamano="sm" className="sm:hidden">
            <Link href="/app/nueva">Crear landing</Link>
          </Boton>

          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            className={cn(
              "md:hidden inline-grid size-9 place-items-center rounded-[10px] text-mid",
              "transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-hi active:scale-[0.97]",
            )}
          >
            {menuAbierto ? (
              <X strokeWidth={1.5} className="size-5" />
            ) : (
              <Menu strokeWidth={1.5} className="size-5" />
            )}
          </button>
        </div>
      </nav>

      {menuAbierto && (
        <div
          id="menu-movil"
          className={cn(
            "md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-[var(--canvas)] px-4 pt-4",
            "animate-[menu-entra_var(--dur-menu)_var(--ease-out)] origin-top",
          )}
        >
          <ul className="flex flex-col">
            {[...ENLACES, { href: "/entrar", texto: "Entrar" }].map((e) => (
              <li key={e.href} className="border-b border-[var(--line)]">
                <Link
                  href={e.href}
                  onClick={() => setMenuAbierto(false)}
                  className="block py-4 titulo text-mid no-underline hf:text-hi"
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
