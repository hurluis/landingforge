import type { Metadata } from "next";
import { TablaPrecios } from "@/components/marketing/tabla-precios";
import { Preguntas } from "@/components/marketing/preguntas";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Tres planes medidos en créditos. Un crédito es una imagen 9:16 en calidad máxima. Prueba con 5 créditos gratis, sin tarjeta.",
};

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

      {/* Honestidad de §8.1: los números están sin validar. Decirlo aquí es
          mejor que enterarse después. */}
      <section aria-labelledby="letra-chica" className="pb-8">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <div className="rounded-[16px] border border-[var(--scale)] bg-[var(--anvil)] p-6">
            <h2 id="letra-chica" className="titulo">
              La letra pequeña, en grande
            </h2>
            <ul className="mt-4 flex flex-col gap-3">
              <li className="cuerpo text-smoke">
                Los créditos incluidos en el plan no se acumulan entre meses. Los que compras
                aparte, sí.
              </li>
              <li className="cuerpo text-smoke">
                Si una sección falla al generarse, su crédito vuelve a tu cuenta
                automáticamente. No hay que reclamarlo.
              </li>
              <li className="cuerpo text-smoke">
                Estos precios son de la primera versión del producto y están sujetos a la
                tarifa de la API de imagen. Si cambian, se avisa antes del siguiente cobro.
              </li>
              <li className="cuerpo text-smoke">
                El cambio de plan en esta versión es una simulación: ajusta tu plan y recarga
                créditos sin cobrar nada. Todavía no hay pasarela de pago conectada.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Preguntas />
    </>
  );
}
