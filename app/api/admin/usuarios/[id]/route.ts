import { NextResponse } from "next/server";
import { repositorio } from "@/lib/datos";
import { repositorioAdmin } from "@/lib/datos";
import {
  esquemaAjusteCreditos,
  esquemaBorradoUsuario,
  esquemaCambioPlanAdmin,
  esquemaCambioRol,
} from "@/lib/esquemas-admin";
import { ErrorAdmin, conAdmin, errorDeValidacion } from "@/lib/api-admin";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };

/**
 * Mutaciones sobre un usuario — plan, saldo, rol y borrado.
 *
 * Las cuatro comparten ruta porque comparten sujeto y comparten las mismas
 * dos salvaguardas: un administrador no puede degradarse ni borrarse a sí
 * mismo. Es lo que impide dejar la plataforma sin ningún administrador por un
 * clic mal dado, y no hay forma de saltárselo desde la interfaz porque la
 * comprobación vive aquí, en el servidor.
 *
 * Toda mutación que llega a completarse escribe su línea de auditoría antes
 * de responder.
 */

export async function PATCH(peticion: Request, { params }: Contexto) {
  return conAdmin(peticion, async (admin, ip) => {
    const { id } = await params;
    const cuerpo = (await peticion.json().catch(() => null)) as { accion?: string } | null;
    const repo = repositorio();
    const gestor = repositorioAdmin();

    const objetivo = await repo.usuarioPorId(id);
    if (!objetivo) {
      return NextResponse.json({ error: "Ese usuario no existe." }, { status: 404 });
    }

    switch (cuerpo?.accion) {
      case "plan": {
        const analisis = esquemaCambioPlanAdmin.safeParse(cuerpo);
        if (!analisis.success) return errorDeValidacion(analisis.error.issues[0]?.message);

        const anterior = objetivo.plan;
        const usuario = await repo.cambiarPlan(id, analisis.data.plan);
        await gestor.anotarAuditoria({
          actorId: admin.id,
          actorEmail: admin.email,
          accion: "usuario.plan",
          objetivoTipo: "usuario",
          objetivoId: id,
          objetivoEtiqueta: objetivo.email,
          detalle: { de: anterior, a: usuario.plan },
          ip,
        });
        return NextResponse.json({ usuario });
      }

      case "creditos": {
        const analisis = esquemaAjusteCreditos.safeParse(cuerpo);
        if (!analisis.success) return errorDeValidacion(analisis.error.issues[0]?.message);

        const { delta, motivo } = analisis.data;
        const usuario = await gestor.ajustarCreditos(id, delta, motivo);
        if (!usuario) {
          return NextResponse.json({ error: "Ese usuario no existe." }, { status: 404 });
        }
        await gestor.anotarAuditoria({
          actorId: admin.id,
          actorEmail: admin.email,
          accion: "usuario.creditos",
          objetivoTipo: "usuario",
          objetivoId: id,
          objetivoEtiqueta: objetivo.email,
          detalle: { delta, motivo, saldoFinal: usuario.creditosDisponibles },
          ip,
        });
        return NextResponse.json({ usuario });
      }

      case "rol": {
        const analisis = esquemaCambioRol.safeParse(cuerpo);
        if (!analisis.success) return errorDeValidacion(analisis.error.issues[0]?.message);

        const { rol } = analisis.data;
        if (id === admin.id) {
          throw new ErrorAdmin(
            "AUTO_DEGRADACION",
            "No puedes cambiarte el rol a ti mismo. Pídeselo a otro administrador.",
          );
        }
        if (rol === "usuario" && objetivo.rol === "admin" && (await gestor.contarAdmins()) <= 1) {
          throw new ErrorAdmin(
            "ULTIMO_ADMIN",
            "Es el último administrador. Nombra otro antes de quitarle el rol.",
          );
        }
        if (rol === objetivo.rol) {
          return NextResponse.json({ usuario: objetivo, sinCambios: true });
        }

        const usuario = await gestor.cambiarRol(id, rol);
        if (!usuario) {
          return NextResponse.json({ error: "Ese usuario no existe." }, { status: 404 });
        }
        await gestor.anotarAuditoria({
          actorId: admin.id,
          actorEmail: admin.email,
          accion: "usuario.rol",
          objetivoTipo: "usuario",
          objetivoId: id,
          objetivoEtiqueta: objetivo.email,
          detalle: { de: objetivo.rol, a: rol },
          ip,
        });
        return NextResponse.json({ usuario });
      }

      default:
        return NextResponse.json(
          { error: "Acción desconocida. Usa plan, creditos o rol." },
          { status: 400 },
        );
    }
  });
}

export async function DELETE(peticion: Request, { params }: Contexto) {
  return conAdmin(peticion, async (admin, ip) => {
    const { id } = await params;
    const gestor = repositorioAdmin();

    const objetivo = await repositorio().usuarioPorId(id);
    if (!objetivo) {
      return NextResponse.json({ error: "Ese usuario no existe." }, { status: 404 });
    }

    if (id === admin.id) {
      throw new ErrorAdmin(
        "AUTO_BORRADO",
        "No puedes borrar tu propia cuenta desde el panel.",
      );
    }
    if (objetivo.rol === "admin" && (await gestor.contarAdmins()) <= 1) {
      throw new ErrorAdmin(
        "ULTIMO_ADMIN",
        "Es el último administrador. Nombra otro antes de borrar esta cuenta.",
      );
    }

    const cuerpo = await peticion.json().catch(() => null);
    const analisis = esquemaBorradoUsuario.safeParse(cuerpo);
    if (!analisis.success) return errorDeValidacion(analisis.error.issues[0]?.message);

    /* La confirmación es el correo exacto. Comparación insensible a mayúsculas
       porque los correos se guardan en minúsculas, no por relajar el control. */
    if (analisis.data.confirmacion.trim().toLowerCase() !== objetivo.email.toLowerCase()) {
      throw new ErrorAdmin(
        "CONFIRMACION_NO_COINCIDE",
        "El correo escrito no coincide con el de la cuenta.",
        400,
      );
    }

    /* La línea de auditoría se escribe ANTES del borrado: si se escribiera
       después y el borrado fallara a medias, quedaría registrado un hecho que
       no ocurrió. Al revés, lo peor que queda es una intención sin efecto,
       que es la mitad honesta del error. */
    await gestor.anotarAuditoria({
      actorId: admin.id,
      actorEmail: admin.email,
      accion: "usuario.borrado",
      objetivoTipo: "usuario",
      objetivoId: id,
      objetivoEtiqueta: objetivo.email,
      detalle: { plan: objetivo.plan, rol: objetivo.rol, creditos: objetivo.creditosDisponibles },
      ip,
    });

    const borrado = await gestor.borrarUsuario(id);
    return NextResponse.json({ borrado });
  });
}
