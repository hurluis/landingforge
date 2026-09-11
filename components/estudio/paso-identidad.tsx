"use client";

import * as React from "react";
import { Check, Shuffle } from "@phosphor-icons/react/dist/ssr";
import { asignarPaleta, swatches } from "@/lib/metodologia/paletas";
import { Boton } from "@/components/ui/boton";
import type { EstadoEstudio } from "./estado";

/**
 * Paso 3 — La identidad (§7.1).
 *
 * El sistema aplica la matriz y propone. El usuario acepta o pide una
 * alternativa, con un máximo de dos: esto no es un selector infinito de color,
 * es una decisión razonada que se puede defender.
 *
 * La paleta se enseña como una tira continua y grande, sin caja alrededor:
 * así se ve cómo conviven los cinco colores, que es lo que la matriz decide.
 * Son las únicas manchas de color libre dentro de la interfaz (§4.2).
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
  const colores = swatches(propuesta);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="display-md">{propuesta.nombre}</h2>
          <span className="mono-sm text-slag">
            alternativa {estado.alternativa} de {MAX_ALTERNATIVAS}
          </span>
        </div>
        <p className="mt-3 cuerpo-lg text-smoke medida">{propuesta.razon}</p>
      </div>

      <div>
        <div className="flex h-40 overflow-hidden rounded-2xl sm:h-52">
          {colores.map((s, i) => (
            <span
              key={s.rol}
              aria-hidden
              style={{ background: s.hex }}
              /* El fondo ocupa más: es el color que más superficie tendrá en
                 cada pieza. */
              className={i === 0 ? "flex-[2]" : "flex-1"}
            />
          ))}
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {colores.map((s) => (
            <li key={s.rol}>
              <span className="etiqueta text-slag">{s.rol}</span>
              <span className="mt-1 block mono-sm text-ash">{s.hex}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--scale)] pt-8">
        <Boton
          variante={aceptada ? "contorno" : "tinta"}
          className="rounded-full"
          onClick={() => cambiar({ paleta: propuesta })}
        >
          {aceptada ? (
            <>
              <Check className="text-[var(--ok)]" /> Paleta aceptada
            </>
          ) : (
            "Usar esta paleta"
          )}
        </Boton>

        <Boton
          variante="contorno"
          className="rounded-full"
          disabled={quedan <= 0}
          onClick={() => cambiar({ alternativa: estado.alternativa + 1, paleta: null })}
        >
          <Shuffle />
          {quedan > 0
            ? `Ver otra (${quedan} ${quedan === 1 ? "restante" : "restantes"})`
            : "Sin alternativas restantes"}
        </Boton>

        <p className="basis-full cuerpo text-slag medida">
          La matriz cruza tipo de producto, audiencia y registro emocional. Si cambias el tipo o
          la audiencia en el paso anterior, la propuesta cambia con ellos.
        </p>
      </div>
    </div>
  );
}
