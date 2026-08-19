"use client";

import * as React from "react";
import { Campo, Envoltorio } from "@/components/ui/campo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Chip } from "@/components/ui/piezas";
import { LIMITE_CARACTERES_TEXTO } from "@/lib/metodologia/reglas-prompt";
import { contarCaracteres, formatoCOP, mascaraCOP } from "@/lib/formato";
import type { EstadoEstudio } from "./estado";
import { OPCIONES_TIPO } from "./estado";
import type { TipoProducto } from "@/lib/datos/tipos";

/**
 * Paso 2 — El mercado (§7.1).
 *
 * El campo de precio lleva máscara de formato en vivo: 99900 se convierte en
 * $99.900 mientras se escribe. Es un detalle pequeño que demuestra
 * conocimiento del mercado dentro del propio producto.
 */

const GENEROS = [
  { valor: "f", texto: "Mujeres" },
  { valor: "m", texto: "Hombres" },
  { valor: "mixto", texto: "Mixto" },
] as const;

function CampoPrecio({
  id,
  etiqueta,
  valor,
  alCambiar,
  opcional,
  ayuda,
}: {
  id: string;
  etiqueta: string;
  valor: number;
  alCambiar: (n: number) => void;
  opcional?: boolean;
  ayuda?: string;
}) {
  const [texto, setTexto] = React.useState(valor > 0 ? formatoCOP(valor) : "");

  return (
    <Envoltorio id={id} etiqueta={etiqueta} opcional={opcional} ayuda={ayuda}>
      <input
        id={id}
        inputMode="numeric"
        value={texto}
        onChange={(e) => {
          const { texto: formateado, valor: n } = mascaraCOP(e.target.value);
          setTexto(formateado);
          alCambiar(n);
        }}
        placeholder="$99.900"
        className="h-10 w-full rounded-[10px] border border-[var(--line)] bg-[var(--surface-1)] px-3 font-[family-name:var(--font-geist-mono)] text-[0.9375rem] tabular-nums text-hi placeholder:text-lo transition-colors duration-[140ms] ease-[var(--ease-out)] focus:border-[var(--line-strong)] hf:border-[var(--line-strong)]"
      />
    </Envoltorio>
  );
}

export function PasoMercado({
  estado,
  cambiar,
}: {
  estado: EstadoEstudio;
  cambiar: (parcial: Partial<EstadoEstudio>) => void;
}) {
  const largo = contarCaracteres(estado.beneficioPrincipal);
  const excede = largo > LIMITE_CARACTERES_TEXTO;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <label htmlFor="tipo" className="etiqueta text-mid">
          Tipo de producto
        </label>
        <Select
          value={estado.tipo}
          onValueChange={(v) => cambiar({ tipo: v as TipoProducto, paleta: null, alternativa: 0 })}
        >
          <SelectTrigger id="tipo">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {OPCIONES_TIPO.map((o) => (
              <SelectItem key={o.valor} value={o.valor}>
                {o.texto}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[0.8125rem] text-lo">
          Es la primera dimensión de la matriz que asigna tu paleta.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="etiqueta text-mid mb-2">Audiencia</legend>
        <div className="flex flex-wrap gap-2">
          {GENEROS.map((g) => (
            <Chip
              key={g.valor}
              activo={estado.audiencia.genero === g.valor}
              aria-pressed={estado.audiencia.genero === g.valor}
              onClick={() =>
                cambiar({
                  audiencia: { ...estado.audiencia, genero: g.valor },
                  paleta: null,
                  alternativa: 0,
                })
              }
            >
              {g.texto}
            </Chip>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Campo
            id="edad-min"
            etiqueta="Edad desde"
            type="number"
            min={13}
            max={90}
            value={estado.audiencia.edadMin}
            onChange={(e) =>
              cambiar({
                audiencia: { ...estado.audiencia, edadMin: Number(e.target.value) },
                paleta: null,
                alternativa: 0,
              })
            }
          />
          <Campo
            id="edad-max"
            etiqueta="Edad hasta"
            type="number"
            min={13}
            max={90}
            value={estado.audiencia.edadMax}
            onChange={(e) =>
              cambiar({
                audiencia: { ...estado.audiencia, edadMax: Number(e.target.value) },
                paleta: null,
                alternativa: 0,
              })
            }
            error={
              estado.audiencia.edadMax < estado.audiencia.edadMin
                ? "La edad máxima no puede ser menor que la mínima."
                : undefined
            }
          />
        </div>
      </fieldset>

      <div className="md:col-span-2">
        <Campo
          id="beneficio"
          etiqueta="Beneficio principal"
          value={estado.beneficioPrincipal}
          onChange={(e) => cambiar({ beneficioPrincipal: e.target.value })}
          placeholder="Piel firme en 8 semanas"
          maxLength={80}
          contador={`${largo} / ${LIMITE_CARACTERES_TEXTO}`}
          ayuda={
            excede
              ? undefined
              : "Se usa como titular renderizado. Por encima de 25 caracteres el render deforma las letras."
          }
          error={
            excede
              ? `Se pasa por ${largo - LIMITE_CARACTERES_TEXTO} caracteres. Puedes continuar, pero el validador lo marcará en cada prompt.`
              : undefined
          }
        />
      </div>

      <CampoPrecio
        id="precio"
        etiqueta="Precio actual"
        valor={estado.precioCOP}
        alCambiar={(n) => cambiar({ precioCOP: n })}
        ayuda="Con punto de miles. Así va a la pieza."
      />
      <CampoPrecio
        id="precio-tachado"
        etiqueta="Precio tachado"
        valor={estado.precioTachadoCOP ?? 0}
        alCambiar={(n) => cambiar({ precioTachadoCOP: n > 0 ? n : undefined })}
        opcional
        ayuda="El precio anterior, si hay descuento."
      />
    </div>
  );
}
