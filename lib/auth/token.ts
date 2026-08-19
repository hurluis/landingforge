import { SignJWT, jwtVerify } from "jose";

/**
 * Firma y verificación del token de sesión.
 *
 * Este archivo se mantiene libre de APIs de Node a propósito: el middleware
 * corre en el runtime Edge y necesita verificar el token sin poder abrir la
 * base de datos. `jose` funciona en ambos runtimes.
 */

export const COOKIE_SESION = "lf_sesion";
const DURACION = "7d";

function secreto(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) {
    throw new Error(
      "AUTH_SECRET falta o es demasiado corto. Genera uno con: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }
  return new TextEncoder().encode(s);
}

export async function firmarSesion(usuarioId: string): Promise<string> {
  return new SignJWT({ sub: usuarioId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DURACION)
    .sign(secreto());
}

export async function verificarSesion(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secreto());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
