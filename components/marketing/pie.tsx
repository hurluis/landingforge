import Link from "next/link";
import { Wordmark } from "@/components/marketing/wordmark";

/**
 * Pie — §6.2.10. Hairline superior, tres columnas discretas, wordmark y año.
 * Tipografía pequeña en --text-lo. No compite con nada.
 */

const COLUMNAS = [
  {
    titulo: "Producto",
    enlaces: [
      { href: "/metodologia", texto: "Metodología" },
      { href: "/precios", texto: "Precios" },
      { href: "/app/nueva", texto: "Crear una landing" },
    ],
  },
  {
    titulo: "Legal",
    enlaces: [
      { href: "/legal/terminos", texto: "Términos" },
      { href: "/legal/privacidad", texto: "Privacidad" },
      { href: "/legal/creditos", texto: "Política de créditos" },
    ],
  },
  {
    titulo: "Contacto",
    enlaces: [
      { href: "mailto:hola@landingforge.co", texto: "hola@landingforge.co" },
      { href: "/entrar", texto: "Entrar a tu cuenta" },
    ],
  },
] as const;

export function Pie() {
  return (
    <footer className="border-t border-[var(--line)] mt-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          {COLUMNAS.map((c) => (
            <div key={c.titulo}>
              <h2 className="etiqueta text-mid mb-3">{c.titulo}</h2>
              <ul className="flex flex-col gap-2">
                {c.enlaces.map((e) => (
                  <li key={e.href}>
                    <Link
                      href={e.href}
                      className="text-[0.8125rem] text-lo no-underline transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-mid"
                    >
                      {e.texto}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-6">
          <Wordmark como="texto" tamano="0.9375rem" className="opacity-70" />
          <p className="mono-sm text-lo">
            {new Date().getFullYear()} · Hecho en Medellín, Colombia
          </p>
        </div>
      </div>
    </footer>
  );
}
