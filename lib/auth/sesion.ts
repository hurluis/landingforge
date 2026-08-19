import "server-only";

import { cookies } from "next/headers";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { Usuario } from "@/lib/datos/tipos";
import { repositorio } from "@/lib/datos/sqlite";
import { COOKIE_SESION, firmarSesion, verificarSesion } from "@/lib/auth/token";

/**
 * Sesión y contraseñas — §7.2.
 *
 * La contraseña nunca se guarda en texto plano: scrypt con sal aleatoria por
 * usuario. La comparación es de tiempo constante, para no filtrar información
 * por cuánto tarda en fallar.
 *
 * La cookie es httpOnly, secure en producción y sameSite=lax.
 */

const scryptAsync = promisify(scrypt) as (
  clave: string,
  sal: Buffer,
  largo: number,
) => Promise<Buffer>;

const LARGO_CLAVE = 64;

export async function hashContrasena(contrasena: string): Promise<string> {
  const sal = randomBytes(16);
  const derivada = await scryptAsync(contrasena, sal, LARGO_CLAVE);
  return `${sal.toString("hex")}:${derivada.toString("hex")}`;
}

export async function verificarContrasena(
  contrasena: string,
  guardado: string,
): Promise<boolean> {
  const [salHex, hashHex] = guardado.split(":");
  if (!salHex || !hashHex) return false;
  const derivada = await scryptAsync(contrasena, Buffer.from(salHex, "hex"), LARGO_CLAVE);
  const esperado = Buffer.from(hashHex, "hex");
  if (esperado.length !== derivada.length) return false;
  return timingSafeEqual(derivada, esperado);
}

export async function abrirSesion(usuarioId: string): Promise<void> {
  const token = await firmarSesion(usuarioId);
  const almacen = await cookies();
  almacen.set(COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function cerrarSesion(): Promise<void> {
  const almacen = await cookies();
  almacen.delete(COOKIE_SESION);
}

export async function idUsuarioActual(): Promise<string | null> {
  const almacen = await cookies();
  return verificarSesion(almacen.get(COOKIE_SESION)?.value);
}

export async function usuarioActual(): Promise<Usuario | null> {
  const id = await idUsuarioActual();
  if (!id) return null;
  return repositorio().usuarioPorId(id);
}

/** Para route handlers: devuelve el usuario o lanza una respuesta 401. */
export async function exigirUsuario(): Promise<Usuario> {
  const u = await usuarioActual();
  if (!u) throw new RespuestaSinSesion();
  return u;
}

export class RespuestaSinSesion extends Error {
  constructor() {
    super("Sin sesión");
    this.name = "RespuestaSinSesion";
  }
}
