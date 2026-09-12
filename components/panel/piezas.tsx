import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { numero } from "@/lib/formato";
import { cn } from "@/lib/utils";
import type { Traductor } from "@/lib/i18n/idioma";

/**
 * Piezas del panel — las del usuario y las de administración.
 *
 * El panel es la misma casa que la home, no otra aplicación pegada detrás del
 * formulario de entrada. Por eso habla con los mismos materiales:
 *
 *   · Cada pantalla abre con un plano de la película, el mismo estudio y el
 *     mismo frasco, con el título impreso encima como en la apertura.
 *   · Nada va en tarjetas con borde. Las secciones se separan con un filete y
 *     con aire; las cifras, con líneas de un píxel, como una tabla impresa.
 *   · Rótulos en versales con raya delante, titulares en Outfit 600, cifras
 *     en la misma letra del titular.
 *
 * Todo es de servidor. Lo que necesita estado vive en sus propios archivos
 * con "use client", para que al navegador baje solo lo que reacciona.
 */

/** El ancho de trabajo de todas las pantallas del panel. */
export const ANCHO = "mx-auto w-full max-w-[1400px] px-5 sm:px-8";

const SOMBRA = "rgb(var(--pelicula-sombra)";

/* ------------------------------ Rótulo ------------------------------ */

export function Rotulo({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("flex items-center gap-3 etiqueta", className)}>
      <span aria-hidden className="h-px w-8 bg-current" />
      {children}
    </p>
  );
}

/* ------------------------------- Banda ------------------------------ */

/**
 * El plano que abre cada pantalla. Un fotograma de la película a todo el
 * ancho, oscurecido hacia la izquierda —donde va el título— y fundido abajo
 * con el fondo de la página, que es donde empieza el trabajo.
 *
 * Lleva la clase de la película: sobre papel se revela en clave alta, y sus
 * paños salen del mismo color que los del resto del sitio.
 */
export function Banda({
  fotograma,
  encuadre = "50% 45%",
  rotulo,
  titulo,
  descripcion,
  alto = "grande",
  compacto = false,
  volver,
  children,
}: {
  /** Ruta de un fotograma: `/secuencia/0001.jpg`, `/secuencia-crema/0120.jpg`. */
  fotograma: string;
  /** `object-position` del fotograma, para dejar el producto a la derecha. */
  encuadre?: string;
  rotulo?: string;
  titulo: React.ReactNode;
  descripcion?: React.ReactNode;
  alto?: "grande" | "media";
  /** Titular un paso más pequeño, para títulos largos que no son frase: un
      correo a tamaño display se partía en tres líneas a mitad de palabra. */
  compacto?: boolean;
  /** Enlace de vuelta, para las fichas que cuelgan de una lista. */
  volver?: { href: string; texto: string };
  /** Acciones a la derecha del título. */
  children?: React.ReactNode;
}) {
  return (
    <header className="relative isolate overflow-hidden bg-[rgb(var(--pelicula-sombra))]">
      <Image
        src={fotograma}
        alt=""
        fill
        priority
        sizes="100vw"
        className="pelicula-capa -z-10 object-cover"
        style={{ objectPosition: encuadre }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(90deg, ${SOMBRA} / 0.88) 0%, ${SOMBRA} / 0.6) 38%, transparent 72%), linear-gradient(180deg, ${SOMBRA} / 0.35) 0%, transparent 35%, transparent 55%, var(--void) 100%)`,
        }}
      />
      <div
        className={cn(
          ANCHO,
          "flex flex-wrap items-end justify-between gap-x-10 gap-y-6",
          alto === "grande" ? "min-h-[340px] pb-12 pt-20" : "min-h-[240px] pb-10 pt-16",
        )}
      >
        <div className="min-w-0 max-w-2xl">
          {volver && (
            <div className="mb-8">
              <Volver href={volver.href}>{volver.texto}</Volver>
            </div>
          )}
          {rotulo && <Rotulo className="text-ash sobre-pelicula">{rotulo}</Rotulo>}
          <h1
            className={cn(
              "mt-4 text-ash sobre-pelicula [overflow-wrap:anywhere]",
              compacto ? "display-md" : "display-lg",
            )}
          >
            {titulo}
          </h1>
          {descripcion && (
            <p className="mt-4 max-w-xl cuerpo-lg text-ash sobre-pelicula">{descripcion}</p>
          )}
        </div>
        {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </header>
  );
}

/* ------------------------------ Volver ------------------------------ */

export function Volver({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 etiqueta text-ash no-underline sobre-pelicula transition-opacity duration-[140ms] hf:opacity-70"
    >
      <ArrowLeft className="size-4" />
      {children}
    </Link>
  );
}

/* ------------------------------ Sección ----------------------------- */

/** Una sección de trabajo: filete arriba, título, y aire. Sin caja. */
export function Seccion({
  titulo,
  descripcion,
  acciones,
  className,
  children,
}: {
  titulo: string;
  descripcion?: React.ReactNode;
  acciones?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const id = React.useId();
  return (
    <section aria-labelledby={id} className={cn("border-t border-[var(--scale)] pt-8", className)}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 id={id} className="titulo">
            {titulo}
          </h2>
          {descripcion && <p className="mt-2 cuerpo text-smoke medida">{descripcion}</p>}
        </div>
        {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/* ------------------------------ Cifras ------------------------------ */

/**
 * Una fila de cifras sueltas, separadas por filetes de un píxel: el hueco de
 * la rejilla deja ver el color de la línea. Filete arriba y no abajo: debajo
 * siempre viene una sección, que trae el suyo, y dos seguidos leían doble. Cuando el dato es un único número,
 * dibujarlo como barra no añade lectura.
 */
export function Cifras({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-px border-t border-[var(--scale)] bg-[var(--scale)] lg:grid-cols-4",
        className,
      )}
    >
      {children}
    </dl>
  );
}

export function Cifra({
  etiqueta,
  valor,
  nota,
  tono = "neutro",
  t,
}: {
  etiqueta: string;
  valor: number | string;
  nota?: React.ReactNode;
  tono?: "neutro" | "calor" | "temple";
  /** Por prop, como en Paginador: esta pieza no puede pedir el traductor. */
  t: Traductor;
}) {
  const color =
    tono === "calor" ? "text-[var(--heat)]" : tono === "temple" ? "text-[var(--quench)]" : "text-ash";
  return (
    <div className="bg-[var(--void)] py-6 pr-4 sm:px-6 [&:nth-child(odd)]:pl-0 lg:[&:nth-child(odd)]:pl-6 lg:first:pl-0">
      <dt className="etiqueta text-slag">{etiqueta}</dt>
      <dd className="mt-3">
        <span
          className={cn(
            "block font-[family-name:var(--font-round)] text-[2.75rem] font-semibold leading-none tracking-[-0.035em] tabular-nums",
            color,
          )}
        >
          {typeof valor === "number" ? numero(valor, t.idioma) : valor}
        </span>
        {nota && <span className="mt-2.5 block mono-sm text-slag">{nota}</span>}
      </dd>
    </div>
  );
}

/* ------------------------------- Tabla ------------------------------ */

export function Tabla({
  cabeceras,
  children,
  descripcion,
  ancho = "min-w-[720px]",
}: {
  /** `null` para una columna sin título visible, como la de acciones. */
  cabeceras: (string | null)[];
  children: React.ReactNode;
  descripcion: string;
  /** Ancho mínimo antes de que la tabla empiece a desplazarse en horizontal. */
  ancho?: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-left", ancho)}>
        <caption className="sr-only">{descripcion}</caption>
        <thead>
          <tr className="border-b border-[var(--scale-hi)]">
            {cabeceras.map((c, i) => (
              <th
                key={c ?? `col-${i}`}
                scope="col"
                className={cn(
                  "etiqueta pb-3 pr-4 font-semibold text-slag",
                  i === cabeceras.length - 1 && c === null && "text-right",
                )}
              >
                {c ?? <span className="sr-only">Acciones</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Fila({ children }: { children: React.ReactNode }) {
  return (
    <tr className="border-b border-[var(--scale)] transition-colors duration-[140ms] ease-[var(--ease-out)] hf:bg-[color-mix(in_oklab,var(--ash)_4%,transparent)]">
      {children}
    </tr>
  );
}

export function Celda({
  children,
  mono,
  className,
}: {
  children: React.ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <td className={cn("py-4 pr-4 align-middle", mono ? "mono-sm text-slag" : "cuerpo text-smoke", className)}>
      {children}
    </td>
  );
}

/** El enlace de la última columna: «Ver ficha», «Inspeccionar». */
export function EnlaceFila({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 etiqueta text-ash no-underline transition-colors duration-[140ms] hf:text-[var(--heat)]"
    >
      {children}
      <CaretRight
        aria-hidden
        className="size-3.5 transition-transform duration-[140ms] group-hover:translate-x-0.5"
      />
    </Link>
  );
}

/* ---------------------------- Estado vacío -------------------------- */

/**
 * Un estado vacío es una frase, no la palabra «Sin datos». Dice qué pasó y,
 * cuando aplica, qué hacer para que deje de estar vacío.
 */
export function EstadoVacio({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <div className="border-y border-[var(--scale)] py-12">
      <p className="cuerpo-lg text-ash">{titulo}</p>
      {detalle && <p className="mt-2 cuerpo text-slag medida">{detalle}</p>}
    </div>
  );
}

/* ----------------------------- Paginador ---------------------------- */

function conPagina(parametros: Record<string, string | undefined>, pagina: number): string {
  const busqueda = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== "") busqueda.set(clave, valor);
  }
  busqueda.set("pagina", String(pagina));
  return `?${busqueda.toString()}`;
}

export function Paginador({
  total,
  pagina,
  porPagina,
  parametros,
  nombre,
  t,
}: {
  total: number;
  pagina: number;
  porPagina: number;
  /** Los filtros vigentes, para que paginar no los pierda. */
  parametros: Record<string, string | undefined>;
  /** Plural de lo que se está contando: «usuarios», «campañas». */
  nombre: string;
  /** Por prop: esta pieza la usan también componentes de cliente. */
  t: Traductor;
}) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (total === 0) return null;

  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);

  const enlace =
    "grid size-9 place-items-center rounded-full border border-[var(--scale-hi)] text-smoke no-underline transition-colors duration-[140ms] ease-[var(--ease-out)] hf:border-ash hf:text-ash";
  const apagado =
    "grid size-9 place-items-center rounded-full border border-[var(--scale)] text-[var(--scale-hi)]";

  return (
    <nav
      aria-label={`Paginación de ${nombre}`}
      className="mt-6 flex flex-wrap items-center justify-between gap-4"
    >
      <p className="mono-sm text-slag">
        {numero(desde, t.idioma)}–{numero(hasta, t.idioma)} de {numero(total, t.idioma)} {nombre}
      </p>
      <div className="flex items-center gap-2">
        {pagina > 1 ? (
          <Link href={conPagina(parametros, pagina - 1)} aria-label={t("Página anterior")} className={enlace}>
            <CaretLeft className="size-4" />
          </Link>
        ) : (
          <span aria-hidden className={apagado}>
            <CaretLeft className="size-4" />
          </span>
        )}
        <span className="mono-sm px-1 text-smoke tabular-nums">
          {pagina} / {paginas}
        </span>
        {pagina < paginas ? (
          <Link href={conPagina(parametros, pagina + 1)} aria-label={t("Página siguiente")} className={enlace}>
            <CaretRight className="size-4" />
          </Link>
        ) : (
          <span aria-hidden className={apagado}>
            <CaretRight className="size-4" />
          </span>
        )}
      </div>
    </nav>
  );
}

/* ------------------------------ Filtros ----------------------------- */

/**
 * Los filtros van en un `<form method="get">`: sin JavaScript, la URL queda
 * compartible y el botón de atrás del navegador funciona solo. Para una
 * herramienta interna eso vale más que el filtrado instantáneo.
 */
export function BarraFiltros({ children }: { children: React.ReactNode }) {
  return (
    <form method="get" className="flex flex-wrap items-end gap-3">
      {children}
    </form>
  );
}

export function CampoFiltro({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="etiqueta text-slag">{etiqueta}</span>
      {children}
    </label>
  );
}

const CONTROL =
  "h-10 rounded-full border border-[var(--scale-hi)] bg-transparent px-4 text-[0.9375rem] text-ash transition-colors duration-[140ms] ease-[var(--ease-out)] hf:border-ash focus:border-ash";

export function EntradaFiltro(props: React.ComponentPropsWithoutRef<"input">) {
  return <input {...props} className={cn(CONTROL, "min-w-[220px]", props.className)} />;
}

export function SelectFiltro({
  opciones,
  ...props
}: React.ComponentPropsWithoutRef<"select"> & {
  opciones: { valor: string; texto: string }[];
}) {
  return (
    <select {...props} className={cn(CONTROL, "min-w-[160px] bg-[var(--void)]", props.className)}>
      {opciones.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.texto}
        </option>
      ))}
    </select>
  );
}
