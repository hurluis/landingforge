"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, List, ShieldCheck, SignOut, X } from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/marketing/wordmark";
import type { Usuario } from "@/lib/datos/tipos";
import { consumoPorUso, esPorUso, facturadoPorUso, plan as definicionPlan } from "@/lib/planes";
import { formatoUSD } from "@/lib/formato";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/cliente";
import type { Traductor } from "@/lib/i18n/idioma";

/**
 * La barra del panel — la del usuario y la de administración.
 *
 * Es la barra de la home: el mismo wordmark a la izquierda, los mismos
 * rótulos en versales, la misma altura y el mismo filete. Antes el panel
 * tenía una barra lateral de herramienta y al entrar parecía otra
 * aplicación; ahora se cruza la puerta y se sigue en la misma casa.
 *
 * Arriba y no al lado, además, porque el panel no lo necesita al lado: son
 * tres destinos en la app y cinco en administración, y una barra lateral se
 * comía 240 px de ancho que las tablas y la biblioteca sí aprovechan. Y en
 * la esquina de abajo a la izquierda ya vive el botón de accesibilidad, que
 * tapaba el «Cerrar sesión» de la barra lateral.
 *
 * El modo administración se reconoce por un filete de temple arriba y por el
 * rótulo junto al wordmark, en el mismo azul: --quench significa información
 * en este sistema, y el panel es un instrumento de lectura.
 */

type Enlace = { href: string; texto: string; exacto?: boolean };

const enlaces = (t: Traductor): Record<"app" | "admin", Enlace[]> => ({
  app: [
    { href: "/app", texto: t("Biblioteca"), exacto: true },
    { href: "/app/nueva", texto: t("Nueva campaña") },
    { href: "/app/cuenta", texto: t("Cuenta") },
  ],
  admin: [
    { href: "/admin", texto: t("Tablero"), exacto: true },
    { href: "/admin/usuarios", texto: t("Usuarios") },
    { href: "/admin/campanas", texto: t("Campañas") },
    { href: "/admin/calidad", texto: t("Calidad") },
    { href: "/admin/auditoria", texto: t("Auditoría") },
  ],
});

export function Barra({ usuario, modo }: { usuario: Usuario; modo: "app" | "admin" }) {
  const t = useT();
  const ruta = usePathname();
  const router = useRouter();
  const [menu, setMenu] = React.useState(false);
  const links = enlaces(t)[modo];
  const def = definicionPlan(usuario.plan);
  /* El plan por uso no tiene tope, así que la barra no diría nada: lo que se
     enseña es lo consumido en el ciclo y lo que va facturado. */
  const porUso = esPorUso(usuario.plan);
  const consumo = consumoPorUso(usuario.plan, usuario.creditosDisponibles);
  const lleno = Math.min(100, (usuario.creditosDisponibles / def.creditosMes) * 100);

  React.useEffect(() => {
    if (!menu) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previo;
    };
  }, [menu]);

  async function salir() {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/");
    router.refresh();
  }

  const activo = (e: Enlace) => (e.exacto ? ruta === e.href : ruta.startsWith(e.href));

  return (
    <header className="sticky top-0 z-40 border-b border-[color-mix(in_oklab,var(--ash)_12%,transparent)] bg-[var(--void)]">
      {modo === "admin" && (
        <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-[var(--quench)]" />
      )}
      <nav
        aria-label={modo === "admin" ? t("Secciones de administración") : t("Secciones de la aplicación")}
        className="mx-auto flex h-16 max-w-[1400px] items-center gap-8 px-5 sm:px-8"
      >
        <div className="flex shrink-0 items-baseline gap-3">
          <Wordmark />
          {modo === "admin" && (
            <span className="hidden etiqueta text-[var(--quench)] sm:inline">{t("Administración")}</span>
          )}
        </div>

        <ul className="hidden items-center gap-7 md:flex">
          {links.map((e) => (
            <li key={e.href}>
              <Link
                href={e.href}
                aria-current={activo(e) ? "page" : undefined}
                className={cn(
                  "relative etiqueta no-underline transition-colors duration-[var(--dur-hover)]",
                  activo(e) ? "text-ash" : "text-smoke hf:text-ash",
                )}
              >
                {e.texto}
                {activo(e) && (
                  <span
                    aria-hidden
                    className="absolute inset-x-0 -bottom-[23px] h-0.5 rounded-full bg-[var(--heat)]"
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-2 sm:gap-4">
          {modo === "app" ? (
            <Link
              href="/app/cuenta"
              className="hidden flex-col items-end gap-1 no-underline sm:flex"
              title={`Plan ${def.nombre}`}
            >
              <span className="mono-sm text-ash tabular-nums">
                {porUso ? consumo : usuario.creditosDisponibles}
                <span className="text-slag">
                  {porUso
                    ? ` secciones · ${formatoUSD(facturadoPorUso(usuario.plan, usuario.creditosDisponibles))}`
                    : t(" / {n} créditos", { n: def.creditosMes })}
                </span>
              </span>
              {!porUso && (
                <span aria-hidden className="h-0.5 w-full overflow-hidden rounded-full bg-[var(--scale)]">
                  <span style={{ width: `${lleno}%` }} className="block h-full bg-[var(--heat)]" />
                </span>
              )}
            </Link>
          ) : (
            <span className="hidden max-w-[220px] truncate mono-sm text-slag lg:inline" title={usuario.email}>
              {usuario.email}
            </span>
          )}

          {modo === "app" && usuario.rol === "admin" && (
            <Link
              href="/admin"
              className="hidden items-center gap-1.5 etiqueta text-[var(--quench)] no-underline hf:underline md:inline-flex"
            >
              <ShieldCheck className="size-4" />
              {t("Administración")}
            </Link>
          )}
          {modo === "admin" && (
            <Link
              href="/app"
              className="hidden items-center gap-1.5 etiqueta text-smoke no-underline hf:text-ash md:inline-flex"
            >
              <ArrowLeft className="size-4" />
              {t("Volver a la app")}
            </Link>
          )}

          <button
            type="button"
            onClick={salir}
            className="hidden items-center gap-1.5 rounded-full border border-[var(--scale-hi)] px-3.5 py-1.5 etiqueta text-smoke transition-colors duration-[var(--dur-hover)] hf:border-ash hf:text-ash md:inline-flex"
          >
            <SignOut className="size-4" />
            {t("Salir")}
          </button>

          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-controls="menu-panel"
            aria-label={menu ? t("Cerrar menú") : t("Abrir menú")}
            className="grid size-10 place-items-center rounded-[10px] text-smoke transition-colors duration-[var(--dur-hover)] hf:text-ash active:scale-[0.97] md:hidden"
          >
            {menu ? <X className="size-5" /> : <List className="size-5" />}
          </button>
        </div>
      </nav>

      {menu && (
        <div
          id="menu-panel"
          className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-[var(--void)] px-5 pb-10 pt-4 animate-[hoja-entra_var(--dur-overlay)_var(--ease-drawer)] md:hidden"
        >
          <ul className="flex flex-col">
            {links.map((e) => (
              <li key={e.href} className="border-b border-[var(--scale)]">
                <Link
                  href={e.href}
                  onClick={() => setMenu(false)}
                  aria-current={activo(e) ? "page" : undefined}
                  className={cn(
                    "block py-5 display-md no-underline",
                    activo(e) ? "text-ash" : "text-smoke",
                  )}
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-5">
            {modo === "app" && (
              <p className="mono-sm text-smoke">
                Plan {def.nombre} ·{" "}
                {porUso
                  ? `${consumo} secciones este ciclo · ${formatoUSD(facturadoPorUso(usuario.plan, usuario.creditosDisponibles))}`
                  : t("{saldo} de {total} créditos", {
                      saldo: usuario.creditosDisponibles,
                      total: def.creditosMes,
                    })}
              </p>
            )}
            {modo === "app" && usuario.rol === "admin" && (
              <Link href="/admin" onClick={() => setMenu(false)} className="etiqueta text-[var(--quench)] no-underline">
                {t("Administración")}
              </Link>
            )}
            {modo === "admin" && (
              <Link href="/app" onClick={() => setMenu(false)} className="etiqueta text-smoke no-underline">
                {t("Volver a la app")}
              </Link>
            )}
            <button type="button" onClick={salir} className="self-start etiqueta text-smoke">
              {t("Cerrar sesión")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
