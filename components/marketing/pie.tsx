import Link from "next/link";
import { Wordmark } from "@/components/marketing/wordmark";
import { traductor } from "@/lib/i18n/servidor";
import type { Traductor } from "@/lib/i18n/idioma";

/**
 * Pie — §6.2.10. Hairline superior, tres columnas discretas, wordmark y año.
 * Tipografía pequeña en --slag. No compite con nada.
 */

const columnas = (t: Traductor) => [
  {
    titulo: t("Producto"),
    enlaces: [
      { href: "/metodologia", texto: t("Metodología") },
      { href: "/precios", texto: t("Precios") },
      { href: "/app/nueva", texto: t("Crear una landing") },
    ],
  },
  {
    titulo: t("Legal"),
    enlaces: [
      { href: "/legal/terminos", texto: t("Términos") },
      { href: "/legal/privacidad", texto: t("Privacidad") },
      { href: "/legal/creditos", texto: t("Política de créditos") },
    ],
  },
  {
    titulo: t("Contacto"),
    enlaces: [
      { href: "mailto:hola@landingforge.co", texto: "hola@landingforge.co" },
      { href: "/entrar", texto: t("Entrar a tu cuenta") },
    ],
  },
];

export async function Pie() {
  const t = await traductor();
  return (
    <footer className="border-t border-[var(--scale)] mt-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {columnas(t).map((c) => (
            <div key={c.titulo}>
              <h2 className="etiqueta text-smoke mb-3">{c.titulo}</h2>
              <ul className="flex flex-col gap-2">
                {c.enlaces.map((e) => (
                  <li key={e.href}>
                    <Link
                      href={e.href}
                      className="text-[0.8125rem] text-slag no-underline transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-smoke"
                    >
                      {e.texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--scale)] pt-6">
          <Wordmark como="texto" tamano="0.9375rem" className="opacity-70" />
          <p className="text-[0.8125rem] text-slag">
            Copyright © {new Date().getFullYear()} LandingForge® ·{" "}
            {t("Todos los derechos reservados.")}
          </p>
        </div>
      </div>
    </footer>
  );
}
