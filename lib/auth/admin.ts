import "server-only";

import { notFound } from "next/navigation";
import type { Usuario } from "@/lib/datos/tipos";
import { usuarioActual } from "@/lib/auth/sesion";
import { repositorioAdmin } from "@/lib/datos";

/**
 * Autorización del panel de administración.
 *
 * Tres decisiones sostienen este archivo:
 *
 * 1. **El rol NO viaja en el token de sesión.** Si viajara, degradar a un
 *    administrador no tendría efecto hasta que cerrara sesión, y una cuenta
 *    comprometida seguiría teniendo el panel durante siete días. La fuente de
 *    verdad es la base de datos, consultada en cada petición.
 *
 * 2. **Sin rol se responde 404, no 403.** Un 403 confirma que la ruta existe
 *    y que hay un panel detrás. Es la misma lógica por la que el login usa el
 *    mismo mensaje para un correo inexistente que para una contraseña errada.
 *
 * 3. **El arranque va por variable de entorno.** El primer administrador no
 *    puede crearse desde un panel al que nadie puede entrar todavía. Después
 *    del arranque la fuente de verdad vuelve a ser la columna `rol`, y los
 *    administradores se gestionan desde la propia interfaz.
 */

/** Los correos de `ADMIN_EMAILS`, normalizados. Lista vacía si no hay nada. */
export function correosSemilla(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter((c) => c !== "");
}

/**
 * Promueve al usuario si su correo está en la semilla y todavía no es
 * administrador. Se llama al registrarse y al entrar, que son los dos únicos
 * momentos en los que sabemos con certeza que el correo pertenece a quien lo
 * está usando.
 *
 * Es idempotente: sobre un usuario que ya es administrador no escribe nada,
 * ni en la tabla de usuarios ni en la de auditoría.
 */
export async function sembrarAdmin(usuario: Usuario): Promise<Usuario> {
  if (usuario.rol === "admin") return usuario;
  if (!correosSemilla().includes(usuario.email.toLowerCase())) return usuario;

  const admin = repositorioAdmin();
  const resultado = await admin.promoverPorEmail(usuario.email);
  if (!resultado?.promovido) return usuario;

  await admin.anotarAuditoria({
    actorId: null,
    actorEmail: "sistema",
    accion: "usuario.rol",
    objetivoTipo: "usuario",
    objetivoId: usuario.id,
    objetivoEtiqueta: usuario.email,
    detalle: { de: "usuario", a: "admin", origen: "ADMIN_EMAILS" },
  });

  return resultado.usuario;
}

/** El usuario en sesión si además es administrador. `null` en cualquier otro caso. */
export async function adminActual(): Promise<Usuario | null> {
  const usuario = await usuarioActual();
  if (!usuario || usuario.rol !== "admin") return null;
  return usuario;
}

/**
 * Para páginas del servidor. Sin rol, la ruta deja de existir.
 * `notFound()` lanza, así que el llamador recibe siempre un `Usuario`.
 */
export async function exigirAdminEnPagina(): Promise<Usuario> {
  const usuario = await adminActual();
  if (!usuario) notFound();
  return usuario;
}

/**
 * Error de autorización para route handlers. Lo traduce `responderSinPermiso`
 * a un 404, por el mismo motivo que las páginas.
 */
export class SinPermisoAdmin extends Error {
  constructor() {
    super("Sin permiso de administración");
    this.name = "SinPermisoAdmin";
  }
}

/** Para route handlers: devuelve el administrador o lanza `SinPermisoAdmin`. */
export async function exigirAdmin(): Promise<Usuario> {
  const usuario = await adminActual();
  if (!usuario) throw new SinPermisoAdmin();
  return usuario;
}
