"use client";

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { ChatCircle, X, ArrowUp } from "@phosphor-icons/react/dist/ssr";
import type { Mensaje } from "@/lib/datos/tipos";
import { cn } from "@/lib/utils";

/**
 * F3 — Asistente LandingForge (§7.3).
 *
 * Botón flotante de 48px abajo a la derecha. Al abrir, un panel de 380×560
 * que escala desde su origen: como el panel y el botón comparten esquina, el
 * `transform-origin: bottom right` ES la posición del disparador. En móvil,
 * hoja a pantalla completa que sube desde abajo con --ease-drawer.
 *
 * El indicador de escritura es el barrido de luz de contorno (movimiento 9),
 * no tres puntos que rebotan. Va en CSS, así que sigue fluido mientras la
 * página está ocupada recibiendo tokens.
 *
 * El historial vive en memoria de sesión: no se persiste en base de datos.
 */

const LIMITE_MENSAJES = 20;

const SALUDO =
  "Pregúntame lo que quieras sobre LandingForge: cómo funciona, qué genera, cuánto cuesta o por qué no usamos plantillas.";

const SUGERENCIAS = [
  "¿Por qué no es una plantilla?",
  "¿Cuánto cuesta empezar?",
  "¿Los prompts son míos?",
] as const;

export function Asistente() {
  const [abierto, setAbierto] = React.useState(false);
  const [mensajes, setMensajes] = React.useState<Mensaje[]>([]);
  const [borrador, setBorrador] = React.useState("");
  const [escribiendo, setEscribiendo] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const finRef = React.useRef<HTMLDivElement>(null);
  const entradaRef = React.useRef<HTMLTextAreaElement>(null);

  const agotado = mensajes.length >= LIMITE_MENSAJES;

  React.useEffect(() => {
    finRef.current?.scrollIntoView({ block: "end" });
  }, [mensajes, escribiendo]);

  const enviar = React.useCallback(
    async (texto: string) => {
      const limpio = texto.trim();
      if (limpio === "" || escribiendo || agotado) return;

      setError(null);
      setBorrador("");
      const historial: Mensaje[] = [...mensajes, { rol: "usuario", texto: limpio }];
      setMensajes([...historial, { rol: "asistente", texto: "" }]);
      setEscribiendo(true);

      try {
        const respuesta = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mensajes: historial }),
        });

        if (!respuesta.ok || !respuesta.body) {
          const datos = await respuesta.json().catch(() => null);
          throw new Error(datos?.error ?? "No se pudo conectar con el asistente.");
        }

        const lector = respuesta.body.getReader();
        const decodificador = new TextDecoder();
        let acumulado = "";
        for (;;) {
          const { done, value } = await lector.read();
          if (done) break;
          acumulado += decodificador.decode(value, { stream: true });
          setMensajes([...historial, { rol: "asistente", texto: acumulado }]);
        }
      } catch (e) {
        setMensajes(historial);
        setError(e instanceof Error ? e.message : "Se cortó la conexión. Vuelve a preguntar.");
      } finally {
        setEscribiendo(false);
      }
    },
    [agotado, escribiendo, mensajes],
  );

  return (
    <RadixDialog.Root open={abierto} onOpenChange={setAbierto} modal={false}>
      <RadixDialog.Trigger asChild>
        <button
          type="button"
          aria-label="Abrir el asistente de LandingForge"
          className={cn(
            "fixed bottom-6 right-6 z-40 grid size-12 place-items-center rounded-full",
            "bg-[var(--anvil-hi)] text-smoke border border-[var(--scale)] shadow-elev-1",
            "transition-[border-color,color,transform] duration-[140ms] ease-[var(--ease-out)]",
            "hf:border-[var(--heat)] hf:text-ash active:scale-[0.97]",
            "data-[state=open]:opacity-0 data-[state=open]:pointer-events-none",
          )}
        >
          <ChatCircle  className="size-5" />
        </button>
      </RadixDialog.Trigger>

      <RadixDialog.Portal>
        <RadixDialog.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            entradaRef.current?.focus();
          }}
          className={cn(
            "fixed z-50 flex flex-col bg-[var(--anvil-hi)] shadow-elev-2",
            // Móvil: hoja a pantalla completa que sube desde abajo.
            "inset-x-0 bottom-0 top-0 rounded-none",
            "data-[state=open]:animate-[hoja-entra_320ms_var(--ease-drawer)]",
            "data-[state=closed]:animate-[hoja-sale_260ms_var(--ease-drawer)]",
            // Escritorio: panel anclado al botón, escalando desde su esquina.
            "sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[560px] sm:w-[380px] sm:rounded-[16px]",
            "sm:origin-bottom-right",
            "sm:data-[state=open]:animate-[menu-entra_var(--dur-menu)_var(--ease-out)]",
            "sm:data-[state=closed]:animate-[menu-sale_150ms_var(--ease-out)]",
          )}
        >
          <header className="flex items-center justify-between gap-4 border-b border-[var(--scale)] px-4 py-3">
            <RadixDialog.Title className="etiqueta text-ash">
              Asistente LandingForge
            </RadixDialog.Title>
            <RadixDialog.Close
              aria-label="Cerrar el asistente"
              className={cn(
                "grid size-8 place-items-center rounded-[8px] text-smoke",
                "transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-ash active:scale-[0.97]",
              )}
            >
              <X className="size-4" />
            </RadixDialog.Close>
          </header>

          <div
            className="flex-1 overflow-y-auto px-4 py-4"
            aria-live="polite"
            aria-atomic="false"
          >
            <p className="cuerpo text-smoke">{SALUDO}</p>

            {mensajes.length === 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {SUGERENCIAS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => enviar(s)}
                    className={cn(
                      "rounded-full border border-[var(--scale)] px-3 h-8 text-[0.8125rem] text-smoke",
                      "transition-[border-color,color,transform] duration-[140ms] ease-[var(--ease-out)]",
                      "hf:border-[var(--scale-hi)] hf:text-ash active:scale-[0.97]",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <ol className="mt-6 flex flex-col gap-4">
              {mensajes.map((m, i) => (
                <li
                  key={i}
                  className={cn(
                    "cuerpo",
                    m.rol === "usuario"
                      ? "self-end max-w-[85%] rounded-[12px] bg-[var(--anvil)] px-3 py-2 text-ash"
                      : "text-smoke whitespace-pre-wrap",
                  )}
                >
                  {m.texto ||
                    (escribiendo && i === mensajes.length - 1 ? (
                      <span
                        aria-label="Escribiendo"
                        className="barrido-calor inline-block h-4 w-24 rounded-[4px] bg-[var(--anvil)]"
                      />
                    ) : null)}
                </li>
              ))}
            </ol>

            {error && (
              <p role="alert" className="mt-4 cuerpo text-[var(--danger)]">
                {error}
              </p>
            )}

            <div ref={finRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(borrador);
            }}
            className="border-t border-[var(--scale)] p-3"
          >
            {agotado ? (
              <p className="cuerpo text-smoke px-1 py-2">
                Esta conversación llegó a su límite de {LIMITE_MENSAJES} mensajes. Recarga la
                página para empezar otra.
              </p>
            ) : (
              <div className="flex items-end gap-2">
                <label htmlFor="asistente-entrada" className="sr-only">
                  Escribe tu pregunta
                </label>
                <textarea
                  id="asistente-entrada"
                  ref={entradaRef}
                  rows={1}
                  value={borrador}
                  onChange={(e) => setBorrador(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      enviar(borrador);
                    }
                  }}
                  placeholder="Escribe tu pregunta"
                  maxLength={1000}
                  className={cn(
                    "min-h-10 max-h-32 flex-1 resize-none rounded-[10px] px-3 py-2",
                    "bg-[var(--anvil)] text-ash text-[0.9375rem] placeholder:text-slag",
                    "border border-[var(--scale)]",
                    "transition-colors duration-[140ms] ease-[var(--ease-out)]",
                    "focus:border-[var(--scale-hi)]",
                  )}
                />
                <button
                  type="submit"
                  disabled={escribiendo || borrador.trim() === ""}
                  aria-label="Enviar pregunta"
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-[10px]",
                    "bg-[var(--anvil)] text-ash border border-[var(--scale)]",
                    "transition-[border-color,background-color,transform] duration-[140ms] ease-[var(--ease-out)]",
                    "hf:border-[var(--heat)] active:scale-[0.97]",
                    "disabled:opacity-40 disabled:pointer-events-none",
                  )}
                >
                  <ArrowUp className="size-4" />
                </button>
              </div>
            )}
          </form>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
