"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ClipboardText,
  Gauge,
  List,
  SealCheck,
  Stack,
  Users,
  X,
} from "@phosphor-icons/react/dist/ssr";
import type { Usuario } from "@/lib/datos/tipos";
import { cn } from "@/lib/utils";

/**
 * Chrome del panel de administración.
 *
 * Repite la estructura de `components/app/barra-lateral.tsx` —240px, cajón en
 * móvil, mismos radios y mismas duraciones— porque es la misma aplicación y
 * cambiar el chrome entre secciones haría que el panel se sintiera pegado.
 *
 * Lo único que cambia es la señal de modo: una hairline superior en `--quench`
 * y el rótulo «administración» en el mismo azul. `--quench` ya significa
 * información en este sistema, y el panel es un instrumento de lectura, no de
 * producción. No se introduce ningún color nuevo, y `--heat` sigue siendo el
 * único color de acción de todo el producto.
 */

const ENLACES = [
  { href: "/admin", icono: Gauge, texto: "Tablero", exacto: true },
  { href: "/admin/usuarios", icono: Users, texto: "Usuarios", exacto: false },
  { href: "/admin/campanas", icono: Stack, texto: "Campañas", exacto: false },
  { href: "/admin/calidad", icono: SealCheck, texto: "Calidad", exacto: false },
  { href: "/admin/auditoria", icono: ClipboardText, texto: "Auditoría", exacto: false },
] as const;

export function BarraAdmin({ admin }: { admin: Usuario }) {
  const ruta = usePathname();
  const [cajon, setCajon] = React.useState(false);

  const contenido = (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2 px-1 py-2">
        <div className="min-w-0">
          <Link
            href="/admin"
            aria-label="Panel de administración de LandingForge"
            className="font-[family-name:var(--font-display-serif)] text-[1rem] leading-none tracking-[-0.02em] text-ash no-underline"
          >
            <span style={{ fontWeight: 300 }}>Landing</span>
            <span style={{ fontWeight: 500 }}>Forge</span>
          </Link>
          <p className="mt-1 mono-sm text-[var(--quench)]">administración</p>
        </div>
        <button
          type="button"
          onClick={() => setCajon(false)}
          aria-label="Cerrar el menú"
          className="lg:hidden grid size-8 place-items-center rounded-[8px] text-slag hf:text-ash"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav aria-label="Secciones de administración">
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
                  className={cn(
                    "flex items-center gap-3 rounded-[10px] px-3 h-10 no-underline",
                    "transition-colors duration-[140ms] ease-[var(--ease-out)]",
                    activo
                      ? "bg-[var(--anvil-hi)] text-ash"
                      : "text-smoke hf:bg-[var(--anvil)] hf:text-ash",
                  )}
                >
                  <Icono className="size-4 shrink-0" />
                  <span className="etiqueta">{e.texto}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <div className="rounded-[12px] border border-[var(--scale)] p-3">
          <p className="mono-sm text-slag">Sesión</p>
          <p className="mt-1 truncate cuerpo text-ash" title={admin.email}>
            {admin.email}
          </p>
        </div>

        <Link
          href="/app"
          onClick={() => setCajon(false)}
          className={cn(
            "flex items-center gap-3 rounded-[10px] px-3 h-10 text-smoke no-underline",
            "transition-colors duration-[140ms] ease-[var(--ease-out)]",
            "hf:bg-[var(--anvil)] hf:text-ash active:scale-[0.97]",
          )}
        >
          <ArrowLeft className="size-4 shrink-0" />
          <span className="etiqueta">Volver a la app</span>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block w-60 shrink-0 border-r border-[var(--scale)] bg-[var(--void)]">
        <div className="sticky top-0 h-dvh">{contenido}</div>
      </aside>

      <button
        type="button"
        onClick={() => setCajon(true)}
        aria-label="Abrir el menú"
        className={cn(
          "lg:hidden fixed left-4 top-4 z-30 grid size-10 place-items-center rounded-[10px]",
          "bg-[var(--anvil-hi)] text-smoke border border-[var(--scale)]",
          "transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-ash active:scale-[0.97]",
        )}
      >
        <List className="size-5" />
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
              "absolute inset-y-0 left-0 w-64 bg-[var(--anvil)] shadow-elev-2",
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
