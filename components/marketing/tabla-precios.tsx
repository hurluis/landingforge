import Link from "next/link";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { PLANES, PAQUETE_EXTRA } from "@/lib/planes";
import { formatoUSD } from "@/lib/formato";
import { Boton } from "@/components/ui/boton";
import { RevealLineas, RevealBloque } from "@/components/motion/reveal";
import { Spotlight } from "@/components/motion/interacciones";
import { cn } from "@/lib/utils";

/**
 * Precios — §6.2.8. Cuatro columnas: tres con secciones incluidas y una de
 * pago por uso. La de Estudio es el ancla visual, y se destaca con superficie
 * más clara y hairline en --heat, NO con un badge de «Más popular».
 *
 * Lo que se enseña es lo que el comprador recibe: secciones listas para
 * publicar. Lo que cuesta producirlas es cuenta nuestra y vive en los
 * comentarios de `lib/planes.ts`.
 *
 * Aquí no se usa clip-path: son elementos comparables y el ojo debe poder
 * recorrerlos, así que entran con stagger de 60ms (§5.3).
 */

function fila(etiqueta: string, valor: string) {
  return { etiqueta, valor };
}

export function TablaPrecios({ compacta = false }: { compacta?: boolean }) {
  return (
    <section aria-labelledby="precios-titulo" className="relative py-32 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <RevealLineas
          as="h2"
          id="precios-titulo"
          className="display-lg max-w-[16ch]"
          lineas={["Elige cuántas", "secciones necesitas."]}
        />
        <RevealBloque retraso={0.18}>
          <p className="mt-8 medida cuerpo-lg text-smoke">
            Cada crédito es una sección lista para publicar, con su prompt y su imagen 9:16.
            Empieza por el plan que te quede corto y súbelo cuando el trabajo lo pida. Y si tu
            volumen no cabe en ninguno, Fundición no tiene techo.
          </p>
        </RevealBloque>

        <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {PLANES.map((p, i) => {
            const porUso = p.medida === "por-uso";
            /* Etiquetas cortas a propósito: en cuatro columnas, las largas se
               partían en dos líneas y la tabla se leía sucia. */
            const filas = [
              fila("Secciones al mes", String(p.creditosMes)),
              ...(porUso
                ? [fila("Secciones extra", `${formatoUSD(p.precioSeccionUSD ?? 0)} c/u`)]
                : []),
              fila(
                "Guardadas",
                p.campanasGuardadas === "ilimitadas" ? "Ilimitadas" : String(p.campanasGuardadas),
              ),
              fila("Paletas alternativas", String(p.paletasAlternativas)),
              fila(
                "Marcas o clientes",
                p.marcas === "ilimitadas" ? "Ilimitados" : String(p.marcas),
              ),
              fila("Soporte", p.soporte),
            ];
            return (
              <RevealBloque key={p.id} retraso={i * 0.06}>
              <Spotlight className="h-full rounded-[14px]">
              <div
                className={cn(
                  "flex h-full flex-col rounded-[14px] p-8",
                  // Elevación declarada una sola vez: borde, sin sombra.
                  p.destacado ? "vidrio border-[var(--heat)]" : "vidrio",
                )}
              >
                <h3 className="display-md">{p.nombre}</h3>
                <p className="mt-4 flex items-baseline gap-2">
                  <span className="font-[family-name:var(--font-round)] text-[2rem] font-[350] tracking-[-0.02em] tabular-nums">
                    {formatoUSD(p.precioMensualUSD)}
                  </span>
                  <span className="mono-sm text-smoke">/ mes</span>
                </p>

                <ul className="mt-6 flex flex-col gap-3 border-t border-[var(--scale)] pt-6">
                  {filas.map((f) => (
                    <li key={f.etiqueta} className="flex items-baseline justify-between gap-4">
                      <span className="cuerpo text-smoke whitespace-nowrap">{f.etiqueta}</span>
                      <span className="mono-sm text-ash text-right">{f.valor}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-smoke">
                    <Check className="size-4 text-[var(--ok)]" />
                    <span className="cuerpo">Exportación .md y .json</span>
                  </li>
                  <li className="flex items-center gap-2 text-smoke">
                    <Check className="size-4 text-[var(--ok)]" />
                    <span className="cuerpo">Edición de prompts</span>
                  </li>
                </ul>

                <div className="mt-auto pt-10">
                  <Boton
                    asChild
                    variante={p.destacado ? "heat" : "contorno"}
                    tamano="md"
                    className="w-full"
                  >
                    <Link href="/entrar?modo=registro">Empezar con {p.nombre}</Link>
                  </Boton>
                </div>
              </div>
              </Spotlight>
              </RevealBloque>
            );
          })}
        </div>

        {!compacta && (
          <div className="mt-8 grid gap-4 border-t border-[var(--scale)] pt-8 sm:grid-cols-2">
            <p className="medida cuerpo text-smoke">
              ¿Un mes con más trabajo del previsto? Paquete de {PAQUETE_EXTRA.creditos} secciones
              por <span className="mono-sm text-ash">{formatoUSD(PAQUETE_EXTRA.precioUSD)}</span>.
              Las del plan no se acumulan entre meses; las que compras aparte, sí.
            </p>
            <p className="medida cuerpo text-slag">
              Prueba con 5 secciones gratis al registrarte, sin tarjeta. Suficientes para ver la
              calidad antes de pagar.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
