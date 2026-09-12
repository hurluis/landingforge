"use client";

import { Check } from "@phosphor-icons/react/dist/ssr";
import type { TipologiaSeccion } from "@/lib/datos/tipos";
import { TIPOLOGIAS } from "@/lib/metodologia/tipologias";
import { Lamina } from "@/components/marketing/lamina";
import { useT } from "@/lib/i18n/cliente";
import { cn } from "@/lib/utils";
import type { EstadoEstudio } from "./estado";

/**
 * Paso 4 — Las secciones (§7.1).
 *
 * Las nueve tipologías como fotogramas 9:16 seleccionables, con su estructura
 * esquemática dibujada dentro y en la paleta que la matriz acaba de asignar:
 * el usuario ve su identidad aplicada antes de gastar un crédito.
 */
export function PasoSecciones({
  estado,
  cambiar,
}: {
  estado: EstadoEstudio;
  cambiar: (parcial: Partial<EstadoEstudio>) => void;
}) {
  const t = useT();
  const paleta = estado.paleta;
  if (!paleta) return null;

  function alternar(id: TipologiaSeccion) {
    const puestas = estado.secciones.includes(id)
      ? estado.secciones.filter((s) => s !== id)
      : [...estado.secciones, id];
    cambiar({ secciones: puestas });
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="cuerpo text-smoke medida">
        {t("Vienen marcadas las cuatro de mayor impacto. Cada sección consume un crédito.")}
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TIPOLOGIAS.map((tipo) => {
          const elegida = estado.secciones.includes(tipo.id);
          return (
            <li key={tipo.id}>
              <button
                type="button"
                onClick={() => alternar(tipo.id)}
                aria-pressed={elegida}
                className={cn(
                  "group block w-full text-left",
                  "transition-transform duration-[140ms] ease-[var(--ease-out)] active:scale-[0.97]",
                )}
              >
                <span
                  className={cn(
                    "relative block aspect-[9/16] overflow-hidden rounded-[12px] bg-[var(--sunk)]",
                    "transition-opacity duration-[200ms] ease-[var(--ease-out)]",
                    elegida
                      ? "borde-templado opacity-100"
                      : "border border-[var(--scale)] opacity-55 hf:opacity-80",
                  )}
                >
                  <Lamina tipologia={tipo.id} paleta={paleta} t={t} />
                  {elegida && (
                    <span className="absolute right-2 top-2 grid size-5 place-items-center rounded-full bg-[var(--heat)] text-[#17120A]">
                      <Check weight="bold" className="size-3" />
                    </span>
                  )}
                </span>
                <span className="mt-2 flex items-baseline gap-1.5">
                  <span className="mono-sm text-slag">{String(tipo.numero).padStart(2, "0")}</span>
                  <span
                    className={cn(
                      "etiqueta transition-colors duration-[140ms] ease-[var(--ease-out)]",
                      elegida ? "text-ash" : "text-slag",
                    )}
                  >
                    {t(tipo.nombre)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
