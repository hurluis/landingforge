import { NextResponse } from "next/server";
import { esquemaChat } from "@/lib/esquemas";
import { clienteIA } from "@/lib/ia";
import { ipDe, limitar } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * F3 — asistente LandingForge. §9.5.
 *
 * Streaming de texto plano. Rate limit de 10 peticiones por minuto por IP y
 * 20 mensajes por sesión (el tope lo impone el propio esquema zod: si llega
 * un historial más largo, se rechaza en el borde del servidor).
 *
 * El system prompt vive en el servidor y nunca viaja en la respuesta.
 */
export async function POST(peticion: Request) {
  const limite = limitar(`chat:${ipDe(peticion)}`, 10, 60_000);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: `Vas muy rápido. Espera ${limite.esperaSegundos} segundos y sigue.` },
      { status: 429, headers: { "Retry-After": String(limite.esperaSegundos) } },
    );
  }

  const cuerpo = await peticion.json().catch(() => null);
  const analisis = esquemaChat.safeParse(cuerpo);
  if (!analisis.success) {
    return NextResponse.json(
      { error: analisis.error.issues[0]?.message ?? "Mensaje inválido." },
      { status: 400 },
    );
  }

  const ia = await clienteIA();
  const codificador = new TextEncoder();

  const flujo = new ReadableStream<Uint8Array>({
    async start(controlador) {
      try {
        for await (const trozo of ia.chat(analisis.data.mensajes, analisis.data.idioma)) {
          controlador.enqueue(codificador.encode(trozo));
        }
      } catch {
        controlador.enqueue(
          codificador.encode(
            "\n\nSe cortó la conexión con el modelo. Vuelve a preguntar y sigo.",
          ),
        );
      } finally {
        controlador.close();
      }
    },
  });

  return new Response(flujo, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
