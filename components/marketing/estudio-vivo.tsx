"use client";

import * as React from "react";
import Link from "next/link";
import { Copy, Check } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import type { Prompt } from "@/lib/datos/tipos";
import { TIPOLOGIAS } from "@/lib/metodologia/tipologias";
import { Boton } from "@/components/ui/boton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RevealLineas } from "@/components/motion/reveal";
import { Parallax } from "@/components/motion/interacciones";
import { Lamina } from "@/components/marketing/lamina";
import { asignarPaleta } from "@/lib/metodologia/paletas";
import { cn } from "@/lib/utils";

/**
 * El estudio en vivo — §6.2.7. Deja probar el generador sin cuenta, con
 * límite de un prompt por visitante. Después del primero el bloque muta.
 *
 * Revela desde la derecha: es la única sección de la página que empieza por
 * ese borde, y la dirección responde a que el resultado aparece a la derecha
 * del formulario.
 */
const FONDO = ["hero", "testimonios", "antes-despues", "precios", "estilo-de-vida", "confianza"] as const;
const PALETAS_FONDO = [
  asignarPaleta("cosmetica", { genero: "f", edadMin: 30, edadMax: 55 }),
  asignarPaleta("suplemento-deportivo", { genero: "m", edadMin: 20, edadMax: 34 }),
  asignarPaleta("skincare-lujo", { genero: "f", edadMin: 28, edadMax: 50 }),
  asignarPaleta("electronica", { genero: "mixto", edadMin: 25, edadMax: 45 }),
  asignarPaleta("capilar", { genero: "f", edadMin: 22, edadMax: 40 }),
  asignarPaleta("clinico", { genero: "mixto", edadMin: 35, edadMax: 65 }),
];

export function EstudioVivo() {
  const [descripcion, setDescripcion] = React.useState("");
  const [tipologia, setTipologia] = React.useState("hero");
  const [cargando, setCargando] = React.useState(false);
  const [prompt, setPrompt] = React.useState<Prompt | null>(null);
  const [agotado, setAgotado] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copiado, setCopiado] = React.useState(false);

  async function generar(e: React.FormEvent) {
    e.preventDefault();
    if (cargando) return;
    setCargando(true);
    setError(null);
    try {
      const respuesta = await fetch("/api/prompts/prueba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcion, tipologia }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        if (datos.codigo === "ya-usado") setAgotado(true);
        throw new Error(datos.error ?? "No se pudo construir el prompt.");
      }
      setPrompt(datos.prompt);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo construir el prompt.");
    } finally {
      setCargando(false);
    }
  }

  async function copiar() {
    if (!prompt) return;
    await navigator.clipboard.writeText(prompt.texto);
    setCopiado(true);
    toast.success("Prompt copiado");
    setTimeout(() => setCopiado(false), 1600);
  }

  return (
    <section aria-labelledby="estudio-titulo" className="relative overflow-hidden py-32 lg:py-36">
      {/* M8 · Capa de fondo a 0.6x: la obra detrás, la herramienta delante.
          Dos capas y no más: tres o más no lee como riqueza, lee como mareo. */}
      <Parallax
        velocidad={0.6}
        recorrido={120}
        className="pointer-events-none absolute inset-0 opacity-[0.38]"
      >
        <div aria-hidden className="flex gap-8 px-10 pt-16">
          {FONDO.map((id, i) => (
            <div key={id} className="w-[240px] shrink-0 blur-[2px]">
              <div className="aspect-[9/16] overflow-hidden rounded-[14px]">
                <Lamina tipologia={id} paleta={PALETAS_FONDO[i]} />
              </div>
            </div>
          ))}
        </div>
      </Parallax>
      <div className="relative z-[1] mx-auto max-w-[1400px] px-6 lg:px-10">
        <RevealLineas
          as="h2"
          className="display-lg max-w-[16ch]"
          lineas={["Pruébalo con tu producto", "ahora."]}
        />

        {agotado && !prompt ? (
          <div className="mt-12 max-w-[560px]">
            <p className="cuerpo-lg text-smoke">
              Ya viste cómo se ve. Crea tu cuenta para generar la campaña de nueve secciones.
            </p>
            <Boton asChild variante="heat" tamano="lg" className="mt-6">
              <Link href="/entrar?modo=registro">Crear mi cuenta</Link>
            </Boton>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <form onSubmit={generar} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="prueba-desc" className="etiqueta text-smoke">
                  Describe tu producto en una línea
                </label>
                <textarea
                  id="prueba-desc"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  required
                  minLength={6}
                  maxLength={200}
                  rows={3}
                  placeholder="Faja reductora de compresión media para uso diario"
                  className={cn(
                    "w-full resize-none rounded-[10px] p-3 text-[1.0625rem]",
                    "bg-[var(--anvil)] text-ash placeholder:text-slag",
                    "border border-[var(--scale)]",
                    "transition-colors duration-[140ms] ease-[var(--ease-out)]",
                    "focus:border-[var(--scale-hi)]",
                  )}
                />
                <span className="mono-sm text-slag self-end">{descripcion.length} / 200</span>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="prueba-tipo" className="etiqueta text-smoke">
                  Qué sección quieres ver
                </label>
                <Select value={tipologia} onValueChange={setTipologia}>
                  <SelectTrigger id="prueba-tipo" aria-label="Tipología de sección">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOLOGIAS.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Boton
                type="submit"
                variante="heat"
                tamano="lg"
                cargando={cargando}
                textoCargando="Construyendo…"
                className="self-start"
              >
                Generar un prompt
              </Boton>

              <p className="mono-sm text-slag">un prompt por visitante · sin cuenta</p>

              {error && !agotado && (
                <p role="alert" className="cuerpo text-[var(--danger)]">
                  {error}
                </p>
              )}
            </form>

            {/* El resultado, en un fotograma hundido: es material, no interfaz. */}
            <div
              className={cn(
                "relative flex min-h-[280px] flex-col rounded-[12px] bg-[var(--sunk)] p-4",
                "border border-[var(--scale)]",
                cargando && "barrido-calor",
              )}
            >
              {prompt ? (
                <>
                  <div className="flex items-center justify-between gap-4 pb-3">
                    <span className="mono-sm text-slag">
                      {prompt.palabras} palabras · {prompt.advertencias.length} avisos
                    </span>
                    <button
                      type="button"
                      onClick={copiar}
                      className={cn(
                        "inline-flex items-center gap-1.5 mono-sm text-smoke",
                        "transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-ash active:scale-[0.97]",
                      )}
                    >
                      {copiado ? (
                        <Check className="size-3.5 text-[var(--ok)]" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                      {copiado ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                  <pre className="mono-sm whitespace-pre-wrap text-smoke leading-relaxed">
                    {prompt.texto}
                  </pre>
                </>
              ) : (
                <p className="m-auto max-w-[36ch] text-center cuerpo text-slag">
                  {cargando
                    ? "Construyendo el prompt con la metodología…"
                    : "El prompt aparece aquí, en prosa narrativa y con su bloque de paleta al inicio."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
