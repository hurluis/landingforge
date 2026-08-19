"use client";

import { AlertTriangle, CheckCircle2, Ban } from "lucide-react";
import type { Advertencia } from "@/lib/datos/tipos";
import {
  LIMITE_CARACTERES_TEXTO,
  MAX_PALABRAS,
  MIN_PALABRAS,
} from "@/lib/metodologia/reglas-prompt";
import { cn } from "@/lib/utils";

/**
 * El validador — §7.1. Esto es lo que demuestra que hay ingeniería debajo y no
 * solo una llamada a una API.
 *
 * Cada advertencia nombra el problema Y la salida. Una que solo dijera «hay un
 * error» no serviría de nada, que es justo lo que §3.3 prohíbe.
 */

const NOMBRE_REGLA: Record<Advertencia["regla"], string> = {
  "limite-25-caracteres": `Límite de ${LIMITE_CARACTERES_TEXTO} caracteres`,
  "palabra-prohibida": "Lista negra",
  "sin-bloque-paleta": "Bloque de paleta",
  "sin-bloque-iluminacion": "Bloque de iluminación",
  longitud: `Longitud ${MIN_PALABRAS}–${MAX_PALABRAS}`,
  "estilo-keywords": "Prosa narrativa",
};

export function Validador({
  advertencias,
  palabras,
}: {
  advertencias: Advertencia[];
  palabras: number;
}) {
  const bloqueos = advertencias.filter((a) => a.severidad === "bloqueo");
  const avisos = advertencias.filter((a) => a.severidad === "aviso");

  return (
    <section aria-labelledby="validador-titulo" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h3 id="validador-titulo" className="etiqueta text-mid">
          Validación
        </h3>
        <span className="mono-sm text-lo tabular-nums">
          {palabras} palabras · {advertencias.length}{" "}
          {advertencias.length === 1 ? "hallazgo" : "hallazgos"}
        </span>
      </div>

      {advertencias.length === 0 ? (
        <p className="flex items-center gap-2 cuerpo text-[var(--ok)]">
          <CheckCircle2 strokeWidth={1.5} className="size-4 shrink-0" />
          Pasa las siete reglas. Listo para generar.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {[...bloqueos, ...avisos].map((a, i) => {
            const esBloqueo = a.severidad === "bloqueo";
            const Icono = esBloqueo ? Ban : AlertTriangle;
            return (
              <li
                key={`${a.regla}-${i}`}
                className={cn(
                  "flex gap-3 rounded-[10px] p-3",
                  // Borde lateral de 1px como máximo (§4.8): aquí se resuelve
                  // con superficie tintada, no con una barra de color gruesa.
                  esBloqueo
                    ? "bg-[color-mix(in_oklab,var(--danger)_10%,transparent)]"
                    : "bg-[color-mix(in_oklab,var(--warn)_8%,transparent)]",
                )}
              >
                <Icono
                  strokeWidth={1.5}
                  aria-hidden
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    esBloqueo ? "text-[var(--danger)]" : "text-[var(--warn)]",
                  )}
                />
                <div className="min-w-0">
                  <p className="mono-sm text-lo">{NOMBRE_REGLA[a.regla]}</p>
                  <p className="mt-1 cuerpo text-hi">{a.detalle}</p>
                  {a.sugerencia && <p className="mt-1 cuerpo text-mid">{a.sugerencia}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
