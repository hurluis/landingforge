import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth/sesion";
import { repositorio } from "@/lib/datos";
import { esquemaCampanaPatch } from "@/lib/esquemas";
import { revalidar } from "@/lib/metodologia/reglas-prompt";

export const runtime = "nodejs";

/**
 * F2 — detalle, edición y borrado de una campaña. §9.5.
 * Todas las operaciones verifican que la campaña sea del usuario en sesión:
 * el repositorio filtra por usuario_id en el propio WHERE, así que adivinar
 * un id ajeno no sirve de nada.
 */

type Contexto = { params: Promise<{ id: string }> };

export async function GET(_peticion: Request, { params }: Contexto) {
  const usuario = await usuarioActual();
  if (!usuario) return NextResponse.json({ error: "Necesitas iniciar sesión." }, { status: 401 });

  const { id } = await params;
  const campana = await repositorio().campana(id, usuario.id);
  if (!campana) return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
  return NextResponse.json({ campana });
}

export async function PATCH(peticion: Request, { params }: Contexto) {
  const usuario = await usuarioActual();
  if (!usuario) return NextResponse.json({ error: "Necesitas iniciar sesión." }, { status: 401 });

  const { id } = await params;
  const cuerpo = await peticion.json().catch(() => null);
  const analisis = esquemaCampanaPatch.safeParse(cuerpo);
  if (!analisis.success) {
    return NextResponse.json(
      { error: analisis.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const repo = repositorio();

  if (analisis.data.accion === "duplicar") {
    const copia = await repo.duplicarCampana(id, usuario.id);
    if (!copia) return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
    return NextResponse.json({ campana: copia });
  }

  if (analisis.data.prompt) {
    const actual = await repo.campana(id, usuario.id);
    if (!actual) return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
    const anterior = actual.prompts.find((p) => p.tipologia === analisis.data.prompt!.tipologia);
    if (!anterior) {
      return NextResponse.json({ error: "Esa sección no existe en la campaña." }, { status: 404 });
    }
    /* La revalidación es del servidor. El validador del cliente es comodidad;
       este es el que manda. */
    const actualizado = revalidar(anterior, analisis.data.prompt.texto);
    const campana = await repo.reemplazarPrompt(id, usuario.id, actualizado);
    return NextResponse.json({ campana });
  }

  if (analisis.data.nombre) {
    const campana = await repo.actualizarCampana(id, usuario.id, {
      nombre: analisis.data.nombre,
    });
    if (!campana) return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
    return NextResponse.json({ campana });
  }

  return NextResponse.json({ error: "No hay nada que cambiar." }, { status: 400 });
}

export async function DELETE(_peticion: Request, { params }: Contexto) {
  const usuario = await usuarioActual();
  if (!usuario) return NextResponse.json({ error: "Necesitas iniciar sesión." }, { status: 401 });

  const { id } = await params;
  const borrada = await repositorio().borrarCampana(id, usuario.id);
  if (!borrada) return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
