import { traductor } from "@/lib/i18n/servidor";
/**
 * Salto al contenido — WCAG 2.4.1 «Bypass Blocks», nivel A.
 *
 * Existía suelto en el layout público, que es donde menos falta hace: la
 * portada se recorre una vez y de arriba abajo. Donde de verdad importa es en
 * la aplicación y en el panel, que tienen una barra lateral persistente que
 * el teclado debe atravesar entera en CADA pantalla antes de llegar al
 * trabajo. El criterio existe literalmente para eso.
 *
 * Invisible hasta que recibe foco: `sr-only` lo saca del flujo visual sin
 * sacarlo del árbol de accesibilidad, y `focus:not-sr-only` lo devuelve. No
 * se usa `display:none`, que lo haría inalcanzable con el tabulador.
 *
 * El destino es siempre `#contenido`, y quien lo monta es responsable de que
 * exista ese id en su `<main>`.
 */
export async function SaltarAlContenido({ destino = "#contenido" }: { destino?: string }) {
  const t = await traductor();
  return (
    <a
      href={destino}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[10px] focus:bg-[var(--anvil-hi)] focus:px-4 focus:py-2 focus:text-ash"
    >
      {t("Saltar al contenido")}
    </a>
  );
}
