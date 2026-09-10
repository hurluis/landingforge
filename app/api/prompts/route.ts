import { NextResponse } from "next/server";
import { esquemaGeneracion } from "@/lib/esquemas";
import { repositorio } from "@/lib/datos";
import { clienteIA } from "@/lib/ia";
import { usuarioActual } from "@/lib/auth/sesion";
import { limitar } from "@/lib/rate-limit";
import { id } from "@/lib/utils";
import type { Campana, TipologiaSeccion } from "@/lib/datos/tipos";

export const runtime = "nodejs";

/**
 * F1 — generación de prompts. §9.5.
 *
 * Streaming NDJSON: cada prompt se emite en cuanto está listo, no se espera a
 * los nueve. Créditos transaccionales: se descuentan los N de golpe con la
 * comprobación dentro del propio UPDATE, y se devuelve uno por cada sección
 * que falle. Eso hace posible el estado parcial de §11.
 */

type Evento =
  | { tipo: "inicio"; total: number; campanaId: string }
  | { tipo: "construyendo"; tipologia: TipologiaSeccion }
  | { tipo: "seccion"; prompt: unknown }
  | { tipo: "fallo"; tipologia: TipologiaSeccion; mensaje: string }
  | { tipo: "fin"; campanaId: string; creditos: number; fallidas: TipologiaSeccion[] };

export async function POST(peticion: Request) {
  const usuario = await usuarioActual();
  if (!usuario) {
    return NextResponse.json({ error: "Necesitas iniciar sesión." }, { status: 401 });
  }

  const limite = limitar(`prompts:${usuario.id}`, 6, 60_000);
  if (!limite.permitido) {
    return NextResponse.json(
      {
        error: `Demasiadas generaciones seguidas. Vuelve a intentar en ${limite.esperaSegundos} segundos.`,
      },
      { status: 429, headers: { "Retry-After": String(limite.esperaSegundos) } },
    );
  }

  const cuerpo = await peticion.json().catch(() => null);
  const analisis = esquemaGeneracion.safeParse(cuerpo);
  if (!analisis.success) {
    return NextResponse.json(
      { error: analisis.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const { producto, paleta, tipologias } = analisis.data;
  const repo = repositorio();
  const costo = tipologias.length;
  const nombreCampana = producto.nombre;

  /* 1 · Descuento transaccional ANTES de gastar un token. */
  try {
    await repo.descontarCreditos(usuario.id, costo, null, nombreCampana);
  } catch (e) {
    if (e instanceof Error && e.message === "CREDITOS_INSUFICIENTES") {
      const faltan = costo - usuario.creditosDisponibles;
      return NextResponse.json(
        {
          error: `Te ${faltan === 1 ? "falta" : "faltan"} ${faltan} ${faltan === 1 ? "crédito" : "créditos"} para estas ${costo} secciones.`,
          codigo: "sin-creditos",
        },
        { status: 402 },
      );
    }
    throw e;
  }

  /* 2 · La campaña existe desde el principio, en estado «generando». */
  const ahora = new Date().toISOString();
  const campana: Campana = {
    id: id("cmp"),
    usuarioId: usuario.id,
    nombre: nombreCampana,
    producto,
    paleta,
    prompts: [],
    seccionesFallidas: [],
    estado: "generando",
    creadaEn: ahora,
    actualizadaEn: ahora,
  };
  await repo.crearCampana(campana);

  const ia = await clienteIA();
  const codificador = new TextEncoder();

  const flujo = new ReadableStream<Uint8Array>({
    async start(controlador) {
      const emitir = (e: Evento) =>
        controlador.enqueue(codificador.encode(`${JSON.stringify(e)}\n`));

      emitir({ tipo: "inicio", total: tipologias.length, campanaId: campana.id });

      const listos = [];
      const fallidas: TipologiaSeccion[] = [];

      for (const t of tipologias) {
        emitir({ tipo: "construyendo", tipologia: t });
        try {
          const prompt = await ia.generarPrompt({ producto, paleta, tipologia: t });
          listos.push(prompt);
          emitir({ tipo: "seccion", prompt });
        } catch (e) {
          fallidas.push(t);
          /* 3 · Devolución inmediata del crédito de la sección que falló. */
          await repo.devolverCreditos(usuario.id, 1, campana.id, nombreCampana);
          emitir({
            tipo: "fallo",
            tipologia: t,
            mensaje: e instanceof Error ? e.message : "Falló la construcción de esta sección.",
          });
        }
        /* Se persiste tras cada sección: si el usuario cierra la pestaña a
           mitad de camino, lo generado hasta ahí ya está guardado. */
        await repo.actualizarCampana(campana.id, usuario.id, {
          prompts: listos,
          seccionesFallidas: fallidas,
        });
      }

      await repo.actualizarCampana(campana.id, usuario.id, {
        prompts: listos,
        seccionesFallidas: fallidas,
        estado: listos.length === 0 ? "error" : "lista",
      });

      const actualizado = await repo.usuarioPorId(usuario.id);
      emitir({
        tipo: "fin",
        campanaId: campana.id,
        creditos: actualizado?.creditosDisponibles ?? 0,
        fallidas,
      });
      controlador.close();
    },
  });

  return new Response(flujo, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
