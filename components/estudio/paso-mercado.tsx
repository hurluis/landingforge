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
import { LISTA_MERCADOS, MERCADOS, type Mercado } from "@/lib/metodologia/mercados";
import { contarCaracteres, formatoPrecio, mascaraPrecio } from "@/lib/formato";
import type { EstadoEstudio } from "./estado";
import { OPCIONES_TIPO } from "./estado";
import type { IdMercado, TipoProducto } from "@/lib/datos/tipos";

/**
 * Paso 2 — El mercado (§7.1).
 *
 * Primero el país, porque decide todo lo demás que cambia entre mercados:
 * la moneda, el registro sanitario, si se paga al recibir, qué caras y qué
 * ciudades salen en las piezas. El campo de precio lleva máscara en vivo con
 * el formato de ese país: 99900 se escribe $99.900 en Colombia y 3990,
 * 39,90 € en España. Es un detalle pequeño que demuestra conocimiento del
 * mercado dentro del propio producto.
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
  mercado,
  alCambiar,
  opcional,
  ayuda,
}: {
  id: string;
  etiqueta: string;
  valor: number;
  mercado: Mercado;
  alCambiar: (n: number) => void;
  opcional?: boolean;
  ayuda?: string;
}) {
  const [texto, setTexto] = React.useState(valor > 0 ? formatoPrecio(valor, mercado) : "");

  return (
    <Envoltorio id={id} etiqueta={etiqueta} opcional={opcional} ayuda={ayuda}>
      <input
        id={id}
        inputMode="numeric"
        value={texto}
        onChange={(e) => {
          const { texto: formateado, valor: n } = mascaraPrecio(e.target.value, mercado);
          setTexto(formateado);
          alCambiar(n);
        }}
        placeholder={formatoPrecio(mercado.ejemplo, mercado)}
        className="h-10 w-full rounded-[10px] border border-[var(--scale)] bg-[var(--anvil)] px-3 font-[family-name:var(--font-geist-mono)] text-[0.9375rem] tabular-nums text-ash placeholder:text-slag transition-colors duration-[140ms] ease-[var(--ease-out)] focus:border-[var(--scale-hi)] hf:border-[var(--scale-hi)]"
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
  const mercado = MERCADOS[estado.mercado] ?? MERCADOS.CO;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-2">
        <label htmlFor="mercado" className="etiqueta text-smoke">
          País donde vendes
        </label>
        <Select
          value={estado.mercado}
          /* Otro país es otra moneda: el precio escrito no se reinterpreta,
             se vacía. Cien mil pesos no son cien mil euros. */
          onValueChange={(v) =>
            cambiar({ mercado: v as IdMercado, precio: 0, precioTachado: undefined })
          }
        >
          <SelectTrigger id="mercado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LISTA_MERCADOS.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.id === "INT" ? "Otro país" : m.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[0.8125rem] text-slag">
          {mercado.contraentrega
            ? `Moneda, ${mercado.contraentrega}, ${mercado.registro.replace(/^(el|la) /, "")} y caras de allí.`
            : `Moneda, ${mercado.registro.replace(/^(el|la) /, "")} y caras de allí.`}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="tipo" className="etiqueta text-smoke">
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
        <p className="text-[0.8125rem] text-slag">
          Es la primera dimensión de la matriz que asigna tu paleta.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2 md:col-span-2">
        <legend className="etiqueta text-smoke mb-2">Audiencia</legend>
        <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
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
          <div className="grid w-full max-w-sm grid-cols-2 gap-3">
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

      {/* La `key` con el país vacía el texto al cambiarlo: el campo guarda lo
          escrito en su propio estado, con el formato del país anterior. */}
      <CampoPrecio
        key={`precio-${mercado.id}`}
        id="precio"
        etiqueta="Precio actual"
        valor={estado.precio}
        mercado={mercado}
        alCambiar={(n) => cambiar({ precio: n })}
        ayuda={`En ${mercado.moneda}, con el formato ${mercado.id === "INT" ? "internacional" : `de ${mercado.nombre}`}. Así va a la pieza.`}
      />
      <CampoPrecio
        key={`tachado-${mercado.id}`}
        id="precio-tachado"
        etiqueta="Precio tachado"
        valor={estado.precioTachado ?? 0}
        mercado={mercado}
        alCambiar={(n) => cambiar({ precioTachado: n > 0 ? n : undefined })}
        opcional
        ayuda="El precio anterior, si hay descuento."
      />
    </div>
  );
}
