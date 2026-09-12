import Link from "next/link";
import { Boton } from "@/components/ui/boton";
import { Apertura } from "@/components/marketing/apertura";
import { Marquesina } from "@/components/motion/marquesina";
import { TiraPinned } from "@/components/motion/tira-pinned";
import { EstudioVivo } from "@/components/marketing/estudio-vivo";
import { TablaPrecios } from "@/components/marketing/tabla-precios";
import { Preguntas } from "@/components/marketing/preguntas";
import { traductor } from "@/lib/i18n/servidor";

/**
 * Home. El copy es definitivo y se usa palabra por palabra.
 *
 * La página tiene dos mitades, y la costura entre ellas es deliberada.
 *
 * LA APERTURA ES LA PELÍCULA. Seis tramos, uno a la izquierda y el siguiente
 * a la derecha, sobre la toma de producto que `Pelicula` reparte a lo largo de
 * su zona. Cada tramo cae sobre un acto de la toma —el pedestal, el despegue,
 * el vuelo, la marca, la mano—. Ver `components/marketing/apertura`.
 *
 * LO DE EN MEDIO ES LA PÁGINA DE SIEMPRE. La tira, el estudio, los precios y
 * las preguntas son contenido que se explora, no que se contempla. Al terminar
 * la zona la toma se queda en su último fotograma y un velo baja sobre ella.
 *
 * Y LA SEGUNDA MITAD ES OTRA TOMA. Un tarro de crema girando en la mano,
 * desde «Pruébalo con tu producto ahora» hasta la última frase. La página
 * abre con un frasco y cierra con otro producto: lo que vende no es una
 * plantilla, es una landing para el tuyo. Entre las dos tomas, la tira de las
 * nueve secciones, que es la única parte que va sobre fondo quieto.
 *
 * Sobre la película no hay cajas: la letra va impresa sobre la toma, y es su
 * sitio en el encuadre —el lado oscuro, nunca el frasco— lo que la deja leer.
 */

export default async function Home() {
  const t = await traductor();
  return (
    <>
      {/* 1 · La apertura: tres capítulos sobre los actos de la toma. */}
      <Apertura />

      {/* 2 · Muestrario, tira continua a sangre (M4).
             Sin titular: su único trabajo es probar que el producto produce. */}
      <Marquesina />

      {/* 3 · Las nueve secciones, pan horizontal pinned (M6) */}
      <TiraPinned />

      {/* 4 a 7 · LA SEGUNDA TOMA. El tarro de crema empieza a girar justo
             donde termina la tira de las nueve secciones, con «Pruébalo con tu
             producto ahora», y sigue girando bajo los precios, las preguntas y
             el cierre. Antes vivía solo bajo el cierre, donde apenas hay texto
             que mover con el scroll: la animación pasaba casi sin verse y la
             página se quedaba sin película justo en su mitad. */}
      <div id="zona-final">
        {/* 4 · El estudio en vivo, herramienta embebida con parallax (M8) */}
        <EstudioVivo />

        {/* 5 · Precios, tres columnas comparables con spotlight (M9) */}
        <TablaPrecios compacta />

        {/* 6 · Preguntas, acordeón */}
        <Preguntas />

      {/* 7 · Cierre sobre la segunda toma. SIN animación de entrada (M14):
              la frase se queda quieta, fija en pantalla, mientras el tarro gira
              debajo durante un par de pantallas. Después de una página entera
              en movimiento, que la letra esté quieta es lo que le da peso. */}
        <section
          aria-labelledby="cierre-titulo"
          className="relative h-[220vh] supports-[height:100svh]:h-[220svh]"
        >
          <div className="sticky top-0 flex h-screen items-center overflow-x-clip px-5 sm:px-8 md:px-12 supports-[height:100svh]:h-[100svh]">
            <div className="mx-auto w-full max-w-[1600px]">
            {/* El tarro gira en el centro y la mano entra por la derecha: la
                frase ocupa el tercio izquierdo, que es el que queda oscuro. */}
            <div className="md:max-w-[28vw]">
              <h2 id="cierre-titulo" className="display-lg cierre-titular sobre-pelicula">
                {t("Tu próxima landing, en menos de diez minutos.")}
              </h2>
              <div className="mt-12">
                <Boton asChild variante="heat" tamano="lg">
                  <Link href="/app/nueva">{t("Crear mi primera landing")}</Link>
                </Boton>
              </div>
            </div>
          </div>
        </div>
        </section>
      </div>
    </>
  );
}
