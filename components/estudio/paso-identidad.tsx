"use client";

import * as React from "react";
import { Check, Shuffle } from "@phosphor-icons/react/dist/ssr";
import { asignarPaleta, swatches } from "@/lib/metodologia/paletas";
import { Boton } from "@/components/ui/boton";
import { cn } from "@/lib/utils";
import type { EstadoEstudio } from "./estado";

/**
 * Paso 3 — La identidad (§7.1).
 *
 * El sistema aplica la matriz y propone. El usuario acepta o pide una
 * alternativa, con un máximo de dos: esto no es un selector infinito de color,
 * es una decisión razonada que se puede defender.
 *
 * Las paletas del cliente se muestran a plena saturación: son las únicas
 * manchas de color libre dentro de la interfaz (§4.2).
 */

const MAX_ALTERNATIVAS = 2;

export function PasoIdentidad({
  estado,
  cambiar,
}: {
  estado: EstadoEstudio;
  cambiar: (parcial: Partial<EstadoEstudio>) => void;
}) {
  const propuesta = React.useMemo(
    () => asignarPaleta(estado.tipo, estado.audiencia, estado.alternativa),
    [estado.tipo, estado.audiencia, estado.alternativa],
  );

  const aceptada = estado.paleta?.id === propuesta.id;
  const quedan = MAX_ALTERNATIVAS - estado.alternativa;

  return (
    <div className="flex flex-col gap-8">
      <div
        className={cn(
          "rounded-[16px] p-6",
          aceptada
            ? "border border-[var(--heat)] bg-[var(--anvil-hi)]"
            : "border border-[var(--scale)] bg-[var(--anvil)]",
        )}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h3 className="display-md">{propuesta.nombre}</h3>
          <span className="mono-sm text-smoke">
            alternativa {estado.alternativa} de {MAX_ALTERNATIVAS}
          </span>
        </div>

        <p className="mt-3 cuerpo text-smoke medida">{propuesta.razon}</p>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {swatches(propuesta).map((s) => (
            <li key={s.rol} className="flex flex-col gap-2">
              <span
                aria-hidden
                style={{ background: s.hex }}
                className="block h-20 rounded-[8px] border border-[var(--scale)]"
              />
              <span className="mono-sm text-ash">{s.hex}</span>
              <span className="etiqueta text-smoke -mt-1">{s.rol}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Boton
            variante={aceptada ? "contorno" : "heat"}
            onClick={() => cambiar({ paleta: propuesta })}
          >
            {aceptada ? (
              <>
                <Check /> Paleta aceptada
              </>
            ) : (
              "Usar esta paleta"
            )}
          </Boton>

          <Boton
            variante="contorno"
            disabled={quedan <= 0}
            onClick={() => cambiar({ alternativa: estado.alternativa + 1, paleta: null })}
          >
            <Shuffle />
            {quedan > 0
              ? `Ver otra (${quedan} ${quedan === 1 ? "restante" : "restantes"})`
              : "Sin alternativas restantes"}
          </Boton>
        </div>
      </div>

      <p className="cuerpo text-slag medida">
        La matriz cruza tipo de producto, audiencia y registro emocional. Si cambias el tipo o
        la audiencia en el paso anterior, la propuesta cambia con ellos.
      </p>
    </div>
  );
}
