import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirAdminEnPagina } from "@/lib/auth/admin";
import { repositorioAdmin } from "@/lib/datos";
import { consumoPorUso, esPorUso, plan as definicionPlan } from "@/lib/planes";
import { fechaCorta, fechaLarga, fechaRelativa } from "@/lib/formato";
import {
  ETIQUETA_ACCION,
  ETIQUETA_MOTIVO,
  describirDetalle,
} from "@/lib/etiquetas-admin";
import { Badge } from "@/components/ui/piezas";
import { AccionesUsuario } from "@/components/admin/acciones-usuario";
import {
  ANCHO,
  Banda,
  Celda,
  Cifra,
  Cifras,
  EnlaceFila,
  EstadoVacio,
  Fila,
  Seccion,
  Tabla,
} from "@/components/panel/piezas";
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
    <>
      <Banda
        fotograma="/secuencia-crema/0200.jpg"
        encuadre="64% 50%"
        alto="media"
        compacto
        volver={{ href: "/admin/usuarios", texto: "Volver a usuarios" }}
        rotulo="Ficha de usuario"
        titulo={usuario.email}
        descripcion={
          <span className="mono-sm">
            alta el {fechaLarga(usuario.creadoEn)} · renueva el {fechaLarga(usuario.renuevaEn)} ·{" "}
            {usuario.id}
          </span>
        }
      >
        <Badge tono="metal">plan {def.nombre}</Badge>
        {usuario.rol === "admin" && <Badge tono="maquina">administrador</Badge>}
        {usuario.id === admin.id && <Badge tono="neutro">eres tú</Badge>}
      </Banda>

      <div className={cn(ANCHO, "mt-10 flex flex-col gap-16")}>
        <Cifras>
          <Cifra
            etiqueta={esPorUso(usuario.plan) ? "Secciones del ciclo" : "Créditos"}
            valor={
              esPorUso(usuario.plan)
                ? consumoPorUso(usuario.creditosDisponibles)
                : usuario.creditosDisponibles
            }
            nota={esPorUso(usuario.plan) ? "plan por uso, sin cupo" : `de ${def.creditosMes} del plan`}
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
        </Cifras>

        <AccionesUsuario usuario={usuario} esYoMismo={usuario.id === admin.id} />

        <Seccion titulo="Campañas de esta cuenta">
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
                    <EnlaceFila href={`/admin/campanas/${c.id}`}>Inspeccionar</EnlaceFila>
                  </Celda>
                </Fila>
              ))}
            </Tabla>
          )}
        </Seccion>

        <Seccion titulo="Movimientos de crédito">
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
        </Seccion>

        <Seccion
          titulo="Auditoría relacionada"
          descripcion="Lo que el equipo ha hecho sobre esta cuenta, y lo que esta cuenta ha hecho sobre otras si tiene rol de administrador."
        >
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
        </Seccion>
      </div>
    </>
  );
}
