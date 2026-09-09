import { NextResponse } from "next/server";
import { repositorioAdmin } from "@/lib/datos";
import { conAdmin } from "@/lib/api-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

/**
 * Borrado de una campaña por abuso.
 *
 * Es la única acción destructiva del inspector de campañas, y no hay una ruta
 * para editarlas: el administrador diagnostica el trabajo del cliente, no lo
 * reescribe. Que esa capacidad no exista en el servidor es más fuerte que
 * ocultar un botón.
 */
export async function DELETE(peticion: Request, { params }: Contexto) {
  return conAdmin(peticion, async (admin, ip) => {
    const { id } = await params;
    const gestor = repositorioAdmin();

    const ficha = await gestor.campanaCompleta(id);
    if (!ficha) {
      return NextResponse.json({ error: "Esa campaña no existe." }, { status: 404 });
    }

    /* Igual que con el borrado de usuarios: primero el registro, después el
       hecho. Un registro de algo que no llegó a pasar es un error menos grave
       que un borrado del que no queda constancia. */
    await gestor.anotarAuditoria({
      actorId: admin.id,
      actorEmail: admin.email,
      accion: "campana.borrada",
      objetivoTipo: "campana",
      objetivoId: id,
      objetivoEtiqueta: ficha.campana.nombre,
      detalle: {
        dueno: ficha.email,
        estado: ficha.campana.estado,
        prompts: ficha.campana.prompts.length,
      },
      ip,
    });

    const borrada = await gestor.borrarCampanaComoAdmin(id);
    return NextResponse.json({ borrada });
  });
}
