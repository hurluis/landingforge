import * as React from "react";
import Link from "next/link";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { numero } from "@/lib/formato";
import { cn } from "@/lib/utils";

/**
 * Piezas compartidas del panel.
 *
 * Todas son componentes de servidor: el panel es una herramienta de lectura y
 * casi nada aquí necesita estado en el cliente. Lo que sí lo necesita —los
 * diálogos de acción— vive en sus propios archivos con "use client", para que
 * el JavaScript que se envía al navegador sea exactamente el de las partes
 * que de verdad reaccionan.
 */

/* ---------------------------- Encabezado ---------------------------- */

export function Encabezado({
  titulo,
  descripcion,
  children,
}: {
  titulo: string;
  descripcion?: string;
  /** Acciones a la derecha: exportar, filtros rápidos. */
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display-md">{titulo}</h1>
        {descripcion && <p className="mt-2 cuerpo text-smoke medida">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

/* ------------------------------ Panel ------------------------------- */

export function Panel({
  titulo,
  pie,
  className,
  children,
}: {
  titulo?: string;
  pie?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  const idTitulo = React.useId();
  return (
    <section
      aria-labelledby={titulo ? idTitulo : undefined}
      className={cn(
        "rounded-[16px] border border-[var(--scale)] bg-[var(--anvil)] p-6",
        className,
      )}
    >
      {titulo && (
        <h2 id={idTitulo} className="titulo">
          {titulo}
        </h2>
      )}
      <div className={titulo ? "mt-5" : undefined}>{children}</div>
      {pie && <div className="mt-5 border-t border-[var(--scale)] pt-4">{pie}</div>}
    </section>
  );
}

/* ------------------------------ Cifra ------------------------------- */

/**
 * Una cifra sola, sin gráfica. Cuando el dato es un único número, dibujarlo
 * como barra no añade nada y le quita sitio a lo que sí lo necesita.
 */
export function Cifra({
  etiqueta,
  valor,
  nota,
  tono = "neutro",
}: {
  etiqueta: string;
  valor: number | string;
  nota?: string;
  tono?: "neutro" | "calor" | "temple";
}) {
  const color =
    tono === "calor" ? "text-[var(--heat)]" : tono === "temple" ? "text-[var(--quench)]" : "text-ash";

  return (
    <div className="rounded-[14px] border border-[var(--scale)] bg-[var(--anvil)] p-5">
      <p className="etiqueta text-slag">{etiqueta}</p>
      <p
        className={cn(
          "mt-3 font-[family-name:var(--font-display-serif)] text-[2.25rem] font-[300] leading-none tabular-nums",
          color,
        )}
      >
        {typeof valor === "number" ? numero(valor) : valor}
      </p>
      {nota && <p className="mt-2 mono-sm text-slag">{nota}</p>}
    </div>
  );
}

/* ------------------------------ Tabla ------------------------------- */

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
          <tr className="border-b border-[var(--scale)]">
            {cabeceras.map((c, i) => (
              <th
                key={c ?? `col-${i}`}
                scope="col"
                className={cn(
                  "etiqueta py-2 font-medium text-slag",
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
    <tr className="border-b border-[var(--scale)] transition-colors duration-[140ms] ease-[var(--ease-out)] hf:bg-[var(--anvil-hi)]">
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
    <td className={cn("py-3 pr-4", mono ? "mono-sm text-slag" : "cuerpo text-smoke", className)}>
      {children}
    </td>
  );
}

/* --------------------------- Estado vacío --------------------------- */

/**
 * Un estado vacío es una frase, no la palabra «Sin datos». Dice qué pasó y,
 * cuando aplica, qué hacer para que deje de estar vacío.
 */
export function EstadoVacio({ titulo, detalle }: { titulo: string; detalle?: string }) {
  return (
    <div className="rounded-[14px] border border-dashed border-[var(--scale)] px-6 py-12 text-center">
      <p className="cuerpo text-smoke">{titulo}</p>
      {detalle && <p className="mt-2 mono-sm text-slag">{detalle}</p>}
    </div>
  );
}

/* ---------------------------- Paginador ----------------------------- */

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
}: {
  total: number;
  pagina: number;
  porPagina: number;
  /** Los filtros vigentes, para que paginar no los pierda. */
  parametros: Record<string, string | undefined>;
  /** Plural de lo que se está contando: «usuarios», «campañas». */
  nombre: string;
}) {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  if (total === 0) return null;

  const desde = (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);

  const enlace =
    "grid size-9 place-items-center rounded-[10px] border border-[var(--scale)] text-smoke no-underline transition-colors duration-[140ms] ease-[var(--ease-out)] hf:border-[var(--scale-hi)] hf:text-ash";
  const apagado = "grid size-9 place-items-center rounded-[10px] border border-[var(--scale)] text-[var(--scale-hi)]";

  return (
    <nav
      aria-label={`Paginación de ${nombre}`}
      className="mt-6 flex flex-wrap items-center justify-between gap-4"
    >
      <p className="mono-sm text-slag">
        {numero(desde)}–{numero(hasta)} de {numero(total)} {nombre}
      </p>
      <div className="flex items-center gap-2">
        {pagina > 1 ? (
          <Link href={conPagina(parametros, pagina - 1)} aria-label="Página anterior" className={enlace}>
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
          <Link href={conPagina(parametros, pagina + 1)} aria-label="Página siguiente" className={enlace}>
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

/* ----------------------------- Filtros ------------------------------ */

/**
 * Los filtros van en un `<form method="get">`: sin JavaScript, la URL queda
 * compartible y el botón de atrás del navegador funciona solo. Para una
 * herramienta interna eso vale más que el filtrado instantáneo.
 */
export function BarraFiltros({ children }: { children: React.ReactNode }) {
  return (
    <form method="get" className="mt-8 flex flex-wrap items-end gap-3">
      {children}
    </form>
  );
}

export function CampoFiltro({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="etiqueta text-slag">{etiqueta}</span>
      {children}
    </label>
  );
}

const CONTROL =
  "h-10 rounded-[10px] border border-[var(--scale)] bg-[var(--anvil)] px-3 text-[0.9375rem] text-ash transition-colors duration-[140ms] ease-[var(--ease-out)] hf:border-[var(--scale-hi)] focus:border-[var(--scale-hi)]";

export function EntradaFiltro(props: React.ComponentPropsWithoutRef<"input">) {
  return <input {...props} className={cn(CONTROL, "min-w-[200px]", props.className)} />;
}

export function SelectFiltro({
  opciones,
  ...props
}: React.ComponentPropsWithoutRef<"select"> & {
  opciones: { valor: string; texto: string }[];
}) {
  return (
    <select {...props} className={cn(CONTROL, "min-w-[150px]", props.className)}>
      {opciones.map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.texto}
        </option>
      ))}
    </select>
  );
}
