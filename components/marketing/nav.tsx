"use client";

import * as React from "react";
import Link from "next/link";
import { List, X } from "@phosphor-icons/react/dist/ssr";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/marketing/wordmark";
import { useT } from "@/lib/i18n/cliente";
import type { Traductor } from "@/lib/i18n/idioma";

/**
 * M3 · Nav.
 *
 * Al pasar de 24px de scroll la altura baja de 80px a 64px, aparece la
 * hairline inferior y el fondo gana blur. Aquí el blur es real: hay contenido
 * pasando por detrás.
 *
 * El estado se lee con `useScroll` y solo cambia al cruzar el umbral, así que
 * hay dos renders en toda la vida de la página, no uno por frame.
 *
 * Nota sobre `mix-blend-mode: difference`, que el brief menciona para este
 * componente: resuelve el problema de un nav que cruza secciones claras y
 * oscuras. Esta página tiene un solo tema oscuro de principio a fin, que es
 * lo que exige el pre-flight, así que ese problema no existe aquí y el blend
 * sería un mecanismo copiado sin su causa. Queda fuera a propósito.
 */

const enlaces = (t: Traductor) => [
  { href: "/metodologia", texto: t("Método") },
  { href: "/precios", texto: t("Precios") },
];

export function Nav() {
  const t = useT();
  const [compacta, setCompacta] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const debe = y > 24;
    setCompacta((prev) => (prev === debe ? prev : debe));
  });

  React.useEffect(() => {
    if (!menu) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previo; };
  }, [menu]);

  return (
    <header
      data-compacta={compacta || undefined}
      className={cn(
        "fixed inset-x-0 top-0 z-40 border-b",
        "transition-[height,background-color,backdrop-filter,border-color] duration-[260ms] ease-[var(--ease-out)]",
        "border-[color-mix(in_oklab,var(--ash)_14%,transparent)]",
        compacta
          ? "h-16 bg-[color-mix(in_oklab,var(--void)_45%,transparent)] backdrop-blur-[14px]"
          : "h-20 bg-transparent",
      )}
    >
      <nav
        aria-label={t("Principal")}
        className="mx-auto flex h-full max-w-[1400px] items-center justify-between gap-6 px-6 lg:px-10"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-10"
        >
          <Wordmark />
          <ul className="hidden md:flex items-center gap-7">
            {enlaces(t).map((e) => (
              <li key={e.href}>
                <Link
                  href={e.href}
                  className="etiqueta text-smoke no-underline transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out)] hf:text-ash"
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-center gap-2 sm:gap-4"
        >
          <Link
            href="/entrar"
            className="hidden sm:inline-flex etiqueta text-smoke no-underline px-1 transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out)] hf:text-ash"
          >
            {t("Entrar")}
          </Link>
          {/* CTA en cristal, como en la referencia: sobre la toma a plena luz
              un contorno de un píxel desaparece; el cristal no. */}
          <Link
            href="/app/nueva"
            className="cristal rounded-md px-4 py-2 text-xs text-ash no-underline transition-[filter] duration-300 hf:brightness-125 sm:px-5 sm:text-sm"
          >
            <span className="hidden sm:inline">{t("Crear mi primera landing")}</span>
            <span className="sm:hidden">{t("Crear landing")}</span>
          </Link>

          <button
            type="button"
            onClick={() => setMenu((v) => !v)}
            aria-expanded={menu}
            aria-controls="menu-movil"
            aria-label={menu ? t("Cerrar menú") : t("Abrir menú")}
            className="md:hidden grid size-10 place-items-center rounded-[10px] text-smoke transition-colors duration-[var(--dur-hover)] hf:text-ash active:scale-[0.97]"
          >
            {menu ? <X className="size-5" /> : <List className="size-5" />}
          </button>
        </motion.div>
      </nav>

      {menu && (
        <div
          id="menu-movil"
          className="md:hidden fixed inset-x-0 bottom-0 top-16 z-40 bg-void px-6 pt-4 animate-[hoja-entra_var(--dur-overlay)_var(--ease-drawer)]"
        >
          <ul className="flex flex-col">
            {[...enlaces(t), { href: "/entrar", texto: t("Entrar") }].map((e) => (
              <li key={e.href} className="border-b border-scale">
                <Link
                  href={e.href}
                  onClick={() => setMenu(false)}
                  className="block py-5 display-md text-smoke no-underline hf:text-ash"
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
