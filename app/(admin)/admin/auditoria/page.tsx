import type { Metadata } from "next";
import Link from "next/link";
import { DownloadSimple, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { repositorioAdmin } from "@/lib/datos/admin-sqlite";
import { esquemaFiltroAuditoria } from "@/lib/esquemas-admin";
import { fechaCorta } from "@/lib/formato";
import { ETIQUETA_ACCION, describirDetalle } from "@/lib/etiquetas-admin";
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

export const metadata: Metadata = { title: "Auditoría" };
export const dynamic = "force-dynamic";

/**
 * F-A5 · Bitácora.
 *
 * Es un libro de contabilidad, no un CRUD: en todo el proyecto no hay un solo
 * UPDATE ni DELETE sobre la tabla `auditoria`. Un registro que se puede
 * corregir no sirve para lo único que sirve un registro, que es responder a
 * la pregunta de quién hizo qué cuando ya nadie se acuerda.
 *
 * Por eso tampoco hay acción de «limpiar» ni de «archivar» en esta pantalla.
 */

const OPCIONES_ACCION = [
  { valor: "", texto: "Todas las acciones" },
  { valor: "usuario.plan", texto: "Cambio de plan" },
  { valor: "usuario.creditos", texto: "Ajuste de créditos" },
  { valor: "usuario.rol", texto: "Cambio de rol" },
  { valor: "usuario.borrado", texto: "Cuenta borrada" },
  { valor: "campana.borrada", texto: "Campaña borrada" },
];

const TONO_ACCION = {
  "usuario.plan": "neutro",
  "usuario.creditos": "metal",
  "usuario.rol": "maquina",
  "usuario.borrado": "peligro",
  "campana.borrada": "peligro",
} as const;

export default async function PaginaAuditoria({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const crudos = await searchParams;
  const planos = Object.fromEntries(
    Object.entries(crudos).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

  const analisis = esquemaFiltroAuditoria.safeParse(planos);
  const filtro = analisis.success ? analisis.data : {};

  const { filas, total, pagina, porPagina } = await repositorioAdmin().listarAuditoria(filtro);

  /* El CSV recibe los mismos filtros que la tabla: lo que se exporta es
     exactamente lo que se está mirando, no la tabla entera. */
  const parametrosCsv = new URLSearchParams();
  if (filtro.accion) parametrosCsv.set("accion", filtro.accion);
  if (filtro.desde) parametrosCsv.set("desde", filtro.desde);
  if (filtro.hasta) parametrosCsv.set("hasta", filtro.hasta);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 pt-20 sm:px-8 lg:pt-8">
      <Encabezado
        titulo="Auditoría"
        descripcion="Toda acción del panel que cambia algo queda aquí. Este registro no se puede editar ni borrar desde ninguna parte de la aplicación."
      >
        <Boton asChild variante="contorno" tamano="sm">
          <a href={`/api/admin/auditoria?${parametrosCsv.toString()}`}>
            <DownloadSimple className="size-4" />
            Exportar CSV
          </a>
        </Boton>
      </Encabezado>

      <BarraFiltros>
        <CampoFiltro etiqueta="Acción">
          <SelectFiltro
            name="accion"
            defaultValue={filtro.accion ?? ""}
            opciones={OPCIONES_ACCION}
          />
        </CampoFiltro>
        <CampoFiltro etiqueta="Desde">
          <EntradaFiltro type="date" name="desde" defaultValue={filtro.desde ?? ""} />
        </CampoFiltro>
        <CampoFiltro etiqueta="Hasta">
          <EntradaFiltro type="date" name="hasta" defaultValue={filtro.hasta ?? ""} />
        </CampoFiltro>
        <Boton type="submit" variante="contorno" tamano="md">
          <MagnifyingGlass className="size-4" />
          Filtrar
        </Boton>
      </BarraFiltros>

      <div className="mt-8">
        {filas.length === 0 ? (
          <EstadoVacio
            titulo="No hay ninguna acción registrada con estos filtros."
            detalle="Si el panel es nuevo, esto es lo esperado: la bitácora empieza vacía y se llena sola."
          />
        ) : (
          <>
            <Tabla
              descripcion="Acciones administrativas con actor, objetivo, detalle y origen."
              cabeceras={["Fecha", "Actor", "Acción", "Objetivo", "Detalle", "IP"]}
              ancho="min-w-[960px]"
            >
              {filas.map((e) => (
                <Fila key={e.id}>
                  {/* La píldora y la fecha no se parten: un `rounded-full` de
                      altura fija con el texto en dos líneas se desborda de su
                      propio borde. */}
                  <Celda mono className="whitespace-nowrap">
                    {fechaCorta(e.fecha)}
                  </Celda>
                  <Celda>
                    {e.actorId ? (
                      <Link
                        href={`/admin/usuarios/${e.actorId}`}
                        className="text-[var(--quench)] no-underline hf:underline"
                      >
                        {e.actorEmail}
                      </Link>
                    ) : (
                      <span className="mono-sm text-slag">{e.actorEmail}</span>
                    )}
                  </Celda>
                  <Celda>
                    <Badge tono={TONO_ACCION[e.accion]} className="whitespace-nowrap">
                      {ETIQUETA_ACCION[e.accion]}
                    </Badge>
                  </Celda>
                  <Celda className="text-ash">
                    {e.objetivoEtiqueta}
                    <span className="block mono-sm text-slag">{e.objetivoTipo}</span>
                  </Celda>
                  <Celda mono>{describirDetalle(e.accion, e.detalle)}</Celda>
                  <Celda mono>{e.ip}</Celda>
                </Fila>
              ))}
            </Tabla>

            <Paginador
              total={total}
              pagina={pagina}
              porPagina={porPagina}
              nombre="acciones"
              parametros={{
                accion: filtro.accion,
                desde: filtro.desde,
                hasta: filtro.hasta,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
