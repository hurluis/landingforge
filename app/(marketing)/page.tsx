import Link from "next/link";
import { Boton } from "@/components/ui/boton";
import { Apertura } from "@/components/marketing/apertura";
import { Marquesina } from "@/components/motion/marquesina";
import { TiraPinned } from "@/components/motion/tira-pinned";
import { EstudioVivo } from "@/components/marketing/estudio-vivo";
import { TablaPrecios } from "@/components/marketing/tabla-precios";
import { Preguntas } from "@/components/marketing/preguntas";

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
 * Y EL CIERRE ES OTRA TOMA. Un tarro de crema girando en la mano, bajo la
 * última frase. La página abre con un frasco y cierra con otro producto: lo
 * que vende no es una plantilla, es una landing para el tuyo.
 *
 * Ninguna sección tiene fondo opaco. Donde hace falta superficie para leer es
 * cristal o vidrio, no pintura: una caja opaca taparía la toma.
 */

export default function Home() {
  return (
    <>
      {/* 1 · La apertura: tres capítulos sobre los actos de la toma. */}
      <Apertura />

      {/* 2 · Muestrario, tira continua a sangre (M4).
             Sin titular: su único trabajo es probar que el producto produce. */}
      <Marquesina />

      {/* 3 · Las nueve secciones, pan horizontal pinned (M6) */}
      <TiraPinned />

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
        id="cierre-zona"
        aria-labelledby="cierre-titulo"
        className="relative h-[220vh] supports-[height:100svh]:h-[220svh]"
      >
        <div className="sticky top-0 flex h-screen items-center overflow-x-clip px-5 sm:px-8 md:px-12 supports-[height:100svh]:h-[100svh]">
          <div className="mx-auto w-full max-w-[1600px]">
            <div className="halo w-fit">
              <h2 id="cierre-titulo" className="display-lg max-w-[16ch] sobre-pelicula">
                La primera campaña te toma once minutos.
              </h2>
              <div className="mt-12">
                <Boton asChild variante="heat" tamano="lg">
                  <Link href="/app/nueva">Crear mi primera landing</Link>
                </Boton>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
