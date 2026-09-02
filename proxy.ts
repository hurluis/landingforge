import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESION, verificarSesion } from "@/lib/auth/token";

/**
 * Guardia de rutas — §7.2. Sin sesión, /app/* y /admin/* redirigen a
 * /entrar?volver=<ruta>, para devolver al usuario donde estaba.
 *
 * Va en `proxy.ts` y no en `middleware.ts` porque Next 16 deprecó ese nombre;
 * el comportamiento es el mismo.
 *
 * Solo verifica la firma del token: no toca la base de datos. Eso es lo que le
 * permite responder antes de renderizar nada.
 *
 * Para /admin/* esto es únicamente la primera de tres capas, y la más débil:
 * aquí solo se sabe que hay una sesión válida, no de quién. El rol se
 * comprueba contra la base de datos en `app/(admin)/layout.tsx` y otra vez en
 * cada route handler de /api/admin. Este archivo corre en el runtime Edge y
 * no puede abrir SQLite, así que no podría comprobarlo aunque quisiera.
 */
export default async function proxy(peticion: NextRequest) {
  const token = peticion.cookies.get(COOKIE_SESION)?.value;
  const usuarioId = await verificarSesion(token);

  if (usuarioId) return NextResponse.next();

  const destino = new URL("/entrar", peticion.url);
  destino.searchParams.set("volver", peticion.nextUrl.pathname + peticion.nextUrl.search);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/app/:path*", "/admin/:path*"],
};
