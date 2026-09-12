import type { Metadata } from "next";
import { TablaPrecios } from "@/components/marketing/tabla-precios";
import { Preguntas } from "@/components/marketing/preguntas";

export const metadata: Metadata = {
  title: "Precios",
  description:
    "Cuatro planes en dólares, medidos en secciones. El de entrada desde US$12 y uno sin tope de uso para quien no cabe en ninguno. Prueba con 5 secciones gratis, sin tarjeta.",
};

export default function Precios() {
  return (
    <>
      <section className="pt-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h1 className="display-xl max-w-[16ch]">Pagas por lo que publicas.</h1>
          <p className="mt-8 cuerpo-lg text-smoke medida">
            Cada plan dice cuántas secciones trae y cuánto cuesta, sin letra pequeña. El de
            entrada cuesta menos que cualquier suscripción de IA que ya pagas, y Fundición,
            que es el de las agencias con picos, no tiene techo: cuando se acaban las
            incluidas, se sigue trabajando y se factura el excedente.
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
              "Los precios son en dólares. Cada sección que generas consume un crédito.",
              "Las secciones incluidas en el plan no se acumulan entre meses; las que compras aparte, sí.",
              "Si una sección falla al generarse, su crédito vuelve a tu cuenta automáticamente. No hay que reclamarlo.",
              "En Fundición la cuota mensual incluye 900 secciones y el excedente se factura al cierre del ciclo, sin tope. En la pantalla de cuenta ves el acumulado en todo momento.",
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
