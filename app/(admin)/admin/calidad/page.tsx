import type { Metadata } from "next";
import { repositorioAdmin } from "@/lib/datos";
import { numero } from "@/lib/formato";
import {
  ETIQUETA_REGLA,
  ETIQUETA_REGLA_CORTA,
  ETIQUETA_TIPOLOGIA,
  TIPOLOGIAS,
} from "@/lib/etiquetas-admin";
import type { ReglaAdvertencia, TipologiaSeccion } from "@/lib/datos/tipos";
import { Badge } from "@/components/ui/piezas";
import { MapaDeCalor, SerieTemporal } from "@/components/admin/graficas";
import {
  Celda,
  Cifra,
  Encabezado,
  EstadoVacio,
  Fila,
  Panel,
  Tabla,
} from "@/components/admin/piezas-admin";

export const metadata: Metadata = { title: "Calidad" };
export const dynamic = "force-dynamic";

/**
 * F-A4 · Calidad de la metodología.
 *
 * El README del proyecto dice que el activo no es el modelo generativo sino
 * la metodología. Esta es la única pantalla que mide ese activo: si una regla
 * empieza a dispararse en todas las campañas, o una tipología concreta falla
 * más que el resto, el problema está en el constructor de prompts, no en los
 * usuarios. Sin esta vista, esa degradación solo se descubre por queja.
 */
export default async function PaginaCalidad() {
  const calidad = await repositorioAdmin().calidad();

  const porcentaje = (n: number) =>
    calidad.promptsTotales === 0 ? 0 : Math.round((n / calidad.promptsTotales) * 100);

  /* Solo se dibujan las tipologías que existen en los datos: una fila entera
     de ceros ocupa el mismo sitio que una con información y no dice nada. */
  const filas = TIPOLOGIAS.filter((t) => (calidad.promptsPorTipologia[t] ?? 0) > 0);
  const columnas = calidad.porRegla.map((r) => r.regla);

  if (calidad.promptsTotales === 0) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-8 pt-20 sm:px-8 lg:pt-8">
        <Encabezado
          titulo="Calidad de la metodología"
          descripcion="Qué reglas del validador se incumplen, dónde y con qué tendencia."
        />
        <div className="mt-10">
          <EstadoVacio
            titulo="Todavía no hay ningún prompt generado en la plataforma."
            detalle="Esta pantalla se llena sola en cuanto la primera campaña produzca prompts."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 pt-20 sm:px-8 lg:pt-8">
      <Encabezado
        titulo="Calidad de la metodología"
        descripcion="El validador corre sobre cada prompt que se genera. Esto es lo que ha encontrado en toda la plataforma: qué reglas se incumplen, en qué secciones y con qué tendencia."
      />

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <Cifra etiqueta="Prompts analizados" valor={calidad.promptsTotales} />
        <Cifra
          etiqueta="Sin ninguna advertencia"
          valor={calidad.promptsLimpios}
          nota={`${porcentaje(calidad.promptsLimpios)}% del total`}
        />
        <Cifra
          etiqueta="Con bloqueo"
          valor={calidad.promptsConBloqueo}
          nota={`${porcentaje(calidad.promptsConBloqueo)}% no puede generar imagen`}
          tono="calor"
        />
      </div>

      {/* --------------------- Por regla --------------------- */}
      <Panel titulo="Incumplimientos por regla" className="mt-4">
        <p className="-mt-2 mb-5 cuerpo text-slag medida">
          «Prompts afectados» cuenta cada prompt una sola vez por regla, aunque la incumpla
          en varios sitios. «Ocurrencias» las cuenta todas: la distancia entre las dos
          columnas dice si el problema está repartido o concentrado.
        </p>
        <Tabla
          descripcion="Reglas del validador ordenadas por número de prompts afectados."
          cabeceras={["Regla", "Severidad", "Prompts afectados", "% del total", "Ocurrencias"]}
        >
          {calidad.porRegla.map((r) => (
            <Fila key={r.regla}>
              <Celda className="text-ash">{ETIQUETA_REGLA[r.regla]}</Celda>
              <Celda>
                <Badge tono={r.severidad === "bloqueo" ? "peligro" : "aviso"}>
                  {r.severidad}
                </Badge>
              </Celda>
              <Celda mono className="tabular-nums">
                {numero(r.promptsAfectados)}
              </Celda>
              <Celda mono className="tabular-nums">
                {porcentaje(r.promptsAfectados)}%
              </Celda>
              <Celda mono className="tabular-nums">
                {numero(r.ocurrencias)}
              </Celda>
            </Fila>
          ))}
        </Tabla>
      </Panel>

      {/* ------------------- Matriz ------------------- */}
      <Panel titulo="Dónde falla cada regla" className="mt-4">
        <p className="-mt-2 mb-5 cuerpo text-slag medida">
          La cifra es el número de prompts afectados; la intensidad del color es la
          proporción sobre los prompts de esa misma tipología, para que una sección con
          pocas campañas no parezca sana solo por tener menos casos. Una columna encendida
          entera señala a la regla; una fila encendida entera, al constructor de esa
          tipología.
        </p>
        {filas.length === 0 ? (
          <EstadoVacio titulo="Todavía no hay suficientes secciones distintas para cruzar." />
        ) : (
          <MapaDeCalor
            filas={filas}
            columnas={columnas}
            valor={(f, c) =>
              calidad.matriz[f]?.[c as ReglaAdvertencia] ?? 0
            }
            totalFila={(f) => calidad.promptsPorTipologia[f] ?? 0}
            etiquetaFila={(f) => ETIQUETA_TIPOLOGIA[f as TipologiaSeccion]}
            etiquetaColumna={(c) => ETIQUETA_REGLA_CORTA[c as ReglaAdvertencia]}
          />
        )}
      </Panel>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* --------------- Tendencia --------------- */}
        <Panel titulo="Tendencia del bloqueo">
          <p className="-mt-2 mb-5 cuerpo text-slag medida">
            Porcentaje de los prompts de cada día que salieron con al menos un bloqueo.
            Subir aquí significa que la metodología está produciendo peor, no que los
            usuarios escriban peor.
          </p>
          <SerieTemporal
            titulo="Prompts con bloqueo por día"
            puntos={calidad.bloqueoPorDia}
            color="var(--heat)"
            sufijo="%"
          />
        </Panel>

        {/* ------------ Palabras prohibidas ------------ */}
        <Panel titulo="Palabras de la lista negra">
          <p className="-mt-2 mb-5 cuerpo text-slag medida">
            Las que más se cuelan en los prompts. Cada una degrada la salida del modelo, y
            si una encabeza la lista mes tras mes, el sitio donde arreglarla es el
            constructor, no el aviso.
          </p>
          {calidad.palabrasProhibidas.length === 0 ? (
            <EstadoVacio titulo="Ninguna palabra de la lista negra ha aparecido todavía." />
          ) : (
            <ul className="flex flex-col gap-3">
              {calidad.palabrasProhibidas.map((p) => {
                const maximo = calidad.palabrasProhibidas[0].veces;
                return (
                  <li key={p.palabra} className="flex items-center gap-3">
                    <span className="mono-sm w-32 shrink-0 truncate text-smoke" title={p.palabra}>
                      {p.palabra}
                    </span>
                    <span className="h-2 min-w-0 flex-1 rounded-full bg-[var(--anvil-hi)]">
                      <span
                        style={{ width: `${(p.veces / maximo) * 100}%` }}
                        className="block h-full rounded-full bg-[var(--heat)]"
                      />
                    </span>
                    <span className="mono-sm w-8 shrink-0 text-right text-slag tabular-nums">
                      {p.veces}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
