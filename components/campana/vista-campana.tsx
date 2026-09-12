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
import { useT } from "@/lib/i18n/cliente";

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
  const t = useT();
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
      toast.success(t("Prompt guardado"));
      setBorradores((b) => {
        const resto = { ...b };
        delete resto[prompt.id];
        return resto;
      });
      router.refresh();
    } catch (e) {
      toast.error(t("No se pudo guardar"), {
        description: e instanceof Error ? e.message : t("Vuelve a intentarlo."),
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
      toast.success(t("Campaña renombrada"));
      router.refresh();
    } catch (e) {
      setNombre(campana.nombre);
      toast.error(e instanceof Error ? e.message : t("No se pudo renombrar."));
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
    <div className="flex flex-1 flex-col">
      {/* ---- Cabecera: nombre editable y paleta con hex copiables ---- */}
      {/* La tira de la paleta arriba, a todo el ancho: la identidad de esta
          campaña, como el filete de temple es la del modo administración. */}
      <div aria-hidden className="flex h-1.5">
        {swatches(campana.paleta).map((s) => (
          <span key={s.rol} className="flex-1" style={{ background: s.hex }} />
        ))}
      </div>
      <header className="border-b border-[var(--scale)] px-5 pb-8 pt-10 sm:px-8">
        <p className="mb-4 flex items-center gap-3 etiqueta text-smoke">
          <span aria-hidden className="h-px w-8 bg-current" />
          Campaña · {campana.producto.nombre}
        </p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <label htmlFor="nombre-campana" className="sr-only">
              {t("Nombre de la campaña")}
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
                "display-lg w-full max-w-[24ch] rounded-[8px] bg-transparent px-2 -mx-2",
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
            <Boton variante="contorno" tamano="sm" className="rounded-full" onClick={() => exportar("md")}>
              <DownloadSimple  /> .md
            </Boton>
            <Boton variante="contorno" tamano="sm" className="rounded-full" onClick={() => exportar("json")}>
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
          aria-label={t("Secciones de la campaña")}
          className={cn(
            "border-[var(--scale)] p-3 lg:border-r",
            panel === "secciones" ? "block" : "hidden lg:block",
          )}
        >
          <ul className="flex flex-col gap-1">
            {ordenadas.map((tipo) => {
              const p = campana.prompts.find((x) => x.tipologia === tipo.id);
              const fallida = campana.seccionesFallidas.includes(tipo.id);
              const seleccionada = activa === tipo.id && !fallida;
              const avisos = p?.advertencias.length ?? 0;
              return (
                <li key={tipo.id}>
                  <button
                    type="button"
                    disabled={fallida}
                    onClick={() => {
                      setActiva(tipo.id);
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
                        {String(tipo.numero).padStart(2, "0")}
                      </span>
                      <span className="etiqueta truncate">{t(tipo.nombre)}</span>
                    </span>
                    {fallida ? (
                      <Badge tono="peligro">{t("falló")}</Badge>
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
                      {t("adjunta la foto del producto")}
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
                    textoCargando={t("Guardando…")}
                    onClick={guardar}
                  >
                    <FloppyDisk  />
                    {sucio ? t("Guardar cambios") : "Guardado"}
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
                  "font-[family-name:var(--font-geist-mono)] text-[0.8125rem] leading-relaxed",
                  "border border-[var(--scale)]",
                  "transition-colors duration-[140ms] ease-[var(--ease-out)]",
                  "focus:border-[var(--scale-hi)]",
                )}
              />

              <Validador
                advertencias={validado.advertencias}
                palabras={validado.palabras}
              />

              {/* El generador de imágenes se enciende con
                  FEATURE_GENERACION_IMAGENES. La nota de abajo habla de ESTA
                  instancia, no del producto: LandingForge genera la imagen de
                  cada sección, y así lo dice la página. Lo que aquí puede
                  estar apagado es el interruptor de este despliegue. */}
              <div className="flex flex-wrap items-center gap-3 border-t border-[var(--scale)] pt-6">
                <Boton variante="contorno" disabled={!generacionImagenesActiva}>
                  <ImageBroken  />
                  {t("Generar la imagen")}
                </Boton>
                {!generacionImagenesActiva && (
                  <p className="cuerpo text-slag max-w-[52ch]">
                    {t("El generador de imágenes no está activo en esta instancia. Tu prompt ya está listo: cópialo y córrelo donde quieras mientras tanto.")}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="m-auto max-w-[40ch] text-center">
              <h2 className="display-md">{t("Esta campaña no tiene prompts")}</h2>
              <p className="mt-3 cuerpo text-smoke">
                {t("Todas las secciones fallaron y sus créditos volvieron a tu cuenta. Vuelve a intentarlo desde una campaña nueva.")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
