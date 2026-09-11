"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Usuario } from "@/lib/datos/tipos";
import { PLANES } from "@/lib/planes";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { Dialogo, DialogoContenido, DialogoCierre } from "@/components/ui/dialogo";
import { cn } from "@/lib/utils";

/**
 * Las acciones destructivas o sensibles sobre una cuenta.
 *
 * Es el único trozo de la ficha con "use client": el resto de la pantalla es
 * lectura y se renderiza en el servidor. Así el JavaScript que baja al
 * navegador es exactamente el de lo que reacciona.
 *
 * Ninguna de las salvaguardas vive aquí de verdad. Que un administrador no
 * pueda degradarse ni borrarse a sí mismo lo decide el servidor; lo que hace
 * esta pantalla es no ofrecer el botón, que es cortesía, no seguridad.
 */

type Respuesta = { error?: string; codigo?: string; usuario?: Usuario };

export function AccionesUsuario({
  usuario,
  esYoMismo,
}: {
  usuario: Usuario;
  /** El administrador está mirando su propia ficha. */
  esYoMismo: boolean;
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = React.useState<string | null>(null);

  const [plan, setPlan] = React.useState(usuario.plan);
  const [delta, setDelta] = React.useState("");
  const [motivo, setMotivo] = React.useState("");
  const [confirmacion, setConfirmacion] = React.useState("");
  const [abierto, setAbierto] = React.useState(false);

  async function pedir(cuerpo: unknown, etiqueta: string, exito: string) {
    setOcupado(etiqueta);
    try {
      const r = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const datos = (await r.json()) as Respuesta;
      if (!r.ok) throw new Error(datos.error ?? "No se pudo completar la acción.");
      toast.success(exito);
      router.refresh();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo completar la acción.");
      return false;
    } finally {
      setOcupado(null);
    }
  }

  async function ajustarCreditos(evento: React.FormEvent) {
    evento.preventDefault();
    const n = Number(delta);
    if (!Number.isInteger(n) || n === 0) {
      toast.error("El ajuste tiene que ser un número entero distinto de cero.");
      return;
    }
    const hecho = await pedir(
      { accion: "creditos", delta: n, motivo },
      "creditos",
      `${n > 0 ? "Añadidos" : "Retirados"} ${Math.abs(n)} créditos.`,
    );
    if (hecho) {
      setDelta("");
      setMotivo("");
    }
  }

  async function borrar() {
    setOcupado("borrar");
    try {
      const r = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmacion }),
      });
      const datos = (await r.json()) as Respuesta;
      if (!r.ok) throw new Error(datos.error ?? "No se pudo borrar la cuenta.");
      toast.success("Cuenta borrada.", { description: "Queda registrada en la auditoría." });
      setAbierto(false);
      router.replace("/admin/usuarios");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo borrar la cuenta.");
    } finally {
      setOcupado(null);
    }
  }

  /* Sin tarjeta: cada acción es una sección con su filete, como el resto
     del panel. La de borrar lleva el filete en rojo. */
  const marco = "border-t border-[var(--scale)] pt-6";

  return (
    <div className="grid gap-x-14 gap-y-12 lg:grid-cols-2">
      {/* ---------------- Plan ---------------- */}
      <section aria-labelledby="accion-plan" className={marco}>
        <h2 id="accion-plan" className="titulo">
          Plan
        </h2>
        <p className="mt-2 cuerpo text-smoke">
          Cambiar el plan recarga los créditos del mes y reinicia la fecha de renovación.
        </p>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="etiqueta text-slag">Nuevo plan</span>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as Usuario["plan"])}
              className="h-10 min-w-[160px] rounded-full border border-[var(--scale-hi)] bg-[var(--void)] px-4 text-[0.9375rem] text-ash"
            >
              {PLANES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </label>
          <Boton
            variante="contorno"
            cargando={ocupado === "plan"}
            textoCargando="Cambiando…"
            disabled={plan === usuario.plan}
            onClick={() => pedir({ accion: "plan", plan }, "plan", "Plan actualizado.")}
          >
            Aplicar plan
          </Boton>
        </div>
      </section>

      {/* -------------- Créditos -------------- */}
      <section aria-labelledby="accion-creditos" className={marco}>
        <h2 id="accion-creditos" className="titulo">
          Ajustar créditos
        </h2>
        <p className="mt-2 cuerpo text-smoke">
          Positivo suma, negativo resta. El motivo aparece en el historial que ve el propio
          usuario, así que escríbelo pensando en que él lo va a leer.
        </p>
        <form onSubmit={ajustarCreditos} className="mt-5 flex flex-col gap-4">
          <Campo
            id="delta-creditos"
            etiqueta="Créditos"
            type="number"
            inputMode="numeric"
            step={1}
            placeholder="-10 o 25"
            value={delta}
            onChange={(e) => setDelta(e.target.value)}
            required
          />
          <Campo
            id="motivo-ajuste"
            etiqueta="Motivo"
            placeholder="Compensación por generación fallida"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            minLength={4}
            maxLength={140}
            required
          />
          <Boton
            type="submit"
            variante="contorno"
            cargando={ocupado === "creditos"}
            textoCargando="Ajustando…"
            className="self-start"
          >
            Aplicar ajuste
          </Boton>
        </form>
      </section>

      {/* ---------------- Rol ---------------- */}
      <section aria-labelledby="accion-rol" className={marco}>
        <h2 id="accion-rol" className="titulo">
          Rol
        </h2>
        <p className="mt-2 cuerpo text-smoke">
          {esYoMismo
            ? "No puedes cambiarte el rol a ti mismo. Si necesitas dejar de ser administrador, pídeselo a otro."
            : usuario.rol === "admin"
              ? "Quitarle el rol le deja sin acceso al panel de inmediato: el rol se comprueba en cada petición, no al iniciar sesión."
              : "Darle el rol le abre el panel completo, incluida esta pantalla."}
        </p>
        <div className="mt-5">
          <Boton
            variante={usuario.rol === "admin" ? "peligro" : "contorno"}
            cargando={ocupado === "rol"}
            textoCargando="Cambiando…"
            disabled={esYoMismo}
            onClick={() =>
              pedir(
                { accion: "rol", rol: usuario.rol === "admin" ? "usuario" : "admin" },
                "rol",
                usuario.rol === "admin" ? "Rol de administrador retirado." : "Ahora es administrador.",
              )
            }
          >
            {usuario.rol === "admin" ? "Quitar administración" : "Hacer administrador"}
          </Boton>
        </div>
      </section>

      {/* -------------- Borrado -------------- */}
      <section
        aria-labelledby="accion-borrar"
        className={cn(marco, "border-[color-mix(in_oklab,var(--danger)_55%,var(--scale))]")}
      >
        <h2 id="accion-borrar" className="titulo">
          Borrar la cuenta
        </h2>
        <p className="mt-2 cuerpo text-smoke">
          Se borran también sus campañas y su historial de créditos. La línea de auditoría
          sobrevive al borrado: queda constancia de quién lo hizo y cuándo.
        </p>

        <Dialogo open={abierto} onOpenChange={setAbierto}>
          <div className="mt-5">
            <Boton variante="peligro" disabled={esYoMismo} onClick={() => setAbierto(true)}>
              Borrar cuenta
            </Boton>
            {esYoMismo && (
              <p className="mt-3 mono-sm text-slag">
                No puedes borrar tu propia cuenta desde el panel.
              </p>
            )}
          </div>

          <DialogoContenido
            titulo="Borrar esta cuenta"
            descripcion="Esta acción no se puede deshacer. Escribe el correo exacto para confirmar."
          >
            <div className="flex flex-col gap-5">
              <p className="mono-sm rounded-[10px] bg-[var(--sunk)] px-3 py-2 text-smoke">
                {usuario.email}
              </p>
              <Campo
                id="confirmar-borrado"
                etiqueta="Escribe el correo"
                autoComplete="off"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
              />
              <div className="flex justify-end gap-3">
                <DialogoCierre asChild>
                  <Boton variante="fantasma">Cancelar</Boton>
                </DialogoCierre>
                <Boton
                  variante="peligro"
                  cargando={ocupado === "borrar"}
                  textoCargando="Borrando…"
                  disabled={confirmacion.trim().toLowerCase() !== usuario.email.toLowerCase()}
                  onClick={borrar}
                >
                  Borrar definitivamente
                </Boton>
              </div>
            </div>
          </DialogoContenido>
        </Dialogo>
      </section>
    </div>
  );
}
