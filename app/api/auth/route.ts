import { NextResponse } from "next/server";
import { esquemaCredenciales } from "@/lib/esquemas";
import { repositorio } from "@/lib/datos/sqlite";
import {
  abrirSesion,
  cerrarSesion,
  hashContrasena,
  verificarContrasena,
} from "@/lib/auth/sesion";
import { sembrarAdmin } from "@/lib/auth/admin";
import { ipDe, limitar } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * F2 — registro, entrada y salida. §9.5.
 *
 * El registro y la entrada comparten ruta y esquema porque comparten
 * credenciales; los separa el campo `modo`. El rate limit por IP es lo que
 * impide probar contraseñas a fuerza bruta.
 *
 * `sembrarAdmin` se llama en los dos caminos: son los dos únicos momentos en
 * los que hay prueba de que el correo pertenece a quien lo está usando. Es
 * idempotente, así que sobre alguien que ya es administrador no hace nada.
 */

export async function POST(peticion: Request) {
  const limite = limitar(`auth:${ipDe(peticion)}`, 8, 60_000);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: `Demasiados intentos. Espera ${limite.esperaSegundos} segundos.` },
      { status: 429, headers: { "Retry-After": String(limite.esperaSegundos) } },
    );
  }

  const cuerpo = await peticion.json().catch(() => null);
  const modo = cuerpo?.modo === "registro" ? "registro" : "entrar";
  const analisis = esquemaCredenciales.safeParse(cuerpo);
  if (!analisis.success) {
    return NextResponse.json(
      { error: analisis.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const { email, contrasena } = analisis.data;
  const repo = repositorio();

  if (modo === "registro") {
    const existente = await repo.usuarioPorEmail(email);
    if (existente) {
      return NextResponse.json(
        { error: "Ya hay una cuenta con ese correo. Entra en vez de registrarte." },
        { status: 409 },
      );
    }
    const creado = await repo.crearUsuario(email, await hashContrasena(contrasena));
    const usuario = await sembrarAdmin(creado);
    await abrirSesion(usuario.id);
    return NextResponse.json({ usuario });
  }

  const guardado = await repo.usuarioPorEmail(email);
  /* Mismo mensaje para correo inexistente y contraseña errada: decir cuál de
     los dos falló le regala al atacante la lista de correos registrados. */
  const generico = "El correo o la contraseña no coinciden.";
  if (!guardado) return NextResponse.json({ error: generico }, { status: 401 });

  const correcta = await verificarContrasena(contrasena, guardado.hash);
  if (!correcta) return NextResponse.json({ error: generico }, { status: 401 });

  const usuario = await sembrarAdmin(guardado);
  await abrirSesion(usuario.id);
  /* El hash nunca sale del servidor, ni siquiera al propio dueño de la cuenta. */
  return NextResponse.json({
    usuario: {
      id: usuario.id,
      email: usuario.email,
      plan: usuario.plan,
      rol: usuario.rol,
      creditosDisponibles: usuario.creditosDisponibles,
      renuevaEn: usuario.renuevaEn,
      creadoEn: usuario.creadoEn,
    },
  });
}

export async function DELETE() {
  await cerrarSesion();
  return NextResponse.json({ ok: true });
}
