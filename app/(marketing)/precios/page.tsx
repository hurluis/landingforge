import type { Metadata } from "next";
import { TablaPrecios } from "@/components/marketing/tabla-precios";
import { Preguntas } from "@/components/marketing/preguntas";
import { SECCIONES_POR_CAMPANA } from "@/lib/planes";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Cuatro planes en dólares: tres con secciones incluidas y uno de pago por uso. Prueba con 5 secciones gratis, sin tarjeta.",
};

export default function Precios() {
  return (
    <>
      <section className="pt-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h1 className="display-xl max-w-[16ch]">Pagas por lo que publicas.</h1>
          <p className="mt-8 cuerpo-lg text-smoke medida">
            No hay plan ilimitado con letra pequeña: cada plan dice cuántas secciones trae, y
            Fundición no trae ninguna porque se factura lo que uses. Empieza por el que te
            quede corto y súbelo cuando el trabajo lo pida.
          </p>
        </div>
      </section>

      <TablaPrecios />

      <section aria-labelledby="letra-chica" className="pb-8">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h2 id="letra-chica" className="titulo">
            La letra pequeña, en grande
          </h2>
          <ul className="mt-6 border-t border-[var(--scale)]">
            {[
              `Los precios son en dólares. Una campaña completa son ${SECCIONES_POR_CAMPANA} secciones, y cada sección que generas consume un crédito.`,
              "Las secciones incluidas en el plan no se acumulan entre meses; las que compras aparte, sí.",
              "Si una sección falla al generarse, su crédito vuelve a tu cuenta automáticamente. No hay que reclamarlo.",
              "En Fundición no hay cuota ni cupo: se factura al cierre de cada ciclo lo que hayas creado, y en la pantalla de cuenta ves el acumulado en todo momento.",
              "El cambio de plan en esta versión es una simulación: ajusta tu plan sin cobrar nada. Todavía no hay pasarela de pago conectada.",
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
