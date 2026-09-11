import type { Metadata } from "next";
import { TablaPrecios } from "@/components/marketing/tabla-precios";
import { Preguntas } from "@/components/marketing/preguntas";
import { GENERACIONES_POR_CAMPANA } from "@/lib/planes";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Tres planes en dólares, medidos en generaciones. Una generación es una sección con su prompt validado y su imagen 9:16. Prueba con 5 gratis, sin tarjeta.",
};

/** De dónde sale el precio. Las tarifas son de septiembre de 2026. */
const COSTOS = [
  {
    concepto: "Prompt con Claude Opus",
    detalle: "2.000 tokens de entrada y 450 de salida, a US$5 y US$25 por millón",
    valor: "US$0,021",
  },
  {
    concepto: "Imagen 9:16",
    detalle: "Gemini Flash Image, la que mejor relación calidad-precio da hoy",
    valor: "US$0,039",
  },
  {
    concepto: "Coste de una generación",
    detalle: "Lo que cuesta producir una sección, antes de servidores e impuestos",
    valor: "US$0,06",
  },
];

export default function Precios() {
  return (
    <>
      <section className="pt-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h1 className="display-xl max-w-[16ch]">Pagas por lo que generas.</h1>
          <p className="mt-8 cuerpo-lg text-smoke medida">
            No hay plan ilimitado porque cada imagen tiene un costo real. Un modelo plano
            haría que el usuario más pesado se comiera el margen de los otros veinte, y eso
            termina pagándolo todo el mundo con un producto peor.
          </p>
        </div>
      </section>

      <TablaPrecios />

      {/* De dónde sale el número. Publicarlo es la misma decisión que publicar
          la metodología: el precio se puede defender porque se puede revisar. */}
      <section aria-labelledby="costo-titulo" className="py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h2 id="costo-titulo" className="display-lg max-w-[18ch]">
            De dónde sale este precio.
          </h2>
          <p className="mt-6 cuerpo-lg text-smoke medida">
            Una generación pasa por dos modelos: Claude Opus redacta el prompt siguiendo la
            metodología —es el que planea y mira el encargo desde todos los ángulos— y un
            modelo de imagen lo renderiza en 9:16.
          </p>

          <ul className="mt-12 border-t border-[var(--scale)]">
            {COSTOS.map((c, i) => (
              <li
                key={c.concepto}
                className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-[var(--scale)] py-5"
              >
                <span className="min-w-0">
                  <span className="flex items-baseline gap-3">
                    <span className="mono-sm text-slag">{String(i + 1).padStart(2, "0")}</span>
                    <span className="titulo">{c.concepto}</span>
                  </span>
                  <span className="mt-1 block cuerpo text-smoke">{c.detalle}</span>
                </span>
                <span className="mono-sm text-ash tabular-nums">{c.valor}</span>
              </li>
            ))}
          </ul>

          <p className="mt-8 cuerpo text-smoke medida">
            Una campaña de nueve secciones sale por unas {GENERACIONES_POR_CAMPANA}{" "}
            generaciones contando las repeticiones de las secciones que no quedan a la
            primera. Con eso, el plan Estudio cubre unas once campañas al mes.
          </p>
          <p className="mt-4 cuerpo text-slag medida">
            Para comparar: las herramientas que venden solo la imagen están entre US$0,09 y
            US$0,10 por pieza. Aquí, además de la imagen, te llevas el prompt construido con
            la metodología, validado y editable, y la campaña entera adaptada a tu país.
          </p>
        </div>
      </section>

      {/* Honestidad de §8.1: lo que puede cambiar, dicho antes. */}
      <section aria-labelledby="letra-chica" className="pb-8">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h2 id="letra-chica" className="titulo">
            La letra pequeña, en grande
          </h2>
          <ul className="mt-6 border-t border-[var(--scale)]">
            {[
              "Los precios son en dólares. Las generaciones incluidas en el plan no se acumulan entre meses; las que compras aparte, sí.",
              "Si una sección falla al generarse, su crédito vuelve a tu cuenta automáticamente. No hay que reclamarlo.",
              "El costo de arriba es el de las tarifas de septiembre de 2026. Si la tarifa de los modelos cambia, lo que se mueve es el número de generaciones incluidas, no el precio del plan, y se avisa antes del siguiente cobro.",
              "El cambio de plan en esta versión es una simulación: ajusta tu plan y recarga generaciones sin cobrar nada. Todavía no hay pasarela de pago conectada.",
            ].map((t) => (
              <li key={t} className="border-b border-[var(--scale)] py-4 cuerpo text-smoke medida">
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <Preguntas />
    </>
  );
}
