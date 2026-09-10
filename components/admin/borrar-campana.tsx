"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash } from "@phosphor-icons/react/dist/ssr";
import { Boton } from "@/components/ui/boton";
import { Dialogo, DialogoCierre, DialogoContenido } from "@/components/ui/dialogo";

/**
 * La única acción destructiva del inspector de campañas.
 *
 * No hay un botón de editar al lado porque no hay ruta que lo sirva: el
 * servidor no expone forma de modificar la campaña de otro. Un administrador
 * diagnostica; reescribir el trabajo del cliente no es parte del trabajo.
 */
export function BorrarCampana({
  campanaId,
  nombre,
  dueno,
}: {
  campanaId: string;
  nombre: string;
  dueno: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = React.useState(false);
  const [borrando, setBorrando] = React.useState(false);

  async function borrar() {
    setBorrando(true);
    try {
      const r = await fetch(`/api/admin/campanas/${campanaId}`, { method: "DELETE" });
      const datos = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(datos.error ?? "No se pudo borrar la campaña.");
      toast.success("Campaña borrada.", { description: "Queda registrada en la auditoría." });
      setAbierto(false);
      router.replace("/admin/campanas");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo borrar la campaña.");
    } finally {
      setBorrando(false);
    }
  }

  return (
    <Dialogo open={abierto} onOpenChange={setAbierto}>
      <Boton variante="peligro" tamano="sm" onClick={() => setAbierto(true)}>
        <Trash className="size-4" />
        Borrar campaña
      </Boton>

      <DialogoContenido
        titulo="Borrar esta campaña"
        descripcion="Se borra el trabajo de un cliente y no se puede deshacer. Hazlo solo por abuso."
      >
        <div className="flex flex-col gap-5">
          <dl className="rounded-[10px] bg-[var(--sunk)] px-4 py-3">
            <div className="flex gap-2">
              <dt className="mono-sm text-slag">campaña</dt>
              <dd className="mono-sm text-ash">{nombre}</dd>
            </div>
            <div className="mt-1 flex gap-2">
              <dt className="mono-sm text-slag">dueño</dt>
              <dd className="mono-sm text-ash">{dueno}</dd>
            </div>
          </dl>
          <div className="flex justify-end gap-3">
            <DialogoCierre asChild>
              <Boton variante="fantasma">Cancelar</Boton>
            </DialogoCierre>
            <Boton
              variante="peligro"
              cargando={borrando}
              textoCargando="Borrando…"
              onClick={borrar}
            >
              Borrar definitivamente
            </Boton>
          </div>
        </div>
      </DialogoContenido>
    </Dialogo>
  );
}
