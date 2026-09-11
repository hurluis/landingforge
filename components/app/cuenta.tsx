"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import type { MovimientoCredito, Usuario } from "@/lib/datos/tipos";
import { PLANES, plan as definicionPlan } from "@/lib/planes";
import { fechaCorta, fechaLarga, formatoCOP } from "@/lib/formato";
import { Boton } from "@/components/ui/boton";
import {
  ANCHO,
  Banda,
  Celda,
  EstadoVacio,
  Fila,
  Seccion,
  Tabla,
} from "@/components/panel/piezas";
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
 *
 * Abre con el último acto de la película, el frasco en la mano: es la pantalla
 * de lo que ya tienes. Debajo, el saldo en grande, los planes como columnas
 * comparables separadas por filetes y el historial.
 *
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

  const detalles: [string, string][] = [
    ["Renueva el", fechaLarga(usuario.renuevaEn)],
    [
      "Campañas guardadas",
      def.campanasGuardadas === "ilimitadas" ? "Ilimitadas" : String(def.campanasGuardadas),
    ],
    ["Paletas alternativas", String(def.paletasAlternativas)],
    ["Marcas o clientes", def.marcas === "ilimitadas" ? "Ilimitadas" : String(def.marcas)],
    ["Soporte", def.soporte],
  ];

  return (
    <>
      <Banda
        fotograma="/secuencia/0400.jpg"
        encuadre="50% 38%"
        rotulo="Cuenta"
        titulo={`Plan ${def.nombre}`}
        descripcion={usuario.email}
      />

      <div className={cn(ANCHO, "mt-10 flex flex-col gap-16 pb-24")}>
        {/* ---------------- Saldo ---------------- */}
        <section
          aria-labelledby="creditos-titulo"
          className="grid gap-x-16 gap-y-10 border-t border-[var(--scale)] pt-10 lg:grid-cols-[1.3fr_1fr]"
        >
          <div>
            <h2 id="creditos-titulo" className="etiqueta text-slag">
              Créditos este mes
            </h2>
            <p className="mt-4 flex items-baseline gap-3">
              <span className="font-[family-name:var(--font-round)] text-[5rem] font-semibold leading-none tracking-[-0.04em] tabular-nums">
                {usuario.creditosDisponibles}
              </span>
              <span className="mono-sm text-slag">de {def.creditosMes} créditos</span>
            </p>
            <div aria-hidden className="mt-6 h-1 w-full max-w-lg overflow-hidden rounded-full bg-[var(--scale)]">
              <span
                style={{ width: `${porcentaje}%` }}
                className="block h-full rounded-full bg-[var(--heat)] transition-[width] duration-[300ms] ease-[var(--ease-out)]"
              />
            </div>
            <p className="mt-5 cuerpo text-smoke medida">
              Un crédito es una sección. Los del plan no se acumulan entre meses; los que compras
              aparte, sí.
            </p>
          </div>

          <dl className="grid content-start gap-y-4">
            {detalles.map(([dt, dd]) => (
              <div
                key={dt}
                className="flex items-baseline justify-between gap-4 border-b border-[var(--scale)] pb-4 last:border-b-0"
              >
                <dt className="cuerpo text-smoke">{dt}</dt>
                <dd className="mono-sm text-ash">{dd}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------------- Planes ---------------- */}
        <Seccion
          titulo="Cambiar de plan"
          descripcion="En esta versión el cambio es una simulación: ajusta tu plan y recarga los créditos sin cobrar nada. Todavía no hay pasarela de pago conectada."
        >
          <ul className="grid gap-px overflow-hidden bg-[var(--scale)] sm:grid-cols-3">
            {PLANES.map((p) => {
              const actual = p.id === usuario.plan;
              return (
                <li key={p.id} className="relative flex flex-col bg-[var(--void)] p-6 sm:p-8">
                  {actual && (
                    <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-[var(--heat)]" />
                  )}
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="titulo">{p.nombre}</h3>
                    {actual && (
                      <span className="inline-flex items-center gap-1 etiqueta text-[var(--heat)]">
                        <Check weight="bold" className="size-3.5" /> Actual
                      </span>
                    )}
                  </div>
                  <p className="mt-5 font-[family-name:var(--font-round)] text-[2rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">
                    {formatoCOP(p.precioMensualCOP)}
                    <span className="ml-1.5 mono-sm font-normal tracking-normal text-slag">/ mes</span>
                  </p>
                  <p className="mt-3 mono-sm text-smoke">{p.creditosMes} créditos al mes</p>
                  <div className="mt-auto pt-8">
                    {actual ? (
                      <p className="cuerpo text-slag">Es tu plan.</p>
                    ) : (
                      <Boton
                        variante="contorno"
                        tamano="sm"
                        cargando={cambiando === p.id}
                        textoCargando="Cambiando…"
                        onClick={() => cambiarPlan(p.id)}
                        className="w-full rounded-full"
                      >
                        Cambiar a {p.nombre}
                      </Boton>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Seccion>

        {/* ---------------- Historial ---------------- */}
        <Seccion titulo="Consumo" descripcion="Cada crédito que entra o sale, con la campaña a la que fue.">
          {movimientos.length === 0 ? (
            <EstadoVacio titulo="Todavía no has consumido créditos." />
          ) : (
            <Tabla
              descripcion="Historial de consumo y recarga de créditos."
              cabeceras={["Fecha", "Concepto", "Campaña", "Créditos"]}
              ancho="min-w-[560px]"
            >
              {movimientos.map((m) => (
                <Fila key={m.id}>
                  <Celda mono>{fechaCorta(m.fecha)}</Celda>
                  <Celda>{MOTIVO[m.motivo]}</Celda>
                  <Celda>{m.campanaNombre}</Celda>
                  <Celda
                    mono
                    className={cn(
                      "pr-0 text-right tabular-nums",
                      m.delta < 0 ? "text-smoke" : "text-[var(--ok)]",
                    )}
                  >
                    {m.delta > 0 ? `+${m.delta}` : m.delta}
                  </Celda>
                </Fila>
              ))}
            </Tabla>
          )}
        </Seccion>

        {/* Honestidad sobre qué está corriendo debajo. */}
        <Seccion titulo="Motor de esta instancia">
          <p className="-mt-2 cuerpo text-smoke medida">
            {modeloReal
              ? "Los prompts los redacta Gemini sobre el esqueleto de la metodología. La clave vive solo en el servidor."
              : "No hay clave de Gemini configurada, así que los prompts los construye el motor local con la misma metodología, sin modelo generativo. El resultado es válido; lo que falta es la redacción del modelo."}
          </p>
        </Seccion>
      </div>
    </>
  );
}
