"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, DownloadSimple, ImageBroken, Paperclip, ArrowsClockwise, FloppyDisk } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import type { Campana, TipologiaSeccion } from "@/lib/datos/tipos";
import { TIPOLOGIAS, nombreTipologia } from "@/lib/metodologia/tipologias";
import { revalidar } from "@/lib/metodologia/reglas-prompt";
import { swatches } from "@/lib/metodologia/paletas";
import { Boton } from "@/components/ui/boton";
import { Badge } from "@/components/ui/piezas";
import { Validador } from "@/components/campana/validador";
import { cn } from "@/lib/utils";

/**
 * Pantalla de campaña — §6.3.
 *
 * Escritorio: dos paneles lado a lado. Móvil: pestañas Secciones / Prompt
 * (§13). El prompt es editable y el validador corre en vivo sobre el texto que
 * el usuario está escribiendo, no sobre el guardado.
 */

export function VistaCampana({
  campana,
  generacionImagenesActiva,
}: {
  campana: Campana;
  generacionImagenesActiva: boolean;
}) {
  const router = useRouter();
  const [activa, setActiva] = React.useState<TipologiaSeccion>(
    campana.prompts[0]?.tipologia ?? "hero",
  );
  const [borradores, setBorradores] = React.useState<Record<string, string>>({});
  const [guardando, setGuardando] = React.useState(false);
  const [copiado, setCopiado] = React.useState<string | null>(null);
  const [panel, setPanel] = React.useState<"secciones" | "prompt">("secciones");
  const [nombre, setNombre] = React.useState(campana.nombre);

  const prompt = campana.prompts.find((p) => p.tipologia === activa) ?? null;
  const texto = prompt ? (borradores[prompt.id] ?? prompt.texto) : "";
  const sucio = prompt ? texto !== prompt.texto : false;

  /* El validador corre sobre lo que hay en pantalla. Es la misma función que
     usa el servidor al guardar: una sola fuente de verdad. */
  const validado = React.useMemo(
    () => (prompt ? revalidar(prompt, texto) : null),
    [prompt, texto],
  );

  async function copiar(valor: string, etiqueta: string) {
    await navigator.clipboard.writeText(valor);
    setCopiado(etiqueta);
    toast.success(`${etiqueta} copiado`);
    setTimeout(() => setCopiado(null), 1600);
  }

  async function guardar() {
    if (!prompt || !sucio) return;
    setGuardando(true);
    try {
      const r = await fetch(`/api/campanas/${campana.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: { tipologia: prompt.tipologia, texto } }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast.success("Prompt guardado");
      setBorradores((b) => {
        const resto = { ...b };
        delete resto[prompt.id];
        return resto;
      });
      router.refresh();
    } catch (e) {
      toast.error("No se pudo guardar", {
        description: e instanceof Error ? e.message : "Vuelve a intentarlo.",
      });
    } finally {
      setGuardando(false);
    }
  }

  async function renombrar() {
    if (nombre.trim() === "" || nombre.trim() === campana.nombre) return;
    try {
      const r = await fetch(`/api/campanas/${campana.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast.success("Campaña renombrada");
      router.refresh();
    } catch (e) {
      setNombre(campana.nombre);
      toast.error(e instanceof Error ? e.message : "No se pudo renombrar.");
    }
  }

  function exportar(formato: "md" | "json") {
    const contenido =
      formato === "json"
        ? JSON.stringify(campana, null, 2)
        : [
            `# ${campana.nombre}`,
            "",
            `Paleta: **${campana.paleta.nombre}** — ${campana.paleta.razon}`,
            "",
            swatches(campana.paleta)
              .map((s) => `- \`${s.hex}\` ${s.rol}`)
              .join("\n"),
            "",
            ...campana.prompts.flatMap((p) => [
              `## ${nombreTipologia(p.tipologia)}`,
              "",
              p.texto,
              "",
              `_${p.palabras} palabras · ${p.advertencias.length} hallazgos del validador_`,
              "",
            ]),
          ].join("\n");

    const blob = new Blob([contenido], {
      type: formato === "json" ? "application/json" : "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${campana.nombre.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase()}.${formato}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const pedidas = [
    ...campana.prompts.map((p) => p.tipologia),
    ...campana.seccionesFallidas,
  ];
  const ordenadas = TIPOLOGIAS.filter((t) => pedidas.includes(t.id));

  return (
    <div className="flex min-h-dvh flex-col">
      {/* ---- Cabecera: nombre editable y paleta con hex copiables ---- */}
      <header className="border-b border-[var(--scale)] px-4 py-6 pt-20 sm:px-8 lg:pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <label htmlFor="nombre-campana" className="sr-only">
              Nombre de la campaña
            </label>
            <input
              id="nombre-campana"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onBlur={renombrar}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
                if (e.key === "Escape") setNombre(campana.nombre);
              }}
              className={cn(
                "display-md w-full max-w-[28ch] rounded-[8px] bg-transparent px-2 -mx-2",
                "border border-transparent",
                "transition-colors duration-[140ms] ease-[var(--ease-out)]",
                "hf:border-[var(--scale)] focus:border-[var(--scale-hi)] focus:bg-[var(--anvil)]",
              )}
            />
            <p className="mt-2 cuerpo text-smoke">
              {campana.prompts.length} de {pedidas.length} secciones ·{" "}
              <span className="mono-sm">{campana.paleta.nombre}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Boton variante="contorno" tamano="sm" onClick={() => exportar("md")}>
              <DownloadSimple  /> .md
            </Boton>
            <Boton variante="contorno" tamano="sm" onClick={() => exportar("json")}>
              <DownloadSimple  /> .json
            </Boton>
          </div>
        </div>

        {/* Paleta asignada, a plena saturación, con hex copiables. */}
        <ul className="mt-6 flex flex-wrap gap-2">
          {swatches(campana.paleta).map((s) => (
            <li key={s.rol}>
              <button
                type="button"
                onClick={() => copiar(s.hex, s.hex)}
                className={cn(
                  "flex items-center gap-2 rounded-full border border-[var(--scale)] pl-1.5 pr-3 h-8",
                  "transition-[border-color,transform] duration-[140ms] ease-[var(--ease-out)]",
                  "hf:border-[var(--scale-hi)] active:scale-[0.97]",
                )}
              >
                <span
                  aria-hidden
                  style={{ background: s.hex }}
                  className="size-5 rounded-full border border-[var(--scale)]"
                />
                <span className="mono-sm text-smoke">{s.hex}</span>
                {copiado === s.hex && (
                  <Check className="size-3.5 text-[var(--ok)]" />
                )}
              </button>
            </li>
          ))}
        </ul>

        {campana.seccionesFallidas.length > 0 && (
          <p className="mt-4 flex flex-wrap items-center gap-2 cuerpo text-ash">
            <ArrowsClockwise  className="size-4" />
            {campana.seccionesFallidas.length}{" "}
            {campana.seccionesFallidas.length === 1 ? "sección falló" : "secciones fallaron"} y
            sus créditos volvieron a tu cuenta. Puedes generarlas de nuevo desde una campaña
            nueva.
          </p>
        )}
      </header>

      {/* Pestañas en móvil. */}
      <div className="flex gap-1 border-b border-[var(--scale)] px-4 lg:hidden">
        {(["secciones", "prompt"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPanel(p)}
            aria-current={panel === p}
            className={cn(
              "relative px-4 py-3 etiqueta capitalize",
              "transition-colors duration-[140ms] ease-[var(--ease-out)]",
              panel === p ? "text-ash" : "text-slag",
            )}
          >
            {p}
            {panel === p && (
              <span aria-hidden className="absolute inset-x-2 bottom-0 h-0.5 bg-[var(--heat)]" />
            )}
          </button>
        ))}
      </div>

      <div className="grid flex-1 lg:grid-cols-[300px_1fr]">
        {/* ---- Panel izquierdo: las secciones con su estado ---- */}
        <nav
          aria-label="Secciones de la campaña"
          className={cn(
            "border-[var(--scale)] p-3 lg:border-r",
            panel === "secciones" ? "block" : "hidden lg:block",
          )}
        >
          <ul className="flex flex-col gap-1">
            {ordenadas.map((t) => {
              const p = campana.prompts.find((x) => x.tipologia === t.id);
              const fallida = campana.seccionesFallidas.includes(t.id);
              const seleccionada = activa === t.id && !fallida;
              const avisos = p?.advertencias.length ?? 0;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    disabled={fallida}
                    onClick={() => {
                      setActiva(t.id);
                      setPanel("prompt");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-[10px] px-3 h-12 text-left",
                      "transition-colors duration-[140ms] ease-[var(--ease-out)]",
                      seleccionada
                        ? "bg-[var(--anvil-hi)] text-ash"
                        : "text-smoke hf:bg-[var(--anvil)] hf:text-ash",
                      fallida && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <span className="flex items-baseline gap-2 min-w-0">
                      <span className="mono-sm text-smoke">
                        {String(t.numero).padStart(2, "0")}
                      </span>
                      <span className="etiqueta truncate">{t.nombre}</span>
                    </span>
                    {fallida ? (
                      <Badge tono="peligro">falló</Badge>
                    ) : avisos > 0 ? (
                      <Badge tono="aviso">{avisos}</Badge>
                    ) : (
                      <Badge tono="ok">ok</Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ---- Panel derecho: el prompt editable + validador ---- */}
        <div
          className={cn(
            "flex flex-col gap-6 p-4 sm:p-8",
            panel === "prompt" ? "flex" : "hidden lg:flex",
          )}
        >
          {prompt && validado ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="titulo">{nombreTipologia(prompt.tipologia)}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {prompt.requiereImagenReferencia && (
                    <Badge tono="maquina">
                      <Paperclip className="size-3" />
                      adjunta la foto del producto
                    </Badge>
                  )}
                  <Boton
                    variante="contorno"
                    tamano="sm"
                    onClick={() => copiar(texto, "Prompt")}
                  >
                    {copiado === "Prompt" ? (
                      <Check className="text-[var(--ok)]" />
                    ) : (
                      <Copy />
                    )}
                    Copiar
                  </Boton>
                  <Boton
                    variante={sucio ? "heat" : "contorno"}
                    tamano="sm"
                    disabled={!sucio}
                    cargando={guardando}
                    textoCargando="Guardando…"
                    onClick={guardar}
                  >
                    <FloppyDisk  />
                    {sucio ? "Guardar cambios" : "Guardado"}
                  </Boton>
                </div>
              </div>

              <label htmlFor="prompt-texto" className="sr-only">
                Texto del prompt de {nombreTipologia(prompt.tipologia)}
              </label>
              <textarea
                id="prompt-texto"
                value={texto}
                onChange={(e) =>
                  setBorradores((b) => ({ ...b, [prompt.id]: e.target.value }))
                }
                spellCheck={false}
                className={cn(
                  "min-h-[380px] w-full flex-1 resize-y rounded-[12px] p-4",
                  "bg-[var(--sunk)] text-smoke",
                  "font-[family-name:var(--font-mono-datos)] text-[0.8125rem] leading-relaxed",
                  "border border-[var(--scale)]",
                  "transition-colors duration-[140ms] ease-[var(--ease-out)]",
                  "focus:border-[var(--scale-hi)]",
                )}
              />

              <Validador
                advertencias={validado.advertencias}
                palabras={validado.palabras}
              />

              {/* F4: interfaz construida, deshabilitada tras bandera (§7). */}
              <div className="flex flex-wrap items-center gap-3 border-t border-[var(--scale)] pt-6">
                <Boton variante="contorno" disabled={!generacionImagenesActiva}>
                  <ImageBroken  />
                  Generar la imagen
                </Boton>
                {!generacionImagenesActiva && (
                  <p className="cuerpo text-slag max-w-[52ch]">
                    La generación de imágenes todavía no está conectada en esta versión. El
                    prompt ya está listo: cópialo y córrelo donde quieras.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="m-auto max-w-[40ch] text-center">
              <h2 className="display-md">Esta campaña no tiene prompts</h2>
              <p className="mt-3 cuerpo text-smoke">
                Todas las secciones fallaron y sus créditos volvieron a tu cuenta. Vuelve a
                intentarlo desde una campaña nueva.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
