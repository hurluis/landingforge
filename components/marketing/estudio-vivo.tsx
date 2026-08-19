"use client";

import * as React from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
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
import { Revelar } from "@/components/ui/revelar";
import { cn } from "@/lib/utils";

/**
 * El estudio en vivo — §6.2.7. Deja probar el generador sin cuenta, con
 * límite de un prompt por visitante. Después del primero el bloque muta.
 *
 * Revela desde la derecha: es la única sección de la página que empieza por
 * ese borde, y la dirección responde a que el resultado aparece a la derecha
 * del formulario.
 */
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
    <Revelar as="section" desde="derecha" aria-labelledby="estudio-titulo" className="py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <h2 id="estudio-titulo" className="display-lg medida">
          Pruébalo con tu producto ahora.
        </h2>

        {agotado && !prompt ? (
          <div className="mt-12 max-w-[560px]">
            <p className="cuerpo-lg text-mid">
              Ya viste cómo se ve. Crea tu cuenta para generar la campaña de nueve secciones.
            </p>
            <Boton asChild variante="primario" tamano="lg" className="mt-6">
              <Link href="/entrar?modo=registro">Crear mi cuenta</Link>
            </Boton>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <form onSubmit={generar} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="prueba-desc" className="etiqueta text-mid">
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
                    "bg-[var(--surface-1)] text-hi placeholder:text-lo",
                    "border border-[var(--line)]",
                    "transition-colors duration-[140ms] ease-[var(--ease-out)]",
                    "focus:border-[var(--line-strong)]",
                  )}
                />
                <span className="mono-sm text-lo self-end">{descripcion.length} / 200</span>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="prueba-tipo" className="etiqueta text-mid">
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
                variante="primario"
                tamano="lg"
                cargando={cargando}
                textoCargando="Construyendo…"
                className="self-start"
              >
                Generar un prompt
              </Boton>

              <p className="mono-sm text-lo">un prompt por visitante · sin cuenta</p>

              {error && !agotado && (
                <p role="alert" className="cuerpo text-[var(--danger)]">
                  {error}
                </p>
              )}
            </form>

            {/* El resultado, en un fotograma hundido: es material, no interfaz. */}
            <div
              className={cn(
                "relative flex min-h-[280px] flex-col rounded-[12px] bg-[var(--surface-sunk)] p-4",
                "border border-[var(--line)]",
                cargando && "barrido-rim",
              )}
            >
              {prompt ? (
                <>
                  <div className="flex items-center justify-between gap-4 pb-3">
                    <span className="mono-sm text-lo">
                      {prompt.palabras} palabras · {prompt.advertencias.length} avisos
                    </span>
                    <button
                      type="button"
                      onClick={copiar}
                      className={cn(
                        "inline-flex items-center gap-1.5 mono-sm text-mid",
                        "transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-hi active:scale-[0.97]",
                      )}
                    >
                      {copiado ? (
                        <Check strokeWidth={1.5} className="size-3.5 text-[var(--ok)]" />
                      ) : (
                        <Copy strokeWidth={1.5} className="size-3.5" />
                      )}
                      {copiado ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                  <pre className="mono-sm whitespace-pre-wrap text-mid leading-relaxed">
                    {prompt.texto}
                  </pre>
                </>
              ) : (
                <p className="m-auto max-w-[36ch] text-center cuerpo text-lo">
                  {cargando
                    ? "Construyendo el prompt con la metodología…"
                    : "El prompt aparece aquí, en prosa narrativa y con su bloque de paleta al inicio."}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </Revelar>
  );
}
