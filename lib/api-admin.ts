import "server-only";

import { NextResponse } from "next/server";
import type { Usuario } from "@/lib/datos/tipos";
import { SinPermisoAdmin, exigirAdmin } from "@/lib/auth/admin";
import { ipDe, limitar } from "@/lib/rate-limit";

/**
 * Envoltorio común de las rutas de administración.
 *
 * Existe para que ninguna ruta pueda olvidarse de una de las tres cosas que
 * todas necesitan: comprobar el rol contra la base de datos, limitar la
 * frecuencia, y no dejar escapar una excepción con su traza al cliente.
 *
 * El rol se comprueba aquí aunque el layout ya lo haya comprobado. Un route
 * handler no pasa por el layout: si confiara en él, /api/admin quedaría
 * abierto a cualquiera con sesión.
 */

/** Errores de negocio con un código que la interfaz puede distinguir. */
export class ErrorAdmin extends Error {
  constructor(
    readonly codigo: string,
    mensaje: string,
    readonly estado = 409,
  ) {
    super(mensaje);
    this.name = "ErrorAdmin";
  }
}

const MAXIMO = 30;
const VENTANA_MS = 60_000;

export async function conAdmin(
  peticion: Request,
  manejador: (admin: Usuario, ip: string) => Promise<NextResponse>,
): Promise<NextResponse> {
  const ip = ipDe(peticion);
  const limite = limitar(`admin:${ip}`, MAXIMO, VENTANA_MS);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: `Demasiadas peticiones. Espera ${limite.esperaSegundos} segundos.` },
      { status: 429, headers: { "Retry-After": String(limite.esperaSegundos) } },
    );
  }

  try {
    const admin = await exigirAdmin();
    return await manejador(admin, ip);
  } catch (e) {
    /* Sin rol, la ruta no existe. Un 403 confirmaría que sí, y con ella la
       existencia del panel entero. Mismo criterio que en las páginas. */
    if (e instanceof SinPermisoAdmin) {
      return NextResponse.json({ error: "No encontrado." }, { status: 404 });
    }
    if (e instanceof ErrorAdmin) {
      return NextResponse.json({ error: e.message, codigo: e.codigo }, { status: e.estado });
    }
    if (e instanceof Error && e.message === "SALDO_NEGATIVO") {
      return NextResponse.json(
        {
          error: "El ajuste dejaría el saldo en negativo.",
          codigo: "SALDO_NEGATIVO",
        },
        { status: 409 },
      );
    }
    console.error("[admin]", e);
    return NextResponse.json({ error: "Algo falló en el servidor." }, { status: 500 });
  }
}

/** Respuesta 400 uniforme a partir de un fallo de zod. */
export function errorDeValidacion(mensaje: string | undefined): NextResponse {
  return NextResponse.json({ error: mensaje ?? "Datos inválidos." }, { status: 400 });
}
