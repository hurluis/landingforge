import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { exigirAdminEnPagina } from "@/lib/auth/admin";
import { repositorioAdmin } from "@/lib/datos/admin-sqlite";
import { plan as definicionPlan } from "@/lib/planes";
import { fechaCorta, fechaLarga, fechaRelativa } from "@/lib/formato";
import {
  ETIQUETA_ACCION,
  ETIQUETA_MOTIVO,
  describirDetalle,
} from "@/lib/etiquetas-admin";
import { Badge } from "@/components/ui/piezas";
import { AccionesUsuario } from "@/components/admin/acciones-usuario";
import {
  Celda,
  Cifra,
  EstadoVacio,
  Fila,
  Panel,
  Tabla,
} from "@/components/admin/piezas-admin";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ficha de usuario" };
export const dynamic = "force-dynamic";

/**
 * F-A2 · Ficha de un usuario.
 *
 * Reúne en una sola lectura lo que hace falta para resolver un caso de
 * soporte: qué plan tiene, cuánto le queda, qué ha producido, en qué se le
 * fueron los créditos y qué le ha hecho el equipo a su cuenta.
 *
 * Esa última tabla es la que importa: el usuario y el administrador ven la
 * misma historia, y ninguna de las dos versiones se puede editar.
 */
export default async function PaginaFichaUsuario({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, admin] = await Promise.all([params, exigirAdminEnPagina()]);
  const ficha = await repositorioAdmin().fichaUsuario(id);
  if (!ficha) notFound();

  const { usuario, campanas, movimientos, auditoria } = ficha;
  const def = definicionPlan(usuario.plan);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 pt-20 sm:px-8 lg:pt-8">
      <Link
        href="/admin/usuarios"
        className="inline-flex items-center gap-2 etiqueta text-slag no-underline hf:text-ash"
      >
        <ArrowLeft className="size-4" />
        Volver a usuarios
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="display-md break-all">{usuario.email}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tono="metal">plan {def.nombre}</Badge>
            {usuario.rol === "admin" && <Badge tono="maquina">administrador</Badge>}
            {usuario.id === admin.id && <Badge tono="neutro">eres tú</Badge>}
          </div>
        </div>
        <dl className="mono-sm text-slag">
          <div className="flex gap-2">
            <dt>id</dt>
            <dd className="text-smoke">{usuario.id}</dd>
          </div>
          <div className="mt-1 flex gap-2">
            <dt>alta</dt>
            <dd className="text-smoke">{fechaLarga(usuario.creadoEn)}</dd>
          </div>
          <div className="mt-1 flex gap-2">
            <dt>renueva</dt>
            <dd className="text-smoke">{fechaLarga(usuario.renuevaEn)}</dd>
          </div>
        </dl>
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra
          etiqueta="Créditos"
          valor={usuario.creditosDisponibles}
          nota={`de ${def.creditosMes} del plan`}
          tono="calor"
        />
        <Cifra etiqueta="Campañas" valor={usuario.campanas} />
        <Cifra etiqueta="Prompts" valor={usuario.prompts} />
        <Cifra
          etiqueta="Créditos consumidos"
          valor={usuario.creditosConsumidos}
          nota={
            usuario.ultimaActividad
              ? `última actividad ${fechaRelativa(usuario.ultimaActividad)}`
              : "sin actividad todavía"
          }
        />
      </div>

      <div className="mt-8">
        <AccionesUsuario usuario={usuario} esYoMismo={usuario.id === admin.id} />
      </div>

      {/* ---------------------- Campañas ---------------------- */}
      <Panel titulo="Campañas de esta cuenta" className="mt-4">
        {campanas.length === 0 ? (
          <EstadoVacio titulo="Esta cuenta todavía no ha creado ninguna campaña." />
        ) : (
          <Tabla
            descripcion="Campañas de esta cuenta con estado y número de prompts."
            cabeceras={["Nombre", "Producto", "Estado", "Prompts", "Actualizada", null]}
          >
            {campanas.map((c) => (
              <Fila key={c.id}>
                <Celda className="text-ash">{c.nombre}</Celda>
                <Celda>{c.producto.nombre}</Celda>
                <Celda mono>{c.estado}</Celda>
                <Celda mono className="tabular-nums">
                  {c.prompts.length}
                </Celda>
                <Celda mono>{fechaCorta(c.actualizadaEn)}</Celda>
                <Celda className="pr-0 text-right">
                  <Link
                    href={`/admin/campanas?busqueda=${encodeURIComponent(c.nombre)}`}
                    className="etiqueta text-[var(--quench)] no-underline hf:underline"
                  >
                    Inspeccionar
                  </Link>
                </Celda>
              </Fila>
            ))}
          </Tabla>
        )}
      </Panel>

      {/* ---------------------- Créditos ---------------------- */}
      <Panel titulo="Movimientos de crédito" className="mt-4">
        {movimientos.length === 0 ? (
          <EstadoVacio titulo="Sin movimientos registrados en esta cuenta." />
        ) : (
          <Tabla
            descripcion="Historial de consumo y recarga de créditos."
            cabeceras={["Fecha", "Concepto", "Referencia", "Créditos"]}
          >
            {movimientos.map((m) => (
              <Fila key={m.id}>
                <Celda mono>{fechaCorta(m.fecha)}</Celda>
                <Celda>{ETIQUETA_MOTIVO[m.motivo]}</Celda>
                <Celda>{m.campanaNombre}</Celda>
                <Celda
                  mono
                  className={cn(
                    "pr-0 text-right tabular-nums",
                    m.delta < 0 ? "text-smoke" : "text-[var(--ok)]",
                  )}
                >
                  {m.delta > 0 ? `+${m.delta}` : m.delta}
                </Celda>
              </Fila>
            ))}
          </Tabla>
        )}
      </Panel>

      {/* ---------------------- Auditoría ---------------------- */}
      <Panel titulo="Auditoría relacionada" className="mt-4">
        <p className="-mt-2 mb-5 cuerpo text-slag medida">
          Lo que el equipo ha hecho sobre esta cuenta, y lo que esta cuenta ha hecho sobre
          otras si tiene rol de administrador.
        </p>
        {auditoria.length === 0 ? (
          <EstadoVacio titulo="Nadie ha tocado esta cuenta desde el panel." />
        ) : (
          <Tabla
            descripcion="Acciones administrativas relacionadas con esta cuenta."
            cabeceras={["Fecha", "Actor", "Acción", "Detalle"]}
          >
            {auditoria.map((e) => (
              <Fila key={e.id}>
                <Celda mono>{fechaCorta(e.fecha)}</Celda>
                <Celda>{e.actorEmail}</Celda>
                <Celda className="text-ash">{ETIQUETA_ACCION[e.accion]}</Celda>
                <Celda mono>{describirDetalle(e.accion, e.detalle)}</Celda>
              </Fila>
            ))}
          </Tabla>
        )}
      </Panel>
    </div>
  );
}
