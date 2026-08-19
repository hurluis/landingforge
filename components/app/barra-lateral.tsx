"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutGrid,
  PlusCircle,
  UserRound,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import type { Usuario } from "@/lib/datos/tipos";
import { plan as definicionPlan } from "@/lib/planes";
import { cn } from "@/lib/utils";

/**
 * Chrome de la app — §6.3. Barra lateral de 240px, no navegación superior:
 * es una herramienta de trabajo y el usuario necesita el ancho vertical.
 * Colapsa a 64px en escritorio y se convierte en cajón en móvil, con
 * --ease-drawer (§13).
 */

const ENLACES = [
  { href: "/app", icono: LayoutGrid, texto: "Biblioteca", exacto: true },
  { href: "/app/nueva", icono: PlusCircle, texto: "Nueva campaña", exacto: false },
  { href: "/app/cuenta", icono: UserRound, texto: "Cuenta", exacto: false },
] as const;

export function BarraLateral({ usuario }: { usuario: Usuario }) {
  const ruta = usePathname();
  const router = useRouter();
  const [colapsada, setColapsada] = React.useState(false);
  const [cajon, setCajon] = React.useState(false);

  /* El cajón se cierra al navegar. Se hace en el propio manejador del enlace
     y no en un efecto sobre la ruta: el clic ES el evento, y así no hay un
     render extra por cada cambio de pantalla. */

  async function salir() {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/");
    router.refresh();
  }

  const def = definicionPlan(usuario.plan);

  const contenido = (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2 px-1 py-2">
        <Link
          href="/"
          aria-label="LandingForge, ir al inicio"
          className={cn(
            "font-[family-name:var(--font-fraunces)] text-[1rem] leading-none tracking-[-0.02em] text-hi no-underline",
            colapsada && "lg:sr-only",
          )}
        >
          <span style={{ fontWeight: 300 }}>Landing</span>
          <span style={{ fontWeight: 500 }}>Forge</span>
        </Link>
        <button
          type="button"
          onClick={() => setColapsada((v) => !v)}
          aria-label={colapsada ? "Expandir la barra" : "Colapsar la barra"}
          className={cn(
            "hidden lg:grid size-8 place-items-center rounded-[8px] text-lo",
            "transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-hi active:scale-[0.97]",
          )}
        >
          {colapsada ? (
            <PanelLeftOpen strokeWidth={1.5} className="size-4" />
          ) : (
            <PanelLeftClose strokeWidth={1.5} className="size-4" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setCajon(false)}
          aria-label="Cerrar el menú"
          className="lg:hidden grid size-8 place-items-center rounded-[8px] text-lo hf:text-hi"
        >
          <X strokeWidth={1.5} className="size-4" />
        </button>
      </div>

      <nav aria-label="Secciones de la aplicación">
        <ul className="flex flex-col gap-1">
          {ENLACES.map((e) => {
            const activo = e.exacto ? ruta === e.href : ruta.startsWith(e.href);
            const Icono = e.icono;
            return (
              <li key={e.href}>
                <Link
                  href={e.href}
                  onClick={() => setCajon(false)}
                  aria-current={activo ? "page" : undefined}
                  title={colapsada ? e.texto : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-[10px] px-3 h-10 no-underline",
                    "transition-colors duration-[140ms] ease-[var(--ease-out)]",
                    activo
                      ? "bg-[var(--surface-2)] text-hi"
                      : "text-mid hf:bg-[var(--surface-1)] hf:text-hi",
                  )}
                >
                  <Icono strokeWidth={1.5} className="size-4 shrink-0" />
                  <span className={cn("etiqueta", colapsada && "lg:sr-only")}>{e.texto}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div
          className={cn(
            "rounded-[12px] border border-[var(--line)] p-3",
            colapsada && "lg:hidden",
          )}
        >
          <p className="mono-sm text-lo">Plan {def.nombre}</p>
          <p className="mt-1 flex items-baseline gap-1.5">
            <span className="font-[family-name:var(--font-fraunces)] text-[1.5rem] font-[350] leading-none tabular-nums text-hi">
              {usuario.creditosDisponibles}
            </span>
            <span className="mono-sm text-lo">créditos</span>
          </p>
          <div
            aria-hidden
            className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--surface-2)]"
          >
            <span
              style={{
                width: `${Math.min(100, (usuario.creditosDisponibles / def.creditosMes) * 100)}%`,
              }}
              className="block h-full rounded-full bg-[var(--key)]"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={salir}
          title={colapsada ? "Cerrar sesión" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-[10px] px-3 h-10 text-mid",
            "transition-colors duration-[140ms] ease-[var(--ease-out)]",
            "hf:bg-[var(--surface-1)] hf:text-hi active:scale-[0.97]",
          )}
        >
          <LogOut strokeWidth={1.5} className="size-4 shrink-0" />
          <span className={cn("etiqueta", colapsada && "lg:sr-only")}>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Escritorio: fija, colapsable. */}
      <aside
        data-colapsada={colapsada || undefined}
        className={cn(
          "hidden lg:block shrink-0 border-r border-[var(--line)] bg-[var(--canvas)]",
          "transition-[width] duration-[var(--dur-menu)] ease-[var(--ease-out)]",
          colapsada ? "w-16" : "w-60",
        )}
      >
        <div className="sticky top-0 h-dvh">{contenido}</div>
      </aside>

      {/* Móvil: disparador + cajón que entra desde la izquierda. */}
      <button
        type="button"
        onClick={() => setCajon(true)}
        aria-label="Abrir el menú"
        className={cn(
          "lg:hidden fixed left-4 top-4 z-30 grid size-10 place-items-center rounded-[10px]",
          "bg-[var(--surface-2)] text-mid border border-[var(--line)]",
          "transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-hi active:scale-[0.97]",
        )}
      >
        <Menu strokeWidth={1.5} className="size-5" />
      </button>

      {cajon && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar el menú"
            onClick={() => setCajon(false)}
            className="absolute inset-0 bg-black/70 animate-[velo-entra_200ms_var(--ease-out)]"
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 w-64 bg-[var(--surface-1)] shadow-elev-2",
              "animate-[cajon-entra_320ms_var(--ease-drawer)]",
            )}
          >
            {contenido}
          </div>
        </div>
      )}
    </>
  );
}
