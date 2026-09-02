import * as React from "react";
import type { EstadoCampana, Plan, PuntoSerie } from "@/lib/datos/tipos";
import { numero } from "@/lib/formato";
import { cn } from "@/lib/utils";

/**
 * Gráficas del panel — SVG en línea, sin librería.
 *
 * Reglas que se siguen aquí, y por qué:
 *
 * - **Nunca dos escalas en un mismo eje.** Altas de usuarios y campañas
 *   nuevas se dibujan en dos gráficas separadas, no superpuestas con dos ejes
 *   verticales, que es la forma más común de mentir con una gráfica.
 * - **Los planes son ordinales**, no categorías sueltas: semilla, estudio y
 *   agencia están ordenados. Por eso llevan la rampa `--forged` de un solo
 *   tono claro→oscuro y no tres colores distintos. Además es lo que manda el
 *   sistema: el color aquí significa estado del trabajo, y nada más.
 * - **Los estados de campaña usan la paleta de estado ya existente**, y
 *   siempre con etiqueta al lado: nunca se codifica solo con color.
 * - **El texto lleva tokens de texto**, nunca el color de la serie.
 * - Cada gráfica va acompañada de una tabla `sr-only` con los mismos datos,
 *   porque una forma dibujada no es legible con lector de pantalla.
 */

/* ---------------------------------------------------------------- */
/* Serie temporal                                                    */
/* ---------------------------------------------------------------- */

const ANCHO = 320;
const ALTO = 90;
const MARGEN = 3;

function rutaDeSerie(puntos: PuntoSerie[], maximo: number) {
  const paso = puntos.length > 1 ? (ANCHO - MARGEN * 2) / (puntos.length - 1) : 0;
  const escala = (v: number) =>
    ALTO - MARGEN - (maximo === 0 ? 0 : (v / maximo) * (ALTO - MARGEN * 2));

  const coordenadas = puntos.map((p, i) => ({
    x: MARGEN + i * paso,
    y: escala(p.valor),
  }));

  const linea = coordenadas
    .map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(" ");

  const primera = coordenadas[0];
  const ultima = coordenadas[coordenadas.length - 1];
  const area = `${linea} L${ultima.x.toFixed(2)} ${ALTO} L${primera.x.toFixed(2)} ${ALTO} Z`;

  return { linea, area, coordenadas, paso };
}

export function SerieTemporal({
  titulo,
  puntos,
  color = "var(--quench)",
  sufijo = "",
}: {
  titulo: string;
  puntos: PuntoSerie[];
  /** Un único tono por gráfica: no hay varias series que distinguir. */
  color?: string;
  /** Se añade al valor en el tooltip. Para porcentajes, «%». */
  sufijo?: string;
}) {
  const maximo = Math.max(1, ...puntos.map((p) => p.valor));
  const { linea, area, coordenadas, paso } = rutaDeSerie(puntos, maximo);
  const total = puntos.reduce((s, p) => s + p.valor, 0);
  const idGradiente = React.useId();

  return (
    <figure className="m-0">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="etiqueta text-smoke">{titulo}</span>
        <span className="mono-sm text-slag">
          {sufijo === "%" ? `pico ${maximo}%` : `${numero(total)} en 30 días`}
        </span>
      </figcaption>

      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="mt-3 w-full h-auto overflow-visible"
        role="img"
        aria-label={`${titulo}. Serie de ${puntos.length} días, máximo ${maximo}${sufijo}.`}
      >
        <defs>
          <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Línea de base recesiva: orienta sin competir con los datos. */}
        <line
          x1="0"
          y1={ALTO - 0.5}
          x2={ANCHO}
          y2={ALTO - 0.5}
          stroke="var(--scale)"
          strokeWidth="1"
        />

        <path d={area} fill={`url(#${idGradiente})`} />
        <path
          d={linea}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Último punto marcado: es el dato que se lee primero. */}
        {coordenadas.length > 0 && (
          <circle
            cx={coordenadas[coordenadas.length - 1].x}
            cy={coordenadas[coordenadas.length - 1].y}
            r="3"
            fill={color}
            stroke="var(--anvil)"
            strokeWidth="2"
          />
        )}

        {/* Zonas de contacto para el tooltip nativo. Son más anchas que la
            marca, así que se pueden apuntar sin precisión de cirujano. */}
        {coordenadas.map((c, i) => (
          <rect
            key={puntos[i].fecha}
            x={c.x - paso / 2}
            y={0}
            width={Math.max(paso, 6)}
            height={ALTO}
            fill="transparent"
          >
            <title>{`${puntos[i].fecha}: ${numero(puntos[i].valor)}${sufijo}`}</title>
          </rect>
        ))}
      </svg>

      {/* La misma serie, legible con lector de pantalla. */}
      <table className="sr-only">
        <caption>{titulo}</caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Valor</th>
          </tr>
        </thead>
        <tbody>
          {puntos.map((p) => (
            <tr key={p.fecha}>
              <td>{p.fecha}</td>
              <td>
                {p.valor}
                {sufijo}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/* ---------------------------------------------------------------- */
/* Reparto por plan — barra apilada de una sola fila                 */
/* ---------------------------------------------------------------- */

/* Rampa de un solo tono, de menor a mayor plan. Los planes están ordenados,
   así que se codifican con luminosidad y no con tonos distintos. */
const TONO_PLAN: Record<Plan, string> = {
  semilla: "var(--forged-lo)",
  estudio: "var(--forged)",
  agencia: "var(--forged-hi)",
};

const NOMBRE_PLAN: Record<Plan, string> = {
  semilla: "Semilla",
  estudio: "Estudio",
  agencia: "Agencia",
};

export function RepartoPorPlan({ reparto }: { reparto: Record<Plan, number> }) {
  const orden: Plan[] = ["semilla", "estudio", "agencia"];
  const total = orden.reduce((s, p) => s + reparto[p], 0);

  if (total === 0) {
    return <p className="cuerpo text-slag">Todavía no hay cuentas que repartir.</p>;
  }

  return (
    <figure className="m-0">
      {/* gap-[2px] es el separador de superficie entre segmentos: sin él,
          dos tramos contiguos de la misma rampa se leen como uno solo. */}
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full">
        {orden.map((p) =>
          reparto[p] === 0 ? null : (
            <div
              key={p}
              title={`${NOMBRE_PLAN[p]}: ${reparto[p]}`}
              style={{ width: `${(reparto[p] / total) * 100}%`, background: TONO_PLAN[p] }}
              className="h-full first:rounded-l-full last:rounded-r-full"
            />
          ),
        )}
      </div>

      {/* Leyenda con cifra directa: la identidad nunca depende del color. */}
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {orden.map((p) => (
          <li key={p} className="flex items-center gap-2">
            <span
              aria-hidden
              style={{ background: TONO_PLAN[p] }}
              className="size-2.5 shrink-0 rounded-full"
            />
            <span className="etiqueta text-smoke">{NOMBRE_PLAN[p]}</span>
            <span className="mono-sm text-slag tabular-nums">
              {reparto[p]} · {Math.round((reparto[p] / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/* ---------------------------------------------------------------- */
/* Estados de campaña — paleta de estado, con etiqueta siempre        */
/* ---------------------------------------------------------------- */

const TONO_ESTADO: Record<EstadoCampana, string> = {
  /* `--heat` significa «en proceso» en todo el producto: generando es
     literalmente eso. No es una elección de gusto, es la regla del sistema. */
  generando: "var(--heat)",
  lista: "var(--forged)",
  error: "var(--danger)",
  borrador: "var(--slag)",
};

const NOMBRE_ESTADO: Record<EstadoCampana, string> = {
  borrador: "Borrador",
  generando: "Generando",
  lista: "Lista",
  error: "Error",
};

export function EstadosDeCampana({
  porEstado,
}: {
  porEstado: Record<EstadoCampana, number>;
}) {
  const orden: EstadoCampana[] = ["lista", "generando", "borrador", "error"];
  const maximo = Math.max(1, ...orden.map((e) => porEstado[e]));

  return (
    <ul className="flex flex-col gap-3">
      {orden.map((e) => (
        <li key={e} className="flex items-center gap-3">
          <span className="etiqueta w-20 shrink-0 text-smoke">{NOMBRE_ESTADO[e]}</span>
          <span className="h-2 min-w-0 flex-1 rounded-full bg-[var(--anvil-hi)]">
            <span
              style={{
                width: `${(porEstado[e] / maximo) * 100}%`,
                background: TONO_ESTADO[e],
              }}
              className="block h-full rounded-full"
            />
          </span>
          <span className="mono-sm w-10 shrink-0 text-right text-slag tabular-nums">
            {porEstado[e]}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------- */
/* Mapa de calor — magnitud con un solo tono                         */
/* ---------------------------------------------------------------- */

export function MapaDeCalor({
  filas,
  columnas,
  valor,
  totalFila,
  etiquetaFila,
  etiquetaColumna,
}: {
  filas: string[];
  columnas: string[];
  valor: (fila: string, columna: string) => number;
  /** Prompts totales de esa fila. La intensidad es una tasa, no un conteo. */
  totalFila: (fila: string) => number;
  etiquetaFila: (fila: string) => string;
  etiquetaColumna: (columna: string) => string;
}) {
  /* La intensidad se calcula sobre el total de la propia fila, no sobre el
     máximo de la tabla. Dos razones:

     1. Las filas no son comparables en bruto. Una tipología con 100 prompts y
        50 incumplimientos está mejor que una con 2 prompts y 2, y el conteo
        diría lo contrario.
     2. Con pocos datos, el máximo de la tabla vale 1 y entonces cada celda
        con un solo caso se pinta al máximo. La tabla entera se vuelve roja el
        primer día y deja de significar nada. */
  const INTENSIDAD_MAXIMA = 0.62;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-[2px]">
        <caption className="sr-only">
          Prompts afectados por cada regla, desglosados por tipología de sección.
        </caption>
        <thead>
          <tr>
            <th scope="col" className="etiqueta w-32 text-left font-medium text-slag">
              Tipología
            </th>
            {columnas.map((c) => (
              <th
                key={c}
                scope="col"
                className="etiqueta px-1 pb-2 text-center font-medium text-slag align-bottom"
              >
                {etiquetaColumna(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f}>
              <th scope="row" className="etiqueta pr-3 text-left font-medium text-smoke">
                {etiquetaFila(f)}
              </th>
              {columnas.map((c) => {
                const n = valor(f, c);
                const total = Math.max(1, totalFila(f));
                const tasa = n / total;
                /* Un solo tono, de la superficie a `--heat`. Cero se deja sin
                   tinta en vez de en el primer paso, para que «ninguno» y
                   «uno de muchos» no se confundan a simple vista. */
                const intensidad = n === 0 ? 0 : 0.1 + tasa * (INTENSIDAD_MAXIMA - 0.1);
                return (
                  <td
                    key={c}
                    style={{
                      background:
                        n === 0
                          ? "var(--sunk)"
                          : `color-mix(in oklab, var(--heat) ${Math.round(intensidad * 100)}%, var(--sunk))`,
                    }}
                    className={cn(
                      "h-9 rounded-[6px] text-center mono-sm tabular-nums",
                      n === 0 ? "text-[var(--scale-hi)]" : "text-ash",
                    )}
                  >
                    <span
                      title={`${etiquetaFila(f)} · ${etiquetaColumna(c)}: ${n} de ${total} prompts (${Math.round(tasa * 100)}%)`}
                    >
                      {n === 0 ? "·" : n}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
