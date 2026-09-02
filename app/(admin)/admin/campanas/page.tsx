import type { Metadata } from "next";
import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { repositorioAdmin } from "@/lib/datos/admin-sqlite";
import { esquemaFiltroCampanas } from "@/lib/esquemas-admin";
import { fechaRelativa } from "@/lib/formato";
import { ETIQUETA_TIPOLOGIA, TIPOLOGIAS } from "@/lib/etiquetas-admin";
import { Boton } from "@/components/ui/boton";
import { Badge } from "@/components/ui/piezas";
import {
  BarraFiltros,
  CampoFiltro,
  Celda,
  Encabezado,
  EntradaFiltro,
  EstadoVacio,
  Fila,
  Paginador,
  SelectFiltro,
  Tabla,
} from "@/components/admin/piezas-admin";

export const metadata: Metadata = { title: "Campañas" };
export const dynamic = "force-dynamic";

/**
 * F-A3 · Inspector global de campañas.
 *
 * El filtro de tipología y el de bloqueos se resuelven dentro de SQL con
 * json_each, no recortando la página en memoria. Es la diferencia entre un
 * paginador que dice la verdad y uno que muestra «120 resultados» y luego
 * pinta cuatro filas.
 */

const OPCIONES_ESTADO = [
  { valor: "", texto: "Todos los estados" },
  { valor: "borrador", texto: "Borrador" },
  { valor: "generando", texto: "Generando" },
  { valor: "lista", texto: "Lista" },
  { valor: "error", texto: "Error" },
];

const OPCIONES_TIPOLOGIA = [
  { valor: "", texto: "Todas las secciones" },
  ...TIPOLOGIAS.map((t) => ({ valor: t, texto: ETIQUETA_TIPOLOGIA[t] })),
];

const TONO_ESTADO = {
  borrador: "neutro",
  generando: "metal",
  lista: "ok",
  error: "peligro",
} as const;

export default async function PaginaCampanas({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const crudos = await searchParams;
  const planos = Object.fromEntries(
    Object.entries(crudos).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

  const analisis = esquemaFiltroCampanas.safeParse(planos);
  const filtro = analisis.success ? analisis.data : {};

  const { filas, total, pagina, porPagina } = await repositorioAdmin().listarCampanas(filtro);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 pt-20 sm:px-8 lg:pt-8">
      <Encabezado
        titulo="Campañas"
        descripcion="Todas las campañas de la plataforma. Se pueden inspeccionar y, si hay abuso, borrar. No se pueden editar: el trabajo del cliente es suyo."
      />

      <BarraFiltros>
        <CampoFiltro etiqueta="Buscar">
          <EntradaFiltro
            type="search"
            name="busqueda"
            defaultValue={filtro.busqueda ?? ""}
            placeholder="nombre de campaña o correo"
          />
        </CampoFiltro>
        <CampoFiltro etiqueta="Estado">
          <SelectFiltro
            name="estado"
            defaultValue={filtro.estado ?? ""}
            opciones={OPCIONES_ESTADO}
          />
        </CampoFiltro>
        <CampoFiltro etiqueta="Sección">
          <SelectFiltro
            name="tipologia"
            defaultValue={filtro.tipologia ?? ""}
            opciones={OPCIONES_TIPOLOGIA}
          />
        </CampoFiltro>
        <label className="flex h-10 items-center gap-2 rounded-[10px] border border-[var(--scale)] px-3">
          <input
            type="checkbox"
            name="soloConBloqueo"
            value="true"
            defaultChecked={filtro.soloConBloqueo ?? false}
            className="size-4 accent-[var(--heat)]"
          />
          <span className="etiqueta text-smoke">Solo con bloqueo</span>
        </label>
        <Boton type="submit" variante="contorno" tamano="md">
          <MagnifyingGlass className="size-4" />
          Filtrar
        </Boton>
      </BarraFiltros>

      <div className="mt-8">
        {filas.length === 0 ? (
          <EstadoVacio
            titulo="Ninguna campaña coincide con estos filtros."
            detalle="Si acabas de marcar «solo con bloqueo», puede que sencillamente no haya ninguna. Eso es una buena noticia."
          />
        ) : (
          <>
            <Tabla
              descripcion="Campañas de la plataforma con dueño, estado y advertencias del validador."
              cabeceras={["Campaña", "Dueño", "Estado", "Prompts", "Bloqueos", "Avisos", "Actualizada", null]}
              ancho="min-w-[920px]"
            >
              {filas.map((c) => (
                <Fila key={c.id}>
                  <Celda className="text-ash">
                    {c.nombre}
                    <span className="block mono-sm text-slag">{c.productoNombre}</span>
                  </Celda>
                  <Celda>{c.usuarioEmail}</Celda>
                  <Celda>
                    <Badge tono={TONO_ESTADO[c.estado]}>{c.estado}</Badge>
                  </Celda>
                  <Celda mono className="tabular-nums">
                    {c.prompts}
                  </Celda>
                  <Celda
                    mono
                    className={c.bloqueos > 0 ? "tabular-nums text-[var(--danger)]" : "tabular-nums"}
                  >
                    {c.bloqueos}
                  </Celda>
                  <Celda mono className="tabular-nums">
                    {c.avisos}
                  </Celda>
                  <Celda mono>{fechaRelativa(c.actualizadaEn)}</Celda>
                  <Celda className="pr-0 text-right">
                    <Link
                      href={`/admin/campanas/${c.id}`}
                      className="etiqueta text-[var(--quench)] no-underline hf:underline"
                    >
                      Inspeccionar
                      <span className="sr-only"> la campaña {c.nombre}</span>
                    </Link>
                  </Celda>
                </Fila>
              ))}
            </Tabla>

            <Paginador
              total={total}
              pagina={pagina}
              porPagina={porPagina}
              nombre="campañas"
              parametros={{
                busqueda: filtro.busqueda,
                estado: filtro.estado,
                tipologia: filtro.tipologia,
                soloConBloqueo: filtro.soloConBloqueo ? "true" : undefined,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
