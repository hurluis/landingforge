import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { esquemaPruebaPublica } from "@/lib/esquemas";
import { clienteIA } from "@/lib/ia";
import { asignarPaleta } from "@/lib/metodologia/paletas";
import { MERCADOS } from "@/lib/metodologia/mercados";
import type { IdMercado } from "@/lib/datos/tipos";
import { ipDe, limitar } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * El estudio en vivo de la home — §6.2.7. Deja probar el generador sin cuenta,
 * con límite de UN prompt por visitante.
 *
 * El límite se apoya en dos cosas a la vez: una cookie por visitante (que es
 * lo que hace que la interfaz mute al segundo intento) y un rate limit por IP
 * (que es lo que impide que borrar la cookie salga gratis). La cookie sola
 * sería decorativa.
 */

const COOKIE_PRUEBA = "lf_prueba";

export async function POST(peticion: Request) {
  const almacen = await cookies();
  if (almacen.get(COOKIE_PRUEBA)) {
    return NextResponse.json(
      {
        error: "Ya viste cómo se ve. Crea tu cuenta para generar la campaña de nueve secciones.",
        codigo: "ya-usado",
      },
      { status: 403 },
    );
  }

  const limite = limitar(`prueba:${ipDe(peticion)}`, 3, 10 * 60_000);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: `Demasiadas pruebas. Vuelve en ${limite.esperaSegundos} segundos.` },
      { status: 429, headers: { "Retry-After": String(limite.esperaSegundos) } },
    );
  }

  const cuerpo = await peticion.json().catch(() => null);
  const analisis = esquemaPruebaPublica.safeParse(cuerpo);
  if (!analisis.success) {
    return NextResponse.json(
      { error: analisis.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 },
    );
  }

  const { descripcion, tipologia } = analisis.data;

  /* La prueba usa la matriz real: paleta asignada, no elegida al azar. */
  const audiencia = { genero: "mixto", edadMin: 25, edadMax: 45 } as const;
  const paleta = asignarPaleta("otro", audiencia);

  /* Sin formulario de país, el mercado sale del idioma del navegador: es-MX
     recibe su prompt con pesos mexicanos y COFEPRIS. Si no es uno de los
     mercados, el genérico. */
  const region = peticion.headers.get("accept-language")?.match(/^[a-z]{2}-([A-Za-z]{2})/)?.[1]?.toUpperCase();
  const mercado: IdMercado = region && region in MERCADOS ? (region as IdMercado) : "INT";

  try {
    const ia = await clienteIA();
    const prompt = await ia.generarPrompt({
      tipologia,
      paleta,
      producto: {
        nombre: descripcion.split(/[.,]/)[0].trim().slice(0, 60) || "Tu producto",
        descripcion,
        tipo: "otro",
        audiencia,
        beneficioPrincipal: "Resultados en 30 días",
        mercado,
        precio: MERCADOS[mercado].ejemplo,
      },
    });

    almacen.set(COOKIE_PRUEBA, "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ prompt, paleta });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? e.message
            : "No se pudo construir el prompt. Vuelve a intentarlo.",
      },
      { status: 502 },
    );
  }
}
