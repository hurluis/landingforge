import { NextResponse } from "next/server";
import { repositorioAdmin } from "@/lib/datos/admin-sqlite";
import { esquemaFiltroAuditoria } from "@/lib/esquemas-admin";
import { conAdmin, errorDeValidacion } from "@/lib/api-admin";

export const runtime = "nodejs";

/**
 * Exportación de la bitácora a CSV.
 *
 * Es la única ruta de lectura del panel: el resto de las pantallas son
 * componentes de servidor que consultan el repositorio directamente, sin
 * pasar por HTTP. Esta existe porque el navegador necesita una respuesta con
 * `Content-Disposition` para ofrecer la descarga.
 */

/** Escapa un campo de CSV según RFC 4180: comillas dobles duplicadas. */
function campo(valor: unknown): string {
  const texto =
    valor === null || valor === undefined
      ? ""
      : typeof valor === "object"
        ? JSON.stringify(valor)
        : String(valor);
  return `"${texto.replaceAll('"', '""')}"`;
}

const CABECERAS = [
  "fecha",
  "actor",
  "actor_id",
  "accion",
  "objetivo_tipo",
  "objetivo",
  "objetivo_id",
  "detalle",
  "ip",
];

export async function GET(peticion: Request) {
  return conAdmin(peticion, async () => {
    const parametros = Object.fromEntries(new URL(peticion.url).searchParams);
    const analisis = esquemaFiltroAuditoria.safeParse(parametros);
    if (!analisis.success) return errorDeValidacion(analisis.error.issues[0]?.message);

    const eventos = await repositorioAdmin().auditoriaCompleta(analisis.data);

    const lineas = [
      CABECERAS.join(","),
      ...eventos.map((e) =>
        [
          e.fecha,
          e.actorEmail,
          e.actorId,
          e.accion,
          e.objetivoTipo,
          e.objetivoEtiqueta,
          e.objetivoId,
          e.detalle,
          e.ip,
        ]
          .map(campo)
          .join(","),
      ),
    ];

    const hoy = new Date().toISOString().slice(0, 10);
    /* El BOM va delante para que Excel en Windows abra el archivo como UTF-8
       en vez de romper cada tilde. Es el detalle que decide si el CSV sirve. */
    return new NextResponse(`﻿${lineas.join("\r\n")}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="auditoria-${hoy}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  });
}
