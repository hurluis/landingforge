import Image from "next/image";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { RevealBloque, RevealLineas } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/**
 * LA APERTURA · seis tramos sobre la toma de producto, alternando lado.
 *
 * Cada tramo es un solo bloque, a la izquierda o a la derecha, y el siguiente
 * no entra hasta que el anterior se va: primero la afirmación, luego su
 * prueba, en zigzag.
 *
 * La letra va impresa sobre la película, sin cajas: ni cristal, ni halo, ni
 * recuadro. Lo que la hace legible es DÓNDE está, no lo que lleva detrás:
 *
 *   · Ocupa el tercio de su lado. El centro es del frasco, que es blanco, y
 *     sobre él no se escribe.
 *   · Cada tramo cae en un acto oscuro de la toma. El único acto claro —el
 *     primer plano de la etiqueta, blanco de lado a lado— es un pasillo sin
 *     texto: la marca, sola, a pantalla completa.
 *
 * `Pelicula` reparte los 415 fotogramas sobre la zona entera, así que la
 * altura de cada tramo decide en qué fotograma está la cámara cuando su
 * bloque llega al centro, y cuándo sale:
 *
 *   estudio    el hero                        el frasco en su pedestal
 *   despegue   una campaña real               el frasco se levanta
 *   vuelo      las plantillas venden igual    da vueltas en el aire
 *   vuelo      lo que ninguna plantilla sabe  sigue girando, fondo azul noche
 *   marca      — pasillo —                    primer plano de la etiqueta
 *   flotacion  te llevas los prompts          la cámara se abre
 *   mano       menos de diez minutos          el frasco, en la mano
 *
 * El pasillo mide 195svh porque tiene que cubrir, además del acto, lo que
 * tarda el tramo anterior en salir y el siguiente en entrar: si el panel de
 * la metodología siguiera en pantalla cuando empieza el blanco, su letra
 * blanca desaparecería sobre la etiqueta. `scripts/verificar-apertura.mjs`
 * comprueba los cruces, y `verificar-contraste-pelicula.mjs` la letra.
 */

const X = "px-5 sm:px-8 md:px-12";

/* El tercio de su lado. A 1280 px el frasco empieza en 525 px: el bloque
   termina antes. */
const TERCIO = "w-full md:max-w-[38vw]";

const SERVICIOS = ["Las nueve secciones", "Adaptada a tu mercado", "Prompts que son tuyos"];

const MUESTRA = [
  { src: "/secciones/potencia.png", alt: "Sección hero de una campaña real de suplemento" },
  { src: "/secciones/precios.png", alt: "Sección de precios de la misma campaña" },
  { src: "/secciones/testimonios.png", alt: "Sección de testimonios de la misma campaña" },
];

const METODO = [
  {
    titulo: "Contraentrega",
    texto: "Donde se paga al recibir, es la señal de confianza que más pesa. Tu landing la dice sin que la pidas.",
  },
  {
    titulo: "Registro sanitario",
    texto: "INVIMA, COFEPRIS, DIGESA, FDA. En suplementos y cosmética, el registro separa parecer un negocio de parecer un riesgo.",
  },
  {
    titulo: "Caras de tu mercado",
    texto: "Personas y ciudades del país donde vendes. A su suerte, el modelo devuelve un latino genérico.",
  },
  {
    titulo: "Formato y lenguaje",
    texto: "$99.900 en Bogotá, $99,900 en Ciudad de México. 3.412 clientes, no +3.000. Reseñas de alguien real.",
  },
];

const PASOS = [
  {
    titulo: "Cuéntale sobre tu producto",
    texto: "Subes la foto y respondes cuatro preguntas: qué es, para quién, dónde lo vendes y cuánto cuesta.",
  },
  {
    titulo: "Recibe paleta y secciones",
    texto: "La matriz cruza producto, audiencia y registro emocional. Ves los hex antes de generar nada.",
  },
  {
    titulo: "Llévate la campaña completa",
    texto: "Nueve prompts en prosa narrativa, validados. Los editas, los versionas, los vuelves a correr.",
  },
];

export function Apertura() {
  return (
    <div id="pelicula-zona">
      {/* ── El hero y su prueba ─────────────────────────────────────── */}
      <section aria-labelledby="hero-titulo">
        <Tramo acto="estudio" lado="izquierda" primero>
          <RevealLineas
            as="h1"
            id="hero-titulo"
            retraso={0.2}
            className="display-xl apertura-titular text-ash sobre-pelicula"
            lineas={["Tu producto", "no se parece", "a ningún otro.", "Tu landing", "tampoco debería."]}
          />
          <RevealBloque retraso={0.6}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ash sobre-pelicula">
              Sube la foto. LandingForge arma las nueve secciones que venden, adaptadas al país
              donde vendes. Sin plantillas.
            </p>
          </RevealBloque>
          <RevealBloque retraso={0.72} className="mt-8 flex flex-wrap gap-3">
            <BotonLleno href="/app/nueva">Crear mi primera landing</BotonLleno>
            <BotonContorno href="#tira-titulo">Ver las nueve secciones</BotonContorno>
          </RevealBloque>
        </Tramo>

        <Tramo acto="despegue" lado="derecha" alto="min-h-[120svh]">
          <CampanaReal />
        </Tramo>
      </section>

      {/* ── La metodología ──────────────────────────────────────────── */}
      <section id="metodo" aria-labelledby="metodo-titulo">
        <Tramo acto="vuelo" lado="izquierda">
          <Rotulo>La metodología</Rotulo>
          <RevealLineas
            as="h2"
            id="metodo-titulo"
            retraso={0.18}
            className="mt-5 display-xl apertura-subtitular text-ash sobre-pelicula"
            lineas={["Las plantillas", "venden lo mismo", "diez mil veces."]}
          />
          <RevealBloque retraso={0.42}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ash sobre-pelicula">
              Un constructor de plantillas te da la misma estructura que a tus competidores, con
              imágenes de stock o caras generadas que se notan a un kilómetro.
            </p>
          </RevealBloque>
        </Tramo>

        <Tramo acto="vuelo" lado="derecha">
          {/* Más compacto que el resto: intro y cuatro filas tienen que caber
              en una pantalla de 720 px sin meterse bajo el botón del
              asistente. */}
          <p className="max-w-md text-base leading-relaxed text-ash sobre-pelicula lg:text-[1.0625rem]">
            Ninguna plantilla sabe que en tu mercado la venta se cierra con contraentrega, ni que
            un precio con el separador equivocado le dice a tu comprador que no eres de allí.
          </p>
          <Filas filas={METODO} enlace="/metodologia" />
        </Tramo>
      </section>

      {/* ── La marca, sola ──────────────────────────────────────────── */}
      <div aria-hidden data-pasillo="marca" className="h-[195svh]" />

      {/* ── Lo que te llevas ────────────────────────────────────────── */}
      <section id="llevas" aria-labelledby="llevas-titulo">
        <Tramo acto="flotacion" lado="izquierda">
          <RevealLineas
            as="h2"
            id="llevas-titulo"
            retraso={0.12}
            className="display-xl apertura-subtitular text-ash sobre-pelicula"
            lineas={["Te llevas los", "prompts, no solo", "las imágenes."]}
          />
          <RevealBloque retraso={0.35}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ash sobre-pelicula">
              Cada prompt se puede reescribir, versionar y volver a correr. Si mañana dejas de
              usar LandingForge, tu trabajo sigue siendo tuyo.
            </p>
          </RevealBloque>
        </Tramo>

        <Tramo acto="mano" lado="derecha" alto="min-h-[145svh]">
          <Rotulo>Menos de diez minutos, tres pasos</Rotulo>
          <Filas filas={PASOS} ordenada />
          <RevealBloque retraso={0.6} className="mt-8 flex flex-wrap gap-3">
            <BotonLleno href="/app/nueva">Empezar ahora</BotonLleno>
            <BotonContorno href="/precios">Ver precios</BotonContorno>
          </RevealBloque>
        </Tramo>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- */

/**
 * Un tramo: una fila de al menos una pantalla con un solo bloque, pegado a su
 * lado y centrado en vertical, que entra deslizándose desde ese mismo lado.
 * El primero es la primera pantalla y apoya el bloque abajo.
 */
function Tramo({
  acto,
  lado,
  alto = "min-h-[100svh]",
  primero = false,
  children,
}: {
  /** El acto de la toma sobre el que cae. Lo lee la verificación. */
  acto: string;
  lado: "izquierda" | "derecha";
  alto?: string;
  primero?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      data-tramo={acto}
      className={cn(
        "relative flex overflow-x-clip",
        X,
        primero
          ? /* Abajo queda sitio para los botones flotantes. */
            "min-h-[calc(100vh-4rem)] items-end pt-10 pb-24 supports-[height:100svh]:min-h-[calc(100svh-4rem)] md:pb-28"
          : cn(alto, "items-center py-24"),
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1600px]",
          lado === "derecha" ? "justify-end" : "justify-start",
        )}
      >
        <RevealBloque direccion={lado} duracion={0.9} className={TERCIO}>
          {children}
        </RevealBloque>
      </div>
    </div>
  );
}

/** Rótulo: versales con una raya delante. Sin fondo: va impreso sobre la toma. */
function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 etiqueta text-ash sobre-pelicula">
      <span aria-hidden className="h-px w-8 bg-current" />
      {children}
    </p>
  );
}

/** Primario: píldora llena de tinta. Sobre el estudio, blanca con letra oscura. */
function BotonLleno({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full bg-ash px-5 py-2.5 text-sm font-semibold text-void no-underline transition-opacity duration-300 hf:opacity-85"
    >
      {children}
      <CaretRight aria-hidden className="size-3.5" weight="bold" />
    </Link>
  );
}

/** Secundario: la misma píldora, solo el contorno. */
function BotonContorno({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-[color-mix(in_oklab,var(--ash)_55%,transparent)] px-5 py-2.5 text-sm font-semibold text-ash no-underline sobre-pelicula transition-colors duration-300 hf:border-ash"
    >
      {children}
    </Link>
  );
}

/**
 * La prueba del hero. Esta página vende landings, así que después de
 * prometer una lo primero que enseña es una: tres de las nueve secciones de
 * una campaña real, generadas con LandingForge. Sin tarjeta alrededor: las
 * piezas flotan sobre la toma como flota el frasco.
 */
function CampanaReal() {
  return (
    <div>
      <ul className="flex flex-col gap-2 md:items-end">
        {SERVICIOS.map((s, i) => (
          <li key={s}>
            <RevealBloque retraso={0.2 + i * 0.1} direccion="derecha">
              <span className="etiqueta text-ash sobre-pelicula">/ {s}</span>
            </RevealBloque>
          </li>
        ))}
      </ul>
      <div className="mt-7 grid grid-cols-3 gap-3">
        {MUESTRA.map((m, i) => (
          <RevealBloque key={m.src} retraso={0.3 + i * 0.12}>
            <div
              className={cn(
                "relative aspect-[9/16] overflow-hidden rounded-xl shadow-[0_24px_60px_-18px_rgb(0_0_0/0.85)]",
                /* La del medio un poco más alta: la misma jerarquía que la
                   sección de precios pide a su tarjeta central. */
                i === 1 && "-translate-y-4",
              )}
            >
              <Image
                src={m.src}
                alt={m.alt}
                fill
                sizes="(max-width: 768px) 30vw, 12vw"
                className="object-cover object-top"
              />
            </div>
          </RevealBloque>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 md:justify-end">
        <p className="text-sm text-ash sobre-pelicula">
          <span className="font-semibold">Una campaña real.</span> 3 de sus 9 secciones.
        </p>
        <BotonLleno href="/app/nueva">Crear la mía</BotonLleno>
      </div>
    </div>
  );
}

/** Filas numeradas, separadas por un filete. Sin caja: impresas sobre la toma. */
function Filas({
  filas,
  enlace,
  ordenada = false,
}: {
  filas: { titulo: string; texto: string }[];
  /** Si las filas llevan a algún sitio, llevan flecha; si no, no la fingen. */
  enlace?: string;
  ordenada?: boolean;
}) {
  const Lista = ordenada ? "ol" : "ul";
  return (
    <Lista className="mt-6 border-t border-[color-mix(in_oklab,var(--ash)_22%,transparent)]">
      {filas.map((f, i) => {
        const contenido = (
          <>
            <span className="pt-1 font-mono text-[11px] tracking-[0.15em] text-ash tabular-nums sobre-pelicula">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-base font-semibold text-ash sobre-pelicula lg:text-[1.0625rem]">
                {f.titulo}
                {enlace && (
                  <CaretRight
                    aria-hidden
                    className="size-4 transition-transform duration-300 group-hover:translate-x-0.5"
                  />
                )}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-ash sobre-pelicula lg:text-[0.9375rem]">
                {f.texto}
              </span>
            </span>
          </>
        );
        return (
          <li
            key={f.titulo}
            className="border-b border-[color-mix(in_oklab,var(--ash)_22%,transparent)]"
          >
            <RevealBloque retraso={0.3 + i * 0.11}>
              {enlace ? (
                <Link href={enlace} className="group flex gap-5 py-3.5 no-underline">
                  {contenido}
                </Link>
              ) : (
                <div className="flex gap-5 py-3.5">{contenido}</div>
              )}
            </RevealBloque>
          </li>
        );
      })}
    </Lista>
  );
}
