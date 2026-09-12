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
  ANCHO,
  Banda,
  Celda,
  Cifra,
  Cifras,
  EstadoVacio,
  Fila,
  Seccion,
  Tabla,
} from "@/components/panel/piezas";
import { cn } from "@/lib/utils";
import { traductor } from "@/lib/i18n/servidor";

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
  const t = await traductor();
  const calidad = await repositorioAdmin().calidad();

  const porcentaje = (n: number) =>
    calidad.promptsTotales === 0 ? 0 : Math.round((n / calidad.promptsTotales) * 100);

  /* Solo se dibujan las tipologías que existen en los datos: una fila entera
     de ceros ocupa el mismo sitio que una con información y no dice nada. */
  const filas = TIPOLOGIAS.filter((t) => (calidad.promptsPorTipologia[t] ?? 0) > 0);
  const columnas = calidad.porRegla.map((r) => r.regla);

  const banda = (
    <Banda
      fotograma="/secuencia/0330.jpg"
      encuadre="56% 50%"
      alto="media"
      rotulo={t("Administración")}
      titulo={t("Calidad de la metodología")}
      descripcion={t("El validador corre sobre cada prompt que se genera. Esto es lo que ha encontrado en toda la plataforma: qué reglas se incumplen, en qué secciones y con qué tendencia.")}
    />
  );

  if (calidad.promptsTotales === 0) {
    return (
      <>
        {banda}
        <div className={cn(ANCHO, "mt-10")}>
          <EstadoVacio
            titulo={t("Todavía no hay ningún prompt generado en la plataforma.")}
            detalle="Esta pantalla se llena sola en cuanto la primera campaña produzca prompts."
          />
        </div>
      </>
    );
  }

  return (
    <>
      {banda}

      <div className={cn(ANCHO, "mt-10 flex flex-col gap-16")}>
        <Cifras className="lg:grid-cols-3">
          <Cifra t={t} etiqueta={t("Prompts analizados")} valor={calidad.promptsTotales} />
          <Cifra t={t}
            etiqueta={t("Sin ninguna advertencia")}
            valor={calidad.promptsLimpios}
            nota={`${porcentaje(calidad.promptsLimpios)}% del total`}
          />
          <Cifra t={t}
            etiqueta={t("Con bloqueo")}
            valor={calidad.promptsConBloqueo}
            nota={`${porcentaje(calidad.promptsConBloqueo)}% no puede generar imagen`}
            tono="calor"
          />
        </Cifras>

        <Seccion
          titulo={t("Incumplimientos por regla")}
          descripcion={t("«Prompts afectados» cuenta cada prompt una sola vez por regla, aunque la incumpla en varios sitios. «Ocurrencias» las cuenta todas: la distancia entre las dos columnas dice si el problema está repartido o concentrado.")}
        >
          <Tabla
            descripcion={t("Reglas del validador ordenadas por número de prompts afectados.")}
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
                  {numero(r.promptsAfectados, t.idioma)}
                </Celda>
                <Celda mono className="tabular-nums">
                  {porcentaje(r.promptsAfectados)}%
                </Celda>
                <Celda mono className="tabular-nums">
                  {numero(r.ocurrencias, t.idioma)}
                </Celda>
              </Fila>
            ))}
          </Tabla>
        </Seccion>

        <Seccion
          titulo={t("Dónde falla cada regla")}
          descripcion={t("La cifra es el número de prompts afectados; la intensidad del color es la proporción sobre los prompts de esa misma tipología, para que una sección con pocas campañas no parezca sana solo por tener menos casos. Una columna encendida entera señala a la regla; una fila encendida entera, al constructor de esa tipología.")}
        >
          {filas.length === 0 ? (
            <EstadoVacio titulo={t("Todavía no hay suficientes secciones distintas para cruzar.")} />
          ) : (
            <MapaDeCalor
              filas={filas}
              columnas={columnas}
              valor={(f, c) => calidad.matriz[f]?.[c as ReglaAdvertencia] ?? 0}
              totalFila={(f) => calidad.promptsPorTipologia[f] ?? 0}
              etiquetaFila={(f) => ETIQUETA_TIPOLOGIA[f as TipologiaSeccion]}
              etiquetaColumna={(c) => ETIQUETA_REGLA_CORTA[c as ReglaAdvertencia]}
            />
          )}
        </Seccion>

        <div className="grid gap-x-14 gap-y-16 lg:grid-cols-2">
          <Seccion
            titulo={t("Tendencia del bloqueo")}
            descripcion={t("Porcentaje de los prompts de cada día que salieron con al menos un bloqueo. Subir aquí significa que la metodología está produciendo peor, no que los usuarios escriban peor.")}
          >
            <SerieTemporal
              t={t}
              titulo={t("Prompts con bloqueo por día")}
              puntos={calidad.bloqueoPorDia}
              color="var(--heat)"
              sufijo="%"
            />
          </Seccion>

          <Seccion
            titulo={t("Palabras de la lista negra")}
            descripcion={t("Las que más se cuelan en los prompts. Si una encabeza la lista mes tras mes, el sitio donde arreglarla es el constructor, no el aviso.")}
          >
            {calidad.palabrasProhibidas.length === 0 ? (
              <EstadoVacio titulo={t("Ninguna palabra de la lista negra ha aparecido todavía.")} />
            ) : (
              <ul className="flex flex-col gap-3">
                {calidad.palabrasProhibidas.map((p) => {
                  const maximo = calidad.palabrasProhibidas[0].veces;
                  return (
                    <li key={p.palabra} className="flex items-center gap-3">
                      <span className="mono-sm w-32 shrink-0 truncate text-smoke" title={p.palabra}>
                        {p.palabra}
                      </span>
                      <span className="h-1.5 min-w-0 flex-1 rounded-full bg-[var(--scale)]">
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
          </Seccion>
        </div>
      </div>
    </>
  );
}
