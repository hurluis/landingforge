import type { Metadata } from "next";
import Link from "next/link";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { repositorioAdmin } from "@/lib/datos";
import { esquemaFiltroUsuarios } from "@/lib/esquemas-admin";
import { plan as definicionPlan } from "@/lib/planes";
import { fechaCorta, fechaRelativa } from "@/lib/formato";
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

export const metadata: Metadata = { title: "Usuarios" };
export const dynamic = "force-dynamic";

/**
 * F-A2 · Lista de usuarios.
 *
 * Los filtros llegan por la barra de direcciones, así que se validan con zod
 * igual que si vinieran de un formulario: cualquiera puede escribir
 * `?pagina=-4&plan=gratis` a mano. Lo que no pasa la validación se descarta
 * en silencio y la lista se muestra sin ese filtro, en vez de reventar con un
 * error que no le dice nada a nadie.
 */

const OPCIONES_PLAN = [
  { valor: "", texto: "Todos los planes" },
  { valor: "semilla", texto: "Semilla" },
  { valor: "estudio", texto: "Estudio" },
  { valor: "agencia", texto: "Agencia" },
];

const OPCIONES_ROL = [
  { valor: "", texto: "Todos los roles" },
  { valor: "usuario", texto: "Usuario" },
  { valor: "admin", texto: "Administrador" },
];

const OPCIONES_ORDEN = [
  { valor: "reciente", texto: "Más recientes" },
  { valor: "antiguo", texto: "Más antiguos" },
  { valor: "creditos", texto: "Más créditos" },
  { valor: "campanas", texto: "Más campañas" },
];

export default async function PaginaUsuarios({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const crudos = await searchParams;
  const planos = Object.fromEntries(
    Object.entries(crudos).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
  );

  const analisis = esquemaFiltroUsuarios.safeParse(planos);
  const filtro = analisis.success ? analisis.data : {};

  const { filas, total, pagina, porPagina } = await repositorioAdmin().listarUsuarios(filtro);

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-8 pt-20 sm:px-8 lg:pt-8">
      <Encabezado
        titulo="Usuarios"
        descripcion="Todas las cuentas de la plataforma, con lo que cada una ha producido y consumido."
      />

      <BarraFiltros>
        <CampoFiltro etiqueta="Buscar por correo">
          <EntradaFiltro
            type="search"
            name="busqueda"
            defaultValue={filtro.busqueda ?? ""}
            placeholder="ana@ejemplo.com"
          />
        </CampoFiltro>
        <CampoFiltro etiqueta="Plan">
          <SelectFiltro name="plan" defaultValue={filtro.plan ?? ""} opciones={OPCIONES_PLAN} />
        </CampoFiltro>
        <CampoFiltro etiqueta="Rol">
          <SelectFiltro name="rol" defaultValue={filtro.rol ?? ""} opciones={OPCIONES_ROL} />
        </CampoFiltro>
        <CampoFiltro etiqueta="Orden">
          <SelectFiltro
            name="orden"
            defaultValue={filtro.orden ?? "reciente"}
            opciones={OPCIONES_ORDEN}
          />
        </CampoFiltro>
        <Boton type="submit" variante="contorno" tamano="md">
          <MagnifyingGlass className="size-4" />
          Filtrar
        </Boton>
      </BarraFiltros>

      <div className="mt-8">
        {filas.length === 0 ? (
          <EstadoVacio
            titulo="Ninguna cuenta coincide con estos filtros."
            detalle="Prueba a limpiar la búsqueda o a quitar el filtro de plan."
          />
        ) : (
          <>
            <Tabla
              descripcion="Cuentas de la plataforma con plan, rol, saldo y actividad."
              cabeceras={["Correo", "Plan", "Rol", "Créditos", "Campañas", "Prompts", "Actividad", null]}
            >
              {filas.map((u) => (
                <Fila key={u.id}>
                  <Celda className="text-ash">{u.email}</Celda>
                  <Celda>{definicionPlan(u.plan).nombre}</Celda>
                  <Celda>
                    {u.rol === "admin" ? (
                      <Badge tono="maquina">admin</Badge>
                    ) : (
                      <span className="mono-sm text-slag">usuario</span>
                    )}
                  </Celda>
                  <Celda mono className="tabular-nums">
                    {u.creditosDisponibles}
                  </Celda>
                  <Celda mono className="tabular-nums">
                    {u.campanas}
                  </Celda>
                  <Celda mono className="tabular-nums">
                    {u.prompts}
                  </Celda>
                  <Celda mono>
                    {u.ultimaActividad ? fechaRelativa(u.ultimaActividad) : "—"}
                  </Celda>
                  <Celda className="pr-0 text-right">
                    <Link
                      href={`/admin/usuarios/${u.id}`}
                      className="etiqueta text-[var(--quench)] no-underline hf:underline"
                    >
                      Ver ficha
                      <span className="sr-only"> de {u.email}</span>
                    </Link>
                  </Celda>
                </Fila>
              ))}
            </Tabla>

            <Paginador
              total={total}
              pagina={pagina}
              porPagina={porPagina}
              nombre="usuarios"
              parametros={{
                busqueda: filtro.busqueda,
                plan: filtro.plan,
                rol: filtro.rol,
                orden: filtro.orden,
              }}
            />
          </>
        )}
      </div>

      <p className="mt-10 mono-sm text-slag">
        Datos al {fechaCorta(new Date().toISOString())}. La lista se calcula en cada carga.
      </p>
    </div>
  );
}
