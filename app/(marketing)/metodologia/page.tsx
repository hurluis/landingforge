import type { Metadata } from "next";
import Link from "next/link";
import { TIPOLOGIAS } from "@/lib/metodologia/tipologias";
import { LISTA_NEGRA, COMPONENTES, LIMITE_CARACTERES_TEXTO, MAX_PALABRAS, MIN_PALABRAS } from "@/lib/metodologia/reglas-prompt";
import { BLOQUES_MERCADO } from "@/lib/metodologia/mercados";
import { PALETAS } from "@/lib/metodologia/paletas";
import { Boton } from "@/components/ui/boton";
import { Hairline } from "@/components/ui/piezas";
import { traductor } from "@/lib/i18n/servidor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await traductor();
  return {
    title: t("Metodología"),
    description: t(
      "Las nueve tipologías de sección, la fórmula de siete componentes, la lista negra y la matriz de paletas.",
    ),
  };
}

/**
 * Página de profundidad — §6.1. Aquí vive el detalle que la home solo insinúa.
 * Todo el contenido sale de lib/metodologia: si la metodología cambia, esta
 * página cambia sola. No hay una segunda copia del conocimiento.
 */
export default async function Metodologia() {
  const t = await traductor();
  return (
    <>
      <section className="pt-16 pb-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h1 className="display-xl max-w-[18ch]">{t("La metodología, abierta.")}</h1>
          <p className="mt-8 cuerpo-lg text-smoke medida">
            {t(
              "Esto es lo que ejecuta el motor cuando construye tus prompts. Está publicado porque el activo no es el secreto: es tenerlo documentado, versionado y probado en campañas reales.",
            )}
          </p>
        </div>
      </section>

      {/* Las nueve tipologías, con su estructura y sus errores conocidos. */}
      <section aria-labelledby="tipologias-titulo" className="py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h2 id="tipologias-titulo" className="display-lg">
            {t("Nueve tipologías.")}
          </h2>
          <ul className="mt-12">
            {TIPOLOGIAS.map((tipo) => (
              <li key={tipo.id} className="border-t border-[var(--scale)] py-8">
                <div className="grid gap-6 md:grid-cols-[auto_1fr_1fr] md:gap-10">
                  <span className="mono-sm text-slag">{String(tipo.numero).padStart(2, "0")}</span>
                  <div>
                    <h3 className="display-md">{t(tipo.nombre)}</h3>
                    <p className="mt-2 cuerpo text-smoke">{t(tipo.proposito)}</p>
                    <p className="mt-4 etiqueta text-slag">{t("Regla crítica")}</p>
                    <p className="mt-1 cuerpo text-ash">{t(tipo.reglaCritica)}</p>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-1">
                    <div>
                      <p className="etiqueta text-slag">{t("Estructura")}</p>
                      <ul className="mt-2 flex flex-col gap-1">
                        {tipo.estructura.map((linea) => (
                          <li key={t(linea)} className="cuerpo text-smoke">
                            {t(linea)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="etiqueta text-slag">{t("Errores conocidos")}</p>
                      <ul className="mt-2 flex flex-col gap-1">
                        {tipo.erroresConocidos.map((linea) => (
                          <li key={t(linea)} className="cuerpo text-slag">
                            {t(linea)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* La fórmula y sus reglas duras. */}
      <section
        aria-labelledby="formula-titulo"
        className="bg-[var(--sunk)] border-y border-[var(--scale)] py-24"
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h2 id="formula-titulo" className="display-lg medida">
            {t("Siete componentes, en este orden.")}
          </h2>
          <p className="mt-6 cuerpo-lg text-smoke medida">
            {t(
              "El modelo pondera más lo que aparece primero. Por eso el formato y la paleta abren el prompt, y la configuración técnica lo cierra.",
            )}
          </p>

          <ol className="mt-12 grid gap-x-12 gap-y-4 sm:grid-cols-2">
            {COMPONENTES.map((c, i) => (
              <li key={c.id} className="flex items-baseline gap-4 border-t border-[var(--scale)] pt-4">
                <span className="mono-sm text-slag">{i + 1}</span>
                <span className="flex-1 cuerpo text-ash">{t(c.nombre)}</span>
                <span className="mono-sm text-slag">{t("peso {n}", { n: c.peso.toFixed(1) })}</span>
              </li>
            ))}
          </ol>

          <div className="mt-16 grid gap-12 md:grid-cols-2">
            <div>
              <h3 className="titulo">{t("Las siete reglas del validador")}</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {[
                  t("Ningún elemento de texto supera {n} caracteres", { n: LIMITE_CARACTERES_TEXTO }),
                  t("Ninguna palabra de la lista negra"),
                  t("Prosa narrativa, no lista de keywords"),
                  t("Bloque de paleta con hex al inicio"),
                  t("Bloque de iluminación presente"),
                  t("Longitud entre {min} y {max} palabras", { min: MIN_PALABRAS, max: MAX_PALABRAS }),
                  t("Cierre con la línea de configuración"),
                ].map((r) => (
                  <li key={r} className="cuerpo text-smoke border-t border-[var(--scale)] pt-3">
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="titulo">{t("La lista negra, con su reemplazo")}</h3>
              <p className="mt-2 cuerpo text-slag">
                {t(
                  "Cada palabra empuja al modelo hacia arte de concurso y banco de imágenes, no hacia fotografía de producto.",
                )}
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {Object.entries(LISTA_NEGRA).map(([palabra, reemplazo]) => (
                  <li key={palabra} className="border-t border-[var(--scale)] pt-3">
                    <span className="mono-sm text-ash decoration-[var(--warn)] decoration-2 underline underline-offset-4">{palabra}</span>
                    <span className="mt-1 block cuerpo text-slag">{t(reemplazo)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* La matriz de paletas. */}
      <section aria-labelledby="paletas-titulo" className="py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h2 id="paletas-titulo" className="display-lg medida">
            {t("La paleta la elige la matriz, no el azar.")}
          </h2>
          <p className="mt-6 cuerpo-lg text-smoke medida">
            {t(
              "Tipo de producto por audiencia por registro emocional. Doce paletas construidas a mano, cada una con su argumento. Dos clientes distintos no reciben la misma.",
            )}
          </p>

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PALETAS.map((p) => (
              <li
                key={p.id}
                className="rounded-[16px] border border-[var(--scale)] bg-[var(--anvil)] p-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="titulo">{t(p.nombre)}</h3>
                  <span className="mono-sm text-slag">{t(p.registro)}</span>
                </div>
                <div className="mt-4 flex gap-1.5">
                  {[p.fondo, p.acento, p.texto, p.secundario, p.energia].map((hex) => (
                    <span
                      key={hex}
                      title={hex}
                      style={{ background: hex }}
                      className="h-10 flex-1 rounded-[4px] border border-[var(--scale)]"
                    />
                  ))}
                </div>
                <p className="mt-4 cuerpo text-smoke">{t(p.argumento)}.</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* El mercado. */}
      <section aria-labelledby="mercado-titulo" className="py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h2 id="mercado-titulo" className="display-lg medida">
            {t("Las cuatro señales que se inyectan solas.")}
          </h2>
          <ul className="mt-12">
            {BLOQUES_MERCADO.map((b) => (
              <li key={b.id} className="border-t border-[var(--scale)] py-6">
                <h3 className="titulo">{t(b.titulo)}</h3>
                <p className="mt-2 cuerpo text-smoke medida">{t(b.texto)}</p>
              </li>
            ))}
          </ul>
          <Hairline className="mt-6" />
          <div className="mt-10">
            <Boton asChild variante="heat" tamano="lg">
              <Link href="/app/nueva">{t("Probar la metodología con mi producto")}</Link>
            </Boton>
          </div>
        </div>
      </section>
    </>
  );
}
