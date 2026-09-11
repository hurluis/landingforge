import Image from "next/image";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { RevealBloque, RevealLineas } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

/**
 * LA APERTURA · tres capítulos sobre la toma de producto.
 *
 * Esquema editorial de la referencia (NovaAI): cada capítulo es una pantalla
 * con el contenido anclado a las esquinas —rótulos arriba a la izquierda,
 * contexto arriba a la derecha, titular abajo a la izquierda, cristal abajo a
 * la derecha— y el centro vacío, que es donde está el frasco. Entre capítulo y
 * capítulo, un pasillo de 80vh sin nada encima: ahí la película es lo único
 * que pasa.
 *
 * Lo que la referencia no tiene, y es el punto: los capítulos caen sobre los
 * actos de la toma. La zona mide 3 pantallas + 2 pasillos = 460vh, y
 * `Pelicula` reparte los 480 fotogramas sobre ella. Hecha la cuenta, cada
 * capítulo queda entero en pantalla justo cuando la cámara llega a su acto:
 *
 *   Estudio    (fotograma 0)    → el hero: el producto en su pedestal.
 *   La marca   (fotograma ~240) → la metodología: primer plano de la etiqueta.
 *   En la mano (fotograma 479)  → lo que te llevas; y la contraentrega, que se
 *                                  paga «cuando el producto está en la mano».
 *
 * Si cambia la altura de un capítulo o de un pasillo, el cruce se desplaza:
 * `scripts/verificar-apertura.mjs` comprueba que cada capítulo cae en su acto.
 */

const X = "px-5 sm:px-8 md:px-12";
const ANCHO = "mx-auto w-full max-w-[1600px]";
/* Abajo queda sitio para los botones flotantes —accesibilidad y asistente,
   de 24 a 72 px desde el borde— y para la línea de tiempo. */
const ABAJO = "pb-24 md:pb-28";

const SERVICIOS = ["Las nueve secciones", "Metodología colombiana", "Prompts que son tuyos"];

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
      {/* ── Capítulo 1 · Estudio ─────────────────────────────────────── */}
      <section
        aria-labelledby="hero-titulo"
        className={cn(
          /* overflow-x-clip: el halo sobresale 52 px por cada lado del bloque, y
             en móvil los bloques ya van a todo el ancho; sin recortar, la página
             ganaba 32 px de scroll horizontal. `clip` y no `hidden`: no crea un
             contenedor de scroll. */
          "relative flex min-h-[calc(100vh-4rem)] flex-col justify-between overflow-x-clip pt-8 sm:pt-12",
          "supports-[height:100svh]:min-h-[calc(100svh-4rem)]",
          X,
          ABAJO,
        )}
      >
        <div className={cn(ANCHO, "flex flex-col gap-8 sm:flex-row sm:justify-between")}>
          <ul className="halo flex flex-col gap-2">
            {SERVICIOS.map((s, i) => (
              <li key={s}>
                <RevealBloque retraso={0.15 + i * 0.12}>
                  <span className="etiqueta text-ash/90 sobre-pelicula">/ {s}</span>
                </RevealBloque>
              </li>
            ))}
          </ul>
          <RevealBloque retraso={0.3} className="halo max-w-xs sm:text-right">
            <p className="text-lg leading-relaxed text-ash sobre-pelicula sm:text-xl">
              Sube la foto. LandingForge arma las nueve secciones que venden en Colombia. Sin
              plantillas.
            </p>
          </RevealBloque>
        </div>

        <div
          className={cn(ANCHO, "flex flex-col gap-8 md:flex-row md:items-end md:justify-between")}
        >
          <div className="halo">
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
          </div>
          <RevealBloque retraso={0.42} className="shrink-0">
            <TarjetaCampana />
          </RevealBloque>
        </div>
      </section>

      <Pasillo />

      {/* ── Capítulo 2 · La marca ────────────────────────────────────── */}
      <Capitulo
        id="metodo"
        insignia="La metodología colombiana"
        lateral={
          <>
            Ninguna plantilla sabe que aquí la venta se cierra con contraentrega, ni que un precio
            escrito <span className="mono-sm">$99,900</span> le dice a tu comprador que no eres de
            aquí.
          </>
        }
        titulo={["Las plantillas venden", "lo mismo diez mil veces."]}
        cuerpo="Un constructor de plantillas te da la misma estructura que a tus competidores, con imágenes de stock o caras generadas que se notan a un kilómetro."
        primario={{ href: "/app/nueva", texto: "Crear mi primera landing" }}
        secundario={{ href: "#tira-titulo", texto: "Ver las nueve secciones" }}
        filas={METODO}
        enlaceFilas="/metodologia"
      />

      <Pasillo />

      {/* ── Capítulo 3 · En la mano ──────────────────────────────────── */}
      <Capitulo
        id="llevas"
        insignia="Once minutos, tres pasos"
        lateral="Si mañana dejas de usar LandingForge, tu trabajo sigue siendo tuyo."
        titulo={["Te llevas los prompts,", "no solo las imágenes."]}
        cuerpo="Cada prompt se puede reescribir, versionar y volver a correr. La campaña es tuya desde el primer minuto."
        primario={{ href: "/app/nueva", texto: "Empezar ahora" }}
        secundario={{ href: "/precios", texto: "Ver precios" }}
        filas={PASOS}
        ordenada
      />
    </div>
  );
}

/* ---------------------------------------------------------------- */

/** El tramo de 80vh donde solo pasa la película. */
function Pasillo() {
  return <div aria-hidden className="h-[80vh]" />;
}

function Capitulo({
  id,
  insignia,
  lateral,
  titulo,
  cuerpo,
  primario,
  secundario,
  filas,
  enlaceFilas,
  ordenada = false,
}: {
  id: string;
  insignia: string;
  lateral: React.ReactNode;
  titulo: string[];
  cuerpo: string;
  primario: { href: string; texto: string };
  secundario: { href: string; texto: string };
  filas: { titulo: string; texto: string }[];
  /** Si las filas llevan a algún sitio, llevan flecha; si no, no la fingen. */
  enlaceFilas?: string;
  ordenada?: boolean;
}) {
  const Lista = ordenada ? "ol" : "ul";
  return (
    <section
      id={id}
      aria-labelledby={`${id}-titulo`}
      className={cn(
        "relative flex min-h-screen flex-col justify-between overflow-x-clip pt-24 sm:pt-28",
        "supports-[height:100svh]:min-h-[100svh]",
        X,
        ABAJO,
      )}
    >
      <div className={cn(ANCHO, "flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between")}>
        <RevealBloque retraso={0.12}>
          <Insignia>{insignia}</Insignia>
        </RevealBloque>
        <RevealBloque retraso={0.22} className="halo max-w-sm sm:text-right">
          <p className="text-lg leading-relaxed text-ash sobre-pelicula sm:text-xl">{lateral}</p>
        </RevealBloque>
      </div>

      <div
        className={cn(
          ANCHO,
          "mt-16 flex flex-1 flex-col justify-end gap-12 md:flex-row md:items-end md:justify-between md:gap-16",
        )}
      >
        <div className="halo max-w-[48rem]">
          <RevealLineas
            as="h2"
            id={`${id}-titulo`}
            retraso={0.18}
            className="display-xl apertura-subtitular text-ash sobre-pelicula"
            lineas={titulo}
          />
          <RevealBloque retraso={0.32}>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ash/85 sobre-pelicula">
              {cuerpo}
            </p>
          </RevealBloque>
          <RevealBloque retraso={0.42} className="mt-8 flex flex-wrap gap-3">
            <BotonClaro href={primario.href}>{primario.texto}</BotonClaro>
            <BotonCristal href={secundario.href}>{secundario.texto}</BotonCristal>
          </RevealBloque>
        </div>

        <Lista className="cristal w-full max-w-md shrink-0 rounded-2xl px-5 sm:px-6">
          {filas.map((f, i) => {
            const contenido = (
              <>
                <span className="font-mono text-[11px] tracking-[0.15em] text-ash/60 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-base font-medium text-ash sm:text-lg">
                    {f.titulo}
                    {enlaceFilas && (
                      <CaretRight
                        aria-hidden
                        className="size-4 text-ash/45 transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:text-ash"
                      />
                    )}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-ash/75">
                    {f.texto}
                  </span>
                </span>
              </>
            );
            return (
              <li
                key={f.titulo}
                className="border-b border-[color-mix(in_oklab,var(--ash)_15%,transparent)] last:border-b-0"
              >
                <RevealBloque retraso={0.3 + i * 0.11}>
                  {enlaceFilas ? (
                    <Link href={enlaceFilas} className="group flex gap-5 py-5 no-underline">
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
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */

/** Rótulo con acento a la izquierda. */
function Insignia({ children }: { children: React.ReactNode }) {
  return (
    /* Fondo de cristal oscuro, no claro: en móvil el rótulo cae sobre el
       frasco blanco, y un chip claro sobre blanco dejaba la letra en 4,4:1. */
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
      className="inline-flex items-center gap-1.5 rounded-full bg-ash px-5 py-2.5 text-sm font-medium text-void no-underline transition-opacity duration-300 hf:opacity-85"
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
      className="cristal inline-flex items-center rounded-full px-5 py-2.5 text-sm text-ash no-underline transition-[filter] duration-300 hf:brightness-125"
    >
      {children}
    </Link>
  );
}

/**
 * La tarjeta de la esquina. En la referencia es la cara de una cofundadora;
 * aquí no hay una persona que poner sin inventarla, y lo que sí hay es mejor
 * argumento: una sección de campaña real, generada con LandingForge.
 */
function TarjetaCampana() {
  return (
    <div className="cristal flex items-center gap-4 rounded-xl p-3">
      <Image
        src="/secciones/hero.png"
        alt="Sección hero de una campaña real de suplemento, generada con LandingForge"
        width={80}
        height={96}
        sizes="80px"
        className="h-24 w-20 rounded-lg object-cover object-top"
        priority
      />
      <div className="flex flex-col gap-1.5 pr-2">
        <p className="text-sm font-medium text-ash">Una campaña real</p>
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ash/65">
          Sección hero · suplemento
        </p>
        <Link
          href="/app/nueva"
          className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-ash px-4 py-2 text-xs font-medium text-void no-underline transition-opacity duration-300 hf:opacity-85"
        >
          Crear la mía
          <CaretRight aria-hidden className="size-3.5" weight="bold" />
        </Link>
      </div>
    </div>
  );
}
