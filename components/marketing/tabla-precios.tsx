import Link from "next/link";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { PLANES, PAQUETE_EXTRA, campanasPorMes } from "@/lib/planes";
import { formatoUSD } from "@/lib/formato";
import { Boton } from "@/components/ui/boton";
import { RevealLineas, RevealBloque } from "@/components/motion/reveal";
import { Spotlight } from "@/components/motion/interacciones";
import { cn } from "@/lib/utils";

/**
 * Precios — §6.2.8. Tres columnas. La del medio es el ancla visual, pero se
 * destaca con superficie más clara y hairline en --heat, NO con un badge de
 * «Más popular».
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
          lineas={["Pagas por", "generación,", "no por landing."]}
        />
        <RevealBloque retraso={0.18}>
          <p className="mt-8 medida cuerpo-lg text-smoke">
            Un crédito es una generación: una sección construida con la metodología y
            renderizada en 9:16. Si repites una sección hasta que quede como la quieres,
            gastas lo que repitas —y nada más—. Una campaña de nueve secciones sale, con sus
            repeticiones, por unas trece.
          </p>
        </RevealBloque>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {PLANES.map((p, i) => {
            const filas = [
              fila("Generaciones al mes", String(p.creditosMes)),
              fila("Campañas completas", `≈ ${campanasPorMes(p.id)} al mes`),
              fila(
                "Campañas guardadas",
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
                  p.destacado
                    ? "vidrio border-[var(--heat)]"
                    : "vidrio",
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
                      <span className="cuerpo text-smoke">{f.etiqueta}</span>
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

                <div className="mt-8 pt-2">
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
              Generaciones adicionales: paquete de {PAQUETE_EXTRA.creditos} por{" "}
              <span className="mono-sm text-ash">{formatoUSD(PAQUETE_EXTRA.precioUSD)}</span>. Las
              del plan no se acumulan entre meses; las que compras aparte, sí.
            </p>
            <p className="medida cuerpo text-slag">
              Prueba con 5 generaciones gratis al registrarte, sin tarjeta. Suficientes para
              ver la calidad antes de pagar.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
