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
 * LA APERTURA ES LA PELÍCULA. Tres capítulos anclados a las esquinas, con
 * pasillos de 80vh entre ellos, sobre la toma de producto que `Pelicula`
 * reparte a lo largo de su zona. Cada capítulo cae sobre un acto de la toma
 * —estudio, primer plano de la marca, la mano—, y la línea de tiempo de abajo
 * enseña en qué fotograma va el visitante. Ver `components/marketing/apertura`.
 *
 * LO DE DEBAJO ES LA PÁGINA DE SIEMPRE. La tira, el estudio, los precios y las
 * preguntas son contenido que se explora, no que se contempla. Al terminar la
 * zona la toma se queda en su último fotograma y un velo baja sobre ella: la
 * película acabó y la página pasa a leerse.
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

      {/* 7 · Cierre, tipografía a sangre. SIN animación de entrada (M14).
              Después de una página entera en movimiento, que algo esté quieto
              es lo que le da peso. */}
      <section aria-labelledby="cierre-titulo" className="relative py-32 lg:py-44">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <h2 id="cierre-titulo" className="display-lg max-w-[16ch]">
            La primera campaña te toma once minutos.
          </h2>
          <div className="mt-12">
            <Boton asChild variante="heat" tamano="lg">
              <Link href="/app/nueva">Crear mi primera landing</Link>
            </Boton>
          </div>
        </div>
      </section>
    </>
  );
}
