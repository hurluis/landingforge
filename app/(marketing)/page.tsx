import Link from "next/link";
import { Money, SealCheck, UsersThree, TextAa } from "@phosphor-icons/react/dist/ssr";
import { Boton } from "@/components/ui/boton";
import { Marquesina } from "@/components/motion/marquesina";
import { TiraPinned } from "@/components/motion/tira-pinned";
import { Relato, type Tramo } from "@/components/motion/relato";
import { ContadorScroll } from "@/components/motion/interacciones";
import { EstudioVivo } from "@/components/marketing/estudio-vivo";
import { TablaPrecios } from "@/components/marketing/tabla-precios";
import { Preguntas } from "@/components/marketing/preguntas";

/**
 * Home. El copy es definitivo y se usa palabra por palabra.
 *
 * La página tiene dos mitades, y la costura entre ellas es deliberada.
 *
 * LA PRIMERA ES UNA SOLA COSA. El relato —cinco tramos, del saludo a lo que
 * el cliente se lleva— no scrollea: se queda clavado en la pantalla mientras
 * el scroll avanza el tiempo de la toma que corre por detrás (`Pelicula`, en
 * el layout). Texto e imagen leen el mismo progreso, así que no hay dos
 * animaciones que cuadrar: hay una magnitud y dos cosas que la obedecen. Esa
 * es la razón de que se lean como un único objeto y no como un documento
 * pasando por delante de un vídeo.
 *
 * LA SEGUNDA ES LA PÁGINA DE SIEMPRE. La tira, el estudio, los precios y las
 * preguntas son contenido que se explora, no que se contempla: pinearlo
 * obligaría a esperar para leer una tabla de precios, que es exactamente lo
 * contrario de lo que alguien quiere hacer con una tabla de precios. Ahí el
 * contenido vuelve a fluir, sobre el tramo final de la misma toma.
 *
 * Ninguna sección tiene fondo opaco. Donde hace falta superficie para leer es
 * vidrio (`.vidrio`), no pintura: una caja opaca taparía la película, que es
 * justo lo que sostiene la página.
 */

const CONSECUENCIAS = [
  ["Misma estructura para todos los productos", "Tu producto premium se ve como el genérico de al lado"],
  ["Caras de stock o caras de IA evidentes", "El comprador desconfía antes de leer el precio"],
  ["Cero señales del mercado local", "Pagas tráfico que no convierte"],
];

const TARJETAS = [
  {
    id: "contraentrega",
    titulo: "Contraentrega",
    texto:
      "La señal de confianza número uno del país: se paga cuando el producto está en la mano.",
    sello: <Money className="size-5" weight="bold" />,
  },
  {
    id: "invima",
    titulo: "INVIMA",
    texto:
      "En suplementos y cosmética, el registro separa parecer un negocio de parecer un riesgo.",
    sello: <SealCheck className="size-5" weight="bold" />,
  },
  {
    id: "caras",
    titulo: "Caras de aquí",
    texto:
      "Paisa, costeña, rola, afro, rasgos indígenas. A su suerte, el modelo devuelve un latino genérico.",
    sello: <UsersThree className="size-5" weight="bold" />,
  },
  {
    id: "formato",
    titulo: "Formato y lenguaje",
    texto:
      "$99.900 con punto de miles. 3.412 clientes, no +3.000. Reseñas de alguien real.",
    sello: <TextAa className="size-5" weight="bold" />,
  },
];

const PASOS = [
  ["Cuéntale sobre tu producto.", "Subes la foto y respondes cuatro preguntas: qué es, para quién, cuál es el beneficio principal y cuánto cuesta."],
  ["Recibe paleta y secciones.", "La matriz cruza tipo de producto, audiencia y registro emocional. Ves la paleta con sus hex antes de generar nada."],
  ["Llévate la campaña completa.", "Los nueve prompts en prosa narrativa, validados y listos para generar. Los puedes editar y volver a correr."],
];

const TRAMOS: Tramo[] = [
  {
    id: "hero",
    eyebrow: "El paquete visual de tu landing",
    titulo: (
      <>
        Tu producto no se parece a ningún otro.
        <br />
        Tu landing tampoco debería.
      </>
    ),
    cuerpo:
      "Sube la foto. LandingForge arma las nueve secciones que venden en Colombia. Sin plantillas.",
    pie: (
      <div className="flex flex-wrap items-center gap-4">
        <Boton asChild variante="heat" tamano="lg">
          <Link href="/app/nueva">Crear mi primera landing</Link>
        </Boton>
        <Boton asChild variante="contorno" tamano="lg">
          <Link href="#tira-titulo">Ver el método</Link>
        </Boton>
      </div>
    ),
  },
  {
    id: "problema",
    eyebrow: "El problema",
    titulo: (
      <>
        Las plantillas venden lo mismo
        <br />
        diez mil veces.
      </>
    ),
    cuerpo: (
      <p>
        Un constructor de plantillas te da la misma estructura que a tus competidores, con
        imágenes de stock o caras generadas que se notan a un kilómetro. Y ninguno sabe que
        aquí la venta se cierra con contraentrega, que un suplemento sin INVIMA no genera
        confianza, y que un precio escrito <span className="mono-sm text-ash">$99,900</span>{" "}
        en vez de <span className="mono-sm text-ash">$99.900</span> le dice a tu comprador
        que no eres de aquí.
      </p>
    ),
    pie: (
      <>
        <ul className="grid gap-px overflow-hidden rounded-[14px]">
          {CONSECUENCIAS.map(([afirmacion, consecuencia]) => (
            <li key={afirmacion} className="border-t border-scale py-3.5">
              <p className="titulo text-ash text-balance">{afirmacion}</p>
              <p className="cuerpo mt-0.5 text-smoke">{consecuencia}</p>
            </li>
          ))}
        </ul>
        <p className="mono-sm mt-6 text-slag">
          <ContadorScroll hasta={3412} className="text-ash" /> campañas generadas hasta hoy
        </p>
      </>
    ),
  },
  {
    id: "metodologia",
    eyebrow: "La metodología colombiana",
    titulo: (
      <>
        Lo que ninguna plataforma internacional
        <br />
        sabe de vender en Colombia.
      </>
    ),
    pie: (
      <ul className="flex flex-col gap-2">
        {TARJETAS.map((t) => (
          <li key={t.id} className="vidrio flex items-start gap-4 rounded-[14px] px-4 py-3">
            <span
              aria-hidden
              className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full text-[#1A1206]"
              style={{ background: "var(--templado)" }}
            >
              {t.sello}
            </span>
            <span className="min-w-0">
              <h3 className="titulo text-ash">{t.titulo}</h3>
              <p className="cuerpo mt-0.5 text-smoke">{t.texto}</p>
            </span>
          </li>
        ))}
      </ul>
    ),
  },
  {
    id: "pasos",
    eyebrow: "Cómo funciona",
    titulo: (
      <>
        Once minutos,
        <br />
        en tres pasos.
      </>
    ),
    pie: (
      <ol className="flex flex-col gap-4">
        {PASOS.map(([titulo, texto], i) => (
          <li key={titulo} className="flex items-baseline gap-5 border-t border-scale pt-4">
            <span aria-hidden className="display-md shrink-0 text-slag">
              {i + 1}
            </span>
            <span className="min-w-0">
              <h3 className="titulo text-ash text-balance">{titulo}</h3>
              <p className="cuerpo mt-1 text-smoke">{texto}</p>
            </span>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: "llevas",
    eyebrow: "Lo que te llevas",
    titulo: (
      <>
        Te llevas los prompts,
        <br />
        no solo las imágenes.
      </>
    ),
    cuerpo:
      "Si mañana dejas de usar LandingForge, tu trabajo sigue siendo tuyo. Cada prompt se puede reescribir, versionar y volver a correr.",
  },
];

export default function Home() {
  return (
    <>
      {/* 1 · El relato. Cinco tramos clavados en pantalla sobre la toma. */}
      <Relato tramos={TRAMOS} />

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
