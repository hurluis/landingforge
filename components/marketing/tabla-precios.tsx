import Link from "next/link";
import { Check } from "lucide-react";
import { PLANES, PAQUETE_EXTRA } from "@/lib/planes";
import { formatoCOP } from "@/lib/formato";
import { Boton } from "@/components/ui/boton";
import { Escalonado } from "@/components/ui/revelar";
import { cn } from "@/lib/utils";

/**
 * Precios — §6.2.8. Tres columnas. La del medio es el ancla visual, pero se
 * destaca con superficie más clara y hairline en --key, NO con un badge de
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
    <section aria-labelledby="precios-titulo" className="py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <h2 id="precios-titulo" className="display-lg medida">
          Planes que se miden en créditos.
        </h2>
        <p className="mt-6 medida cuerpo-lg text-mid">
          Los planes se miden en créditos porque generar imágenes cuesta. Cada crédito es
          una imagen 9:16 en calidad máxima.
        </p>

        <Escalonado lento className="mt-12 grid gap-4 md:grid-cols-3">
          {PLANES.map((p) => {
            const filas = [
              fila("Créditos al mes", String(p.creditosMes)),
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
              <div
                key={p.id}
                className={cn(
                  "flex flex-col rounded-[16px] p-6",
                  // Elevación declarada una sola vez: borde, sin sombra.
                  p.destacado
                    ? "bg-[var(--surface-2)] border border-[var(--key)]"
                    : "bg-[var(--surface-1)] border border-[var(--line)]",
                )}
              >
                <h3 className="display-md">{p.nombre}</h3>
                <p className="mt-4 flex items-baseline gap-2">
                  <span className="font-[family-name:var(--font-fraunces)] text-[2rem] font-[350] tracking-[-0.02em] tabular-nums">
                    {formatoCOP(p.precioMensualCOP)}
                  </span>
                  <span className="mono-sm text-mid">/ mes</span>
                </p>

                <ul className="mt-6 flex flex-col gap-3 border-t border-[var(--line)] pt-6">
                  {filas.map((f) => (
                    <li key={f.etiqueta} className="flex items-baseline justify-between gap-4">
                      <span className="cuerpo text-mid">{f.etiqueta}</span>
                      <span className="mono-sm text-hi text-right">{f.valor}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-mid">
                    <Check strokeWidth={1.5} className="size-4 text-[var(--ok)]" />
                    <span className="cuerpo">Exportación .md y .json</span>
                  </li>
                  <li className="flex items-center gap-2 text-mid">
                    <Check strokeWidth={1.5} className="size-4 text-[var(--ok)]" />
                    <span className="cuerpo">Edición de prompts</span>
                  </li>
                </ul>

                <div className="mt-8 pt-2">
                  <Boton
                    asChild
                    variante={p.destacado ? "primario" : "secundario"}
                    tamano="md"
                    className="w-full"
                  >
                    <Link href="/entrar?modo=registro">Empezar con {p.nombre}</Link>
                  </Boton>
                </div>
              </div>
            );
          })}
        </Escalonado>

        {!compacta && (
          <div className="mt-8 grid gap-4 border-t border-[var(--line)] pt-8 sm:grid-cols-2">
            <p className="medida cuerpo text-mid">
              Créditos adicionales: paquete de {PAQUETE_EXTRA.creditos} por{" "}
              <span className="mono-sm text-hi">{formatoCOP(PAQUETE_EXTRA.precioCOP)}</span>. Los
              créditos del plan no se acumulan entre meses; los que compras aparte, sí.
            </p>
            <p className="medida cuerpo text-lo">
              Prueba con 5 créditos gratis al registrarte, sin tarjeta. Suficiente para una
              campaña corta y para que veas la calidad antes de pagar.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
