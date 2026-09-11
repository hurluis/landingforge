import Image from "next/image";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { RevealBloque, RevealLineas } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/**
 * LA APERTURA · seis tramos sobre la toma de producto, alternando lado.
 *
 * Cada tramo es un solo bloque, a la izquierda o a la derecha, y el siguiente
 * no entra hasta que el anterior se va: primero la afirmación a la izquierda,
 * luego su prueba a la derecha, y así en zigzag. La versión anterior ponía
 * cuatro bloques en las cuatro esquinas de cada pantalla y aparecían a la vez:
 * el ojo no sabía por dónde empezar. De uno en uno se lee en orden, y entre
 * bloque y bloque la película se queda sola.
 *
 * Los tramos van por parejas, y cada pareja es una sección con su titular: el
 * hero y una campaña real; lo que las plantillas no saben y lo que sí sabe la
 * metodología; lo que te llevas y los pasos para llevártelo.
 *
 * Cada tramo cae sobre un acto de la toma. `Pelicula` reparte los 415
 * fotogramas sobre la zona entera, así que la altura de los tramos decide en
 * qué fotograma está la cámara cuando cada bloque llega al centro:
 *
 *   estudio    el hero                        el frasco en su pedestal
 *   despegue   una campaña real               el frasco se levanta
 *   vuelo      las plantillas venden igual    da vueltas en el aire
 *   marca      lo que ninguna plantilla sabe  primer plano de la etiqueta
 *   flotacion  te llevas los prompts          la cámara se abre
 *   mano       once minutos, tres pasos       el frasco, en la mano
 *
 * El vuelo es el acto más largo y su tramo es el más alto; la marca, el más
 * corto. Si cambia una altura el cruce se desplaza, y
 * `scripts/verificar-apertura.mjs` comprueba que cada tramo cae en su acto.
 */

const X = "px-5 sm:px-8 md:px-12";

const SERVICIOS = ["Las nueve secciones", "Metodología colombiana", "Prompts que son tuyos"];

const MUESTRA = [
  { src: "/secciones/hero.png", alt: "Sección hero de una campaña real de suplemento" },
  { src: "/secciones/beneficios.png", alt: "Sección de beneficios de la misma campaña" },
  { src: "/secciones/testimonios.png", alt: "Sección de testimonios de la misma campaña" },
];

const METODO = [
  {
    titulo: "Contraentrega",
    texto: "La señal de confianza número uno del país: se paga cuando el producto está en la mano.",
  },
  {
    titulo: "INVIMA",
    texto: "En suplementos y cosmética, el registro separa parecer un negocio de parecer un riesgo.",
  },
  {
    titulo: "Caras de aquí",
    texto: "Paisa, costeña, rola, afro, rasgos indígenas. A su suerte, el modelo devuelve un latino genérico.",
  },
  {
    titulo: "Formato y lenguaje",
    texto: "$99.900 con punto de miles. 3.412 clientes, no +3.000. Reseñas de alguien real.",
  },
];

const PASOS = [
  {
    titulo: "Cuéntale sobre tu producto",
    texto: "Subes la foto y respondes cuatro preguntas: qué es, para quién, qué promete y cuánto cuesta.",
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
          <div className="halo max-w-[44rem]">
            <RevealBloque retraso={0.15}>
              <Insignia>3.412 campañas generadas</Insignia>
            </RevealBloque>
            <RevealLineas
              as="h1"
              id="hero-titulo"
              retraso={0.28}
              className="mt-5 display-xl apertura-titular text-ash sobre-pelicula"
              lineas={["Tu producto no se", "parece a ningún otro.", "Tu landing tampoco", "debería."]}
            />
            <RevealBloque retraso={0.55}>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-ash sobre-pelicula sm:text-xl">
                Sube la foto. LandingForge arma las nueve secciones que venden en Colombia. Sin
                plantillas.
              </p>
            </RevealBloque>
            <RevealBloque retraso={0.68} className="mt-8 flex flex-wrap gap-3">
              <BotonClaro href="/app/nueva">Crear mi primera landing</BotonClaro>
              <BotonCristal href="#tira-titulo">Ver las nueve secciones</BotonCristal>
            </RevealBloque>
          </div>
        </Tramo>

        <Tramo acto="despegue" lado="derecha" alto="min-h-[110svh]">
          <CampanaReal />
        </Tramo>
      </section>

      {/* ── La metodología ──────────────────────────────────────────── */}
      <section id="metodo" aria-labelledby="metodo-titulo">
        <Tramo acto="vuelo" lado="izquierda" alto="min-h-[130svh]">
          <div className="halo max-w-[44rem]">
            <Insignia>La metodología colombiana</Insignia>
            <RevealLineas
              as="h2"
              id="metodo-titulo"
              retraso={0.18}
              className="mt-5 display-xl apertura-subtitular text-ash sobre-pelicula"
              lineas={["Las plantillas venden", "lo mismo diez mil veces."]}
            />
            <RevealBloque retraso={0.4}>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-ash sobre-pelicula">
                Un constructor de plantillas te da la misma estructura que a tus competidores, con
                imágenes de stock o caras generadas que se notan a un kilómetro.
              </p>
            </RevealBloque>
          </div>
        </Tramo>

        <Tramo acto="marca" lado="derecha">
          <Panel
            intro={
              <>
                Ninguna plantilla sabe que aquí la venta se cierra con contraentrega, ni que un
                precio escrito <span className="mono-sm">$99,900</span> le dice a tu comprador que
                no eres de aquí.
              </>
            }
            filas={METODO}
            enlace="/metodologia"
            columnas
          />
        </Tramo>
      </section>

      {/* ── Lo que te llevas ────────────────────────────────────────── */}
      <section id="llevas" aria-labelledby="llevas-titulo">
        <Tramo acto="flotacion" lado="izquierda">
          <div className="halo max-w-[44rem]">
            <RevealLineas
              as="h2"
              id="llevas-titulo"
              retraso={0.12}
              className="display-xl apertura-subtitular text-ash sobre-pelicula"
              lineas={["Te llevas los prompts,", "no solo las imágenes."]}
            />
            <RevealBloque retraso={0.35}>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-ash sobre-pelicula">
                Cada prompt se puede reescribir, versionar y volver a correr. La campaña es tuya
                desde el primer minuto.
              </p>
            </RevealBloque>
            <RevealBloque retraso={0.48}>
              <p className="mt-5 max-w-md border-l-2 border-ash pl-4 text-lg font-bold leading-snug text-ash sobre-pelicula">
                Si mañana dejas de usar LandingForge, tu trabajo sigue siendo tuyo.
              </p>
            </RevealBloque>
          </div>
        </Tramo>

        <Tramo acto="mano" lado="derecha" alto="min-h-[110svh]">
          <Panel titulo="Once minutos, tres pasos" filas={PASOS} ordenada>
            <BotonClaro href="/app/nueva">Empezar ahora</BotonClaro>
            <BotonCristal href="/precios">Ver precios</BotonCristal>
          </Panel>
        </Tramo>
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- */

/**
 * Un tramo: una fila de al menos una pantalla con un solo bloque, pegado a su
 * lado y centrado en vertical, que entra deslizándose desde ese mismo lado.
 * El primero es la primera pantalla y apoya el bloque abajo, como el hero de
 * la referencia.
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
        /* overflow-x-clip: el halo sobresale 52 px por cada lado del bloque, y
           en móvil los bloques ya van a todo el ancho; sin recortar, la página
           ganaba scroll horizontal. `clip` y no `hidden`: no crea un
           contenedor de scroll. */
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
        <RevealBloque direccion={lado} duracion={0.9} className="w-full md:w-auto">
          {children}
        </RevealBloque>
      </div>
    </div>
  );
}

/** Rótulo con acento a la izquierda. */
function Insignia({ children }: { children: React.ReactNode }) {
  return (
    /* Fondo de cristal, no plano: en móvil el rótulo cae sobre el frasco
       blanco, y un chip claro sobre blanco dejaba la letra en 4,4:1. */
    <span className="inline-flex border-l-2 border-ash bg-[color-mix(in_oklab,var(--void)_48%,transparent)] px-3 py-1.5 backdrop-blur-md etiqueta text-[11px] text-ash">
      {children}
    </span>
  );
}

/** Primario: píldora de tinta llena. Sobre el estudio, blanca con letra oscura. */
function BotonClaro({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full bg-ash px-5 py-2.5 text-sm font-bold text-void no-underline transition-opacity duration-300 hf:opacity-85"
    >
      {children}
      <CaretRight aria-hidden className="size-3.5" weight="bold" />
    </Link>
  );
}

/** Secundario: la misma píldora en cristal. */
function BotonCristal({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="cristal inline-flex items-center rounded-full px-5 py-2.5 text-sm font-bold text-ash no-underline transition-[filter] duration-300 hf:brightness-125"
    >
      {children}
    </Link>
  );
}

/**
 * La prueba del hero. Esta página vende landings, así que después de
 * prometer una lo primero que enseña es una: tres de las nueve secciones de
 * una campaña real, generadas con LandingForge.
 */
function CampanaReal() {
  return (
    <div className="w-full md:w-[27rem]">
      <ul className="halo mb-6 flex flex-col gap-2 md:items-end">
        {SERVICIOS.map((s, i) => (
          <li key={s}>
            <RevealBloque retraso={0.2 + i * 0.1} direccion="derecha">
              <span className="etiqueta text-ash sobre-pelicula">/ {s}</span>
            </RevealBloque>
          </li>
        ))}
      </ul>
      <div className="cristal rounded-2xl p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2.5">
          {MUESTRA.map((m, i) => (
            <RevealBloque key={m.src} retraso={0.3 + i * 0.1}>
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                <Image
                  src={m.src}
                  alt={m.alt}
                  fill
                  sizes="(max-width: 768px) 30vw, 140px"
                  className="object-cover object-top"
                />
              </div>
            </RevealBloque>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3 px-1">
          <div>
            <p className="text-base font-bold text-ash">Una campaña real</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-ash/90">
              3 de sus 9 secciones · suplemento
            </p>
          </div>
          <Link
            href="/app/nueva"
            className="inline-flex items-center gap-1 rounded-full bg-ash px-4 py-2 text-xs font-bold text-void no-underline transition-opacity duration-300 hf:opacity-85"
          >
            Crear la mía
            <CaretRight aria-hidden className="size-3.5" weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Panel de cristal con filas numeradas. */
function Panel({
  titulo,
  intro,
  filas,
  enlace,
  ordenada = false,
  columnas = false,
  children,
}: {
  titulo?: string;
  intro?: React.ReactNode;
  filas: { titulo: string; texto: string }[];
  /** Si las filas llevan a algún sitio, llevan flecha; si no, no la fingen. */
  enlace?: string;
  ordenada?: boolean;
  /* Dos columnas desde md. Con la introducción y cuatro filas en una sola
     columna el panel medía más que una pantalla de 720 px, y el tramo se
     metía debajo del botón del asistente. A dos columnas mide la mitad. */
  columnas?: boolean;
  /** Botones al pie del panel. */
  children?: React.ReactNode;
}) {
  const Lista = ordenada ? "ol" : "ul";
  return (
    <div
      className={cn(
        "cristal w-full rounded-2xl px-5 pt-6 sm:px-6",
        columnas ? "md:w-[40rem]" : "md:w-[28rem]",
      )}
    >
      {titulo && <p className="etiqueta text-ash">{titulo}</p>}
      {intro && <p className="text-base leading-relaxed text-ash sm:text-lg">{intro}</p>}
      <Lista className={cn("mt-2", columnas && "md:grid md:grid-cols-2 md:gap-x-8")}>
        {filas.map((f, i) => {
          const contenido = (
            <>
              <span className="font-mono text-[11px] tracking-[0.15em] text-ash/85 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 text-base font-bold text-ash sm:text-lg">
                  {f.titulo}
                  {enlace && (
                    <CaretRight
                      aria-hidden
                      className="size-4 text-ash/50 transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:text-ash"
                    />
                  )}
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-ash/90">{f.texto}</span>
              </span>
            </>
          );
          return (
            <li
              key={f.titulo}
              className={cn(
                "border-b border-[color-mix(in_oklab,var(--ash)_15%,transparent)] last:border-b-0",
                /* A dos columnas, la fila de abajo tampoco lleva filete. */
                columnas && "md:[&:nth-last-child(2)]:border-b-0",
              )}
            >
              <RevealBloque retraso={0.3 + i * 0.11}>
                {enlace ? (
                  <Link href={enlace} className="group flex gap-5 py-5 no-underline">
                    {contenido}
                  </Link>
                ) : (
                  <div className="flex gap-5 py-5">{contenido}</div>
                )}
              </RevealBloque>
            </li>
          );
        })}
      </Lista>
      {children && (
        <div className="flex flex-wrap gap-3 border-t border-[color-mix(in_oklab,var(--ash)_15%,transparent)] py-5">
          {children}
        </div>
      )}
      {!children && <div className="pb-1" />}
    </div>
  );
}
