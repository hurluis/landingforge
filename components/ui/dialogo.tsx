"use client";

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";
import { Boton } from "@/components/ui/boton";

/**
 * Diálogo — §4.8 prohíbe el modal para tareas que no necesitan interrupción.
 * En este producto el único caso legítimo es borrar una campaña: es
 * destructivo y necesita foco protegido (§7.2).
 *
 * Movimiento 8: entrada centrada, scale(0.97) → 1, 260ms. Los modales están
 * exentos de la regla de origen porque no cuelgan de un disparador.
 * Radix aporta la trampa de foco, Esc y la devolución del foco al cerrar.
 */

export const Dialogo = RadixDialog.Root;
export const DialogoDisparador = RadixDialog.Trigger;
export const DialogoCierre = RadixDialog.Close;

export function DialogoContenido({
  className,
  children,
  titulo,
  descripcion,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDialog.Content> & {
  titulo: string;
  descripcion: string;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay
        className={cn(
          "fixed inset-0 z-50 bg-black/70",
          "data-[state=open]:animate-[velo-entra_var(--dur-overlay)_var(--ease-out)]",
          "data-[state=closed]:animate-[velo-sale_200ms_var(--ease-out)]",
        )}
      />
      <RadixDialog.Content
        /* Lenis captura la rueda a nivel de documento, así que un diálogo con
           `overflow-y-auto` recibe el evento ya consumido y no scrollea: el
           contenido largo queda inalcanzable con rueda o trackpad. Este
           atributo es la salida oficial de Lenis —deja pasar el gesto al
           scroll nativo del elemento— y va en el contenedor, no en el hijo,
           porque Lenis lo busca subiendo desde el objetivo del evento. */
        data-lenis-prevent
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100vw-32px)] max-w-md",
          "-translate-x-1/2 -translate-y-1/2",
          // Nivel 2: sombra, sin borde.
          "bg-[var(--anvil-hi)] rounded-[16px] shadow-elev-2 p-6",
          "origin-center",
          "data-[state=open]:animate-[modal-entra_var(--dur-overlay)_var(--ease-out)]",
          "data-[state=closed]:animate-[modal-sale_200ms_var(--ease-out)]",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <RadixDialog.Title className="titulo text-ash">{titulo}</RadixDialog.Title>
          <RadixDialog.Close asChild>
            <Boton variante="fantasma" tamano="sm" aria-label="Cerrar" className="-mr-2 -mt-1 px-2">
              <X />
            </Boton>
          </RadixDialog.Close>
        </div>
        <RadixDialog.Description className="mt-2 cuerpo text-smoke">
          {descripcion}
        </RadixDialog.Description>
        <div className="mt-6">{children}</div>
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}
