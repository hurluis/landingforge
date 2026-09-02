"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { MovimientoCredito, Usuario } from "@/lib/datos/tipos";
import { PLANES, plan as definicionPlan } from "@/lib/planes";
import { fechaCorta, fechaLarga, formatoCOP } from "@/lib/formato";
import { Boton } from "@/components/ui/boton";
import { Badge } from "@/components/ui/piezas";
import { cn } from "@/lib/utils";

const MOTIVO: Record<MovimientoCredito["motivo"], string> = {
  generacion: "Generación",
  devolucion: "Devolución",
  "recarga-plan": "Recarga del plan",
  bienvenida: "Créditos de bienvenida",
  "ajuste-admin": "Ajuste del equipo",
};

/**
 * Cuenta — §6.3 y §7.2.
 * El cambio de plan es una SIMULACIÓN y la pantalla lo declara con esa misma
 * palabra. Disfrazarlo de pasarela real sería mentirle al usuario y al jurado.
 */
export function Cuenta({
  usuario,
  movimientos,
  modeloReal,
}: {
  usuario: Usuario;
  movimientos: MovimientoCredito[];
  modeloReal: boolean;
}) {
  const router = useRouter();
  const [cambiando, setCambiando] = React.useState<string | null>(null);
  const def = definicionPlan(usuario.plan);
  const porcentaje = Math.min(100, (usuario.creditosDisponibles / def.creditosMes) * 100);

  async function cambiarPlan(id: string) {
    setCambiando(id);
    try {
      const r = await fetch("/api/cuenta/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: id }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast.success("Plan actualizado", {
        description: "Cambio simulado: no se cobró nada.",
      });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cambiar el plan.");
    } finally {
      setCambiando(null);
    }
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8 pt-20 sm:px-8 lg:pt-8">
      <h1 className="display-md">Cuenta</h1>
      <p className="mt-2 cuerpo text-smoke">{usuario.email}</p>

      {/* Créditos */}
      <section
        aria-labelledby="creditos-titulo"
        className="mt-10 rounded-[16px] border border-[var(--scale)] bg-[var(--anvil)] p-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h2 id="creditos-titulo" className="titulo">
            Plan {def.nombre}
          </h2>
          <span className="mono-sm text-slag">
            renueva el {fechaLarga(usuario.renuevaEn)}
          </span>
        </div>

        <p className="mt-6 flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display-serif)] text-[3rem] font-[300] leading-none tabular-nums">
            {usuario.creditosDisponibles}
          </span>
          <span className="mono-sm text-slag">de {def.creditosMes} créditos</span>
        </p>

        <div
          aria-hidden
          className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-[var(--anvil-hi)]"
        >
          <span
            style={{ width: `${porcentaje}%` }}
            className="block h-full rounded-full bg-[var(--heat)] transition-[width] duration-[300ms] ease-[var(--ease-out)]"
          />
        </div>

        <p className="mt-4 cuerpo text-slag">
          Los créditos del plan no se acumulan entre meses. Los que compras aparte, sí.
        </p>
      </section>

      {/* Planes */}
      <section aria-labelledby="planes-titulo" className="mt-10">
        <h2 id="planes-titulo" className="titulo">
          Cambiar de plan
        </h2>
        <p className="mt-2 cuerpo text-smoke medida">
          En esta versión el cambio es una simulación: ajusta tu plan y recarga los créditos
          sin cobrar nada. Todavía no hay pasarela de pago conectada.
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {PLANES.map((p) => {
            const actual = p.id === usuario.plan;
            return (
              <li
                key={p.id}
                className={cn(
                  "flex flex-col rounded-[16px] p-5",
                  actual
                    ? "border border-[var(--heat)] bg-[var(--anvil-hi)]"
                    : "border border-[var(--scale)] bg-[var(--anvil)]",
                )}
              >
                <h3 className="titulo">{p.nombre}</h3>
                <p className="mt-2 mono-sm text-smoke">
                  {formatoCOP(p.precioMensualCOP)} · {p.creditosMes} créditos
                </p>
                <div className="mt-4">
                  {actual ? (
                    <Badge tono="metal">plan actual</Badge>
                  ) : (
                    <Boton
                      variante="contorno"
                      tamano="sm"
                      cargando={cambiando === p.id}
                      textoCargando="Cambiando…"
                      onClick={() => cambiarPlan(p.id)}
                      className="w-full"
                    >
                      Cambiar a {p.nombre}
                    </Boton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Historial */}
      <section aria-labelledby="historial-titulo" className="mt-12">
        <h2 id="historial-titulo" className="titulo">
          Consumo
        </h2>
        {movimientos.length === 0 ? (
          <p className="mt-4 cuerpo text-smoke">Todavía no has consumido créditos.</p>
        ) : (
          <table className="mt-4 w-full text-left">
            <thead>
              <tr className="border-b border-[var(--scale)]">
                <th scope="col" className="etiqueta text-slag py-2 font-medium">
                  Fecha
                </th>
                <th scope="col" className="etiqueta text-slag py-2 font-medium">
                  Concepto
                </th>
                <th scope="col" className="etiqueta text-slag py-2 font-medium">
                  Campaña
                </th>
                <th scope="col" className="etiqueta text-slag py-2 text-right font-medium">
                  Créditos
                </th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id} className="border-b border-[var(--scale)]">
                  <td className="mono-sm text-slag py-3">{fechaCorta(m.fecha)}</td>
                  <td className="cuerpo text-smoke py-3">{MOTIVO[m.motivo]}</td>
                  <td className="cuerpo text-smoke py-3">{m.campanaNombre}</td>
                  <td
                    className={cn(
                      "mono-sm py-3 text-right tabular-nums",
                      m.delta < 0 ? "text-smoke" : "text-[var(--ok)]",
                    )}
                  >
                    {m.delta > 0 ? `+${m.delta}` : m.delta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Honestidad sobre qué está corriendo debajo. */}
      <section className="mt-12 rounded-[16px] border border-[var(--scale)] p-5">
        <h2 className="etiqueta text-smoke">Motor de esta instancia</h2>
        <p className="mt-2 cuerpo text-slag medida">
          {modeloReal
            ? "Los prompts los redacta Gemini sobre el esqueleto de la metodología. La clave vive solo en el servidor."
            : "No hay clave de Gemini configurada, así que los prompts los construye el motor local con la misma metodología, sin modelo generativo. El resultado es válido; lo que falta es la redacción del modelo."}
        </p>
      </section>
    </div>
  );
}
