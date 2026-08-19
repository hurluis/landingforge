import type { Metadata } from "next";
import Link from "next/link";
import { TIPOLOGIAS } from "@/lib/metodologia/tipologias";
import { LISTA_NEGRA, COMPONENTES, LIMITE_CARACTERES_TEXTO, MAX_PALABRAS, MIN_PALABRAS } from "@/lib/metodologia/reglas-prompt";
import { BLOQUES_MERCADO } from "@/lib/metodologia/mercado-co";
import { PALETAS } from "@/lib/metodologia/paletas";
import { Boton } from "@/components/ui/boton";
import { Revelar } from "@/components/ui/revelar";
import { Hairline } from "@/components/ui/piezas";

export const metadata: Metadata = {
  title: "Metodología",
  description:
    "Las nueve tipologías de sección, la fórmula de siete componentes, la lista negra y la matriz de paletas.",
};

/**
 * Página de profundidad — §6.1. Aquí vive el detalle que la home solo insinúa.
 * Todo el contenido sale de lib/metodologia: si la metodología cambia, esta
 * página cambia sola. No hay una segunda copia del conocimiento.
 */
export default function Metodologia() {
  return (
    <>
      <section className="pt-16 pb-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h1 className="display-xl max-w-[18ch]">La metodología, abierta.</h1>
          <p className="mt-8 cuerpo-lg text-mid medida">
            Esto es lo que ejecuta el motor cuando construye tus prompts. Está publicado
            porque el activo no es el secreto: es tenerlo documentado, versionado y probado
            en campañas reales.
          </p>
        </div>
      </section>

      {/* Las nueve tipologías, con su estructura y sus errores conocidos. */}
      <Revelar as="section" desde="arriba" aria-labelledby="tipologias-titulo" className="py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h2 id="tipologias-titulo" className="display-lg">
            Nueve tipologías.
          </h2>
          <ul className="mt-12">
            {TIPOLOGIAS.map((t) => (
              <li key={t.id} className="border-t border-[var(--line)] py-8">
                <div className="grid gap-6 md:grid-cols-[auto_1fr_1fr] md:gap-10">
                  <span className="mono-sm text-lo">{String(t.numero).padStart(2, "0")}</span>
                  <div>
                    <h3 className="display-md">{t.nombre}</h3>
                    <p className="mt-2 cuerpo text-mid">{t.proposito}</p>
                    <p className="mt-4 etiqueta text-lo">Regla crítica</p>
                    <p className="mt-1 cuerpo text-hi">{t.reglaCritica}</p>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-1">
                    <div>
                      <p className="etiqueta text-lo">Estructura</p>
                      <ul className="mt-2 flex flex-col gap-1">
                        {t.estructura.map((linea) => (
                          <li key={linea} className="cuerpo text-mid">
                            {linea}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="etiqueta text-lo">Errores conocidos</p>
                      <ul className="mt-2 flex flex-col gap-1">
                        {t.erroresConocidos.map((linea) => (
                          <li key={linea} className="cuerpo text-lo">
                            {linea}
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
      </Revelar>

      {/* La fórmula y sus reglas duras. */}
      <section
        aria-labelledby="formula-titulo"
        className="bg-[var(--surface-sunk)] border-y border-[var(--line)] py-24"
      >
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h2 id="formula-titulo" className="display-lg medida">
            Siete componentes, en este orden.
          </h2>
          <p className="mt-6 cuerpo-lg text-mid medida">
            El modelo pondera más lo que aparece primero. Por eso el formato y la paleta
            abren el prompt, y la configuración técnica lo cierra.
          </p>

          <ol className="mt-12 grid gap-x-12 gap-y-4 sm:grid-cols-2">
            {COMPONENTES.map((c, i) => (
              <li key={c.id} className="flex items-baseline gap-4 border-t border-[var(--line)] pt-4">
                <span className="mono-sm text-lo">{i + 1}</span>
                <span className="flex-1 cuerpo text-hi">{c.nombre}</span>
                <span className="mono-sm text-lo">peso {c.peso.toFixed(1)}</span>
              </li>
            ))}
          </ol>

          <div className="mt-16 grid gap-12 md:grid-cols-2">
            <div>
              <h3 className="titulo">Las siete reglas del validador</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {[
                  `Ningún elemento de texto supera ${LIMITE_CARACTERES_TEXTO} caracteres`,
                  "Ninguna palabra de la lista negra",
                  "Prosa narrativa, no lista de keywords",
                  "Bloque de paleta con hex al inicio",
                  "Bloque de iluminación presente",
                  `Longitud entre ${MIN_PALABRAS} y ${MAX_PALABRAS} palabras`,
                  "Cierre con la línea de configuración",
                ].map((r) => (
                  <li key={r} className="cuerpo text-mid border-t border-[var(--line)] pt-3">
                    {r}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="titulo">La lista negra, con su reemplazo</h3>
              <p className="mt-2 cuerpo text-lo">
                Cada palabra empuja al modelo hacia arte de concurso y banco de imágenes, no
                hacia fotografía de producto.
              </p>
              <ul className="mt-4 flex flex-col gap-3">
                {Object.entries(LISTA_NEGRA).map(([palabra, reemplazo]) => (
                  <li key={palabra} className="border-t border-[var(--line)] pt-3">
                    <span className="mono-sm text-[var(--warn)]">{palabra}</span>
                    <span className="mt-1 block cuerpo text-lo">{reemplazo}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* La matriz de paletas. */}
      <Revelar as="section" desde="izquierda" aria-labelledby="paletas-titulo" className="py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h2 id="paletas-titulo" className="display-lg medida">
            La paleta la elige la matriz, no el azar.
          </h2>
          <p className="mt-6 cuerpo-lg text-mid medida">
            Tipo de producto por audiencia por registro emocional. Doce paletas construidas a
            mano, cada una con su argumento. Dos clientes distintos no reciben la misma.
          </p>

          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PALETAS.map((p) => (
              <li
                key={p.id}
                className="rounded-[16px] border border-[var(--line)] bg-[var(--surface-1)] p-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="titulo">{p.nombre}</h3>
                  <span className="mono-sm text-lo">{p.registro}</span>
                </div>
                <div className="mt-4 flex gap-1.5">
                  {[p.fondo, p.acento, p.texto, p.secundario, p.energia].map((hex) => (
                    <span
                      key={hex}
                      title={hex}
                      style={{ background: hex }}
                      className="h-10 flex-1 rounded-[4px] border border-[var(--line)]"
                    />
                  ))}
                </div>
                <p className="mt-4 cuerpo text-mid">{p.argumento}.</p>
              </li>
            ))}
          </ul>
        </div>
      </Revelar>

      {/* El mercado. */}
      <section aria-labelledby="mercado-titulo" className="py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h2 id="mercado-titulo" className="display-lg medida">
            Las cuatro señales que se inyectan solas.
          </h2>
          <ul className="mt-12">
            {BLOQUES_MERCADO.map((b) => (
              <li key={b.id} className="border-t border-[var(--line)] py-6">
                <h3 className="titulo">{b.titulo}</h3>
                <p className="mt-2 cuerpo text-mid medida">{b.texto}</p>
              </li>
            ))}
          </ul>
          <Hairline className="mt-6" />
          <div className="mt-10">
            <Boton asChild variante="primario" tamano="lg">
              <Link href="/app/nueva">Probar la metodología con mi producto</Link>
            </Boton>
          </div>
        </div>
      </section>
    </>
  );
}
