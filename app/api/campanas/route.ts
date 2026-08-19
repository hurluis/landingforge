import { NextResponse } from "next/server";
import { usuarioActual } from "@/lib/auth/sesion";
import { repositorio } from "@/lib/datos/sqlite";

export const runtime = "nodejs";

/** F2 — lista de campañas del usuario en sesión. §9.5. */
export async function GET() {
  const usuario = await usuarioActual();
  if (!usuario) {
    return NextResponse.json({ error: "Necesitas iniciar sesión." }, { status: 401 });
  }
  const campanas = await repositorio().campanasDe(usuario.id);
  return NextResponse.json({ campanas });
}
