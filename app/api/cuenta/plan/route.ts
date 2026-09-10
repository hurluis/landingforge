import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth/sesion";
import { repositorio } from "@/lib/datos";
import { esquemaPlan } from "@/lib/esquemas";

export const runtime = "nodejs";

/**
 * Cambio de plan SIMULADO — §7.2.
 *
 * No hay pasarela de pago (F6 está fuera de alcance). Esta ruta cambia el plan
 * y recarga los créditos sin cobrar nada. La pantalla lo declara con esa misma
 * honestidad en vez de disfrazarlo de checkout real.
 */
export async function POST(peticion: Request) {
  const usuario = await usuarioActual();
  if (!usuario) return NextResponse.json({ error: "Necesitas iniciar sesión." }, { status: 401 });

  const cuerpo = await peticion.json().catch(() => null);
  const analisis = esquemaPlan.safeParse(cuerpo);
  if (!analisis.success) {
    return NextResponse.json({ error: "Plan inválido." }, { status: 400 });
  }

  const actualizado = await repositorio().cambiarPlan(usuario.id, analisis.data.plan);
  return NextResponse.json({ usuario: actualizado, simulado: true });
}
