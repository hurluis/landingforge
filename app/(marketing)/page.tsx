import { Fragment } from "react";
import Link from "next/link";
import { Money, SealCheck, UsersThree, TextAa } from "@phosphor-icons/react/dist/ssr";
import { Boton } from "@/components/ui/boton";
import { HeroForja } from "@/components/motion/forja";
import { Marquesina } from "@/components/motion/marquesina";
import { TiraPinned } from "@/components/motion/tira-pinned";
import { StickyStack } from "@/components/motion/sticky-stack";
import { RevealLineas, RevealBloque, RevealLista } from "@/components/motion/reveal";
import { TrazoConectado } from "@/components/motion/trazo";
import { ContadorScroll } from "@/components/motion/interacciones";
import { EstudioVivo } from "@/components/marketing/estudio-vivo";
import { TablaPrecios } from "@/components/marketing/tabla-precios";
import { Preguntas } from "@/components/marketing/preguntas";

/**
 * Home. El copy es definitivo y se usa palabra por palabra.
 *
 * Familias de layout, ninguna repetida de forma consecutiva:
 *   1 hero split asimétrico pinned  ·  2 tira a sangre  ·  3 editorial de dos
 *   columnas con filete  ·  4 pan horizontal pinned  ·  5 sticky stack  ·
 *   6 secuencia con trazo  ·  7 herramienta embebida con parallax  ·
 *   8 tres columnas comparables  ·  9 acordeón  ·  10 tipografía a sangre.
 *
 * Ritmo vertical py-32 a py-48: el contenido protagonista son imágenes 9:16 y
 * las imágenes necesitan aire.
 */

const CONSECUENCIAS = [
  {
    afirmacion: "Misma estructura para todos los productos",
    consecuencia: "Tu producto premium se ve como el genérico de al lado",
  },
  {
    afirmacion: "Caras de stock o caras de IA evidentes",
    consecuencia: "El comprador desconfía antes de leer el precio",
  },
  {
    afirmacion: "Cero señales del mercado local",
    consecuencia: "Pagas tráfico que no convierte",
  },
];

const TARJETAS = [
  {
    id: "contraentrega",
    titulo: "Contraentrega",
    texto:
      "La señal de confianza número uno del país. Tu comprador paga cuando el producto está en su mano. Si tu landing no lo dice, estás dejando ventas sobre la mesa.",
    sello: <Money className="size-6" weight="bold" />,
  },
  {
    id: "invima",
    titulo: "INVIMA",
    texto:
      "Para suplementos y cosméticos, el registro sanitario no es un trámite: es la diferencia entre parecer un negocio y parecer un riesgo.",
    sello: <SealCheck className="size-6" weight="bold" />,
  },
  {
    id: "caras",
    titulo: "Caras de aquí",
    texto:
      "Paisa, costeña, rola, afrodescendiente, rasgos indígenas. LandingForge especifica el origen regional en cada prompt, porque un modelo dejado a su suerte devuelve un latino genérico que ningún colombiano reconoce.",
    sello: <UsersThree className="size-6" weight="bold" />,
  },
  {
    id: "formato",
    titulo: "Formato y lenguaje",
    texto:
      "$99.900 con punto de miles. 3.412 clientes, no +3.000. Reseñas que suenan a alguien real: «a mis 42 años», «vale cada peso».",
    sello: <TextAa className="size-6" weight="bold" />,
  },
];

const PASOS = [
  {
    titulo: "Cuéntale a LandingForge sobre tu producto.",
    texto:
      "Subes la foto y respondes cuatro preguntas: qué es, para quién, cuál es el beneficio principal y cuánto cuesta.",
  },
  {
    titulo: "LandingForge asigna paleta y secciones.",
    texto:
      "La matriz cruza tipo de producto, audiencia y registro emocional. Ves la paleta con sus hex antes de generar nada.",
  },
  {
    titulo: "Recibes la campaña completa.",
    texto:
      "Los nueve prompts construidos en prosa narrativa, validados y listos para generar. Los puedes editar, versionar y volver a correr.",
  },
];

export default function Home() {
  return (
    <>
      {/* 1 · Hero, split asimétrico con panel pinned (M1 y M2) */}
      <HeroForja />

      {/* 2 · Muestrario, tira continua a sangre (M4).
             Sin titular: su único trabajo es probar que el producto produce. */}
      <Marquesina />

      {/* 3 · El problema, editorial de dos columnas con filete vertical */}
      <section aria-labelledby="problema-titulo" className="papel py-32 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1px_1.1fr] lg:gap-16">
            <RevealLineas
              as="h2"
              id="problema-titulo"
              className="display-lg"
              lineas={["Las plantillas venden lo mismo", "diez mil veces."]}
            />
            <div aria-hidden className="hidden lg:block w-px bg-scale" />
            <RevealBloque retraso={0.18}>
              <p className="cuerpo-lg text-smoke medida">
                Un constructor de plantillas te da la misma estructura que a tus competidores,
                con imágenes de stock o caras generadas que se notan a un kilómetro. Y ninguno
                sabe que en Colombia la venta se cierra con contraentrega, que un suplemento
                sin INVIMA no genera confianza, y que un precio escrito{" "}
                <span className="mono-sm text-ash">$99,900</span> en vez de{" "}
                <span className="mono-sm text-ash">$99.900</span> le dice a tu comprador que no
                eres de aquí.
              </p>
            </RevealBloque>
          </div>

          {/* Ritmo editorial, no rejilla de cards. Las consecuencias entran
              desde la derecha: el texto acusa, las consecuencias responden. */}
          <RevealLista
            className="mt-20"
            claseItem="grid gap-3 border-t border-scale py-8 sm:grid-cols-2 sm:gap-12"
            direccion="derecha"
            paso={0.06}
            items={CONSECUENCIAS.map((c) => (
              <Fragment key={c.afirmacion}>
                <p className="titulo text-ash text-balance">{c.afirmacion}</p>
                <p className="cuerpo text-slag sm:pl-10">{c.consecuencia}</p>
              </Fragment>
            ))}
          />

          <RevealBloque retraso={0.1} className="mt-12">
            <p className="mono-sm text-slag">
              <ContadorScroll hasta={3412} className="text-ash" /> campañas generadas hasta hoy
            </p>
          </RevealBloque>
        </div>
      </section>

      {/* 4 · Las nueve secciones, pan horizontal pinned (M6) */}
      <TiraPinned />

      {/* 5 · La metodología colombiana, sticky stack (M7).
             Fondo hundido: la sección más oscura de la página. */}
      <section
        aria-labelledby="metodologia-titulo"
        className="papel border-y border-scale py-32 lg:py-36"
      >
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <RevealLineas
            as="h2"
            id="metodologia-titulo"
            className="display-lg max-w-[20ch]"
            lineas={["Lo que ninguna plataforma internacional", "sabe de vender en Colombia."]}
          />
          <div className="mt-20">
            <StickyStack tarjetas={TARJETAS} />
          </div>
        </div>
      </section>

      {/* 6 · Cómo funciona, secuencia con trazo conectado.
             Aquí los números están ganados: la secuencia es obligatoria. */}
      <section aria-labelledby="pasos-titulo" className="py-32 lg:py-36">
        <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
          <RevealLineas
            as="h2"
            id="pasos-titulo"
            className="display-lg max-w-[14ch]"
            lineas={["Once minutos,", "en tres pasos."]}
          />

          <TrazoConectado className="mt-20 hidden md:block" />

          <ol className="mt-6 grid gap-12 md:grid-cols-3 md:gap-10">
            {PASOS.map((p, i) => (
              <RevealBloque key={p.titulo} retraso={i * 0.12} className="flex flex-col gap-4">
                <li>
                  <span
                    aria-hidden
                    className="font-[family-name:var(--font-display-serif)] text-[3.5rem] font-[500] leading-none tracking-[-0.02em] text-slag"
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-4 titulo text-ash text-balance">{p.titulo}</h3>
                  <p className="mt-3 cuerpo text-smoke">{p.texto}</p>
                </li>
              </RevealBloque>
            ))}
          </ol>

          <RevealBloque retraso={0.2}>
            <p className="mt-20 medida cuerpo-lg text-smoke border-t border-scale pt-10">
              Te llevas los prompts, no solo las imágenes. Si mañana dejas de usar
              LandingForge, tu trabajo sigue siendo tuyo.
            </p>
          </RevealBloque>
        </div>
      </section>

      {/* 7 · El estudio en vivo, herramienta embebida con parallax (M8) */}
      <EstudioVivo />

      {/* 8 · Precios, tres columnas comparables con spotlight (M9) */}
      <TablaPrecios compacta />

      {/* 9 · Preguntas, acordeón */}
      <Preguntas />

      {/* 10 · Cierre, tipografía a sangre. SIN animación de entrada (M14).
              Después de una página entera en movimiento, que algo esté quieto
              es lo que le da peso. */}
      <section aria-labelledby="cierre-titulo" className="py-32 lg:py-44">
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
