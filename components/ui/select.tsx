"use client";

import * as React from "react";
import * as RadixSelect from "@radix-ui/react-select";
import { Check, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Select — Radix, porque la gestión de foco y el teclado se rompen siempre
 * cuando se hacen a mano (§9.1).
 *
 * Movimiento 7 del inventario: escala desde el disparador. El origen es el
 * del propio trigger (`--radix-select-content-transform-origin`), nunca
 * `center`, para que el panel parezca salir de lo que se pulsó.
 */

export const Select = RadixSelect.Root;
export const SelectValue = RadixSelect.Value;

export const SelectTrigger = React.forwardRef<
  React.ComponentRef<typeof RadixSelect.Trigger>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Trigger>
>(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <RadixSelect.Trigger
      ref={ref}
      className={cn(
        "grupo flex h-10 w-full items-center justify-between gap-2 px-3",
        "bg-[var(--anvil)] text-ash text-[0.9375rem] text-left",
        "border border-[var(--scale)] rounded-[10px]",
        "transition-[border-color,background-color] duration-[140ms] ease-[var(--ease-out)]",
        "hf:border-[var(--scale-hi)]",
        "data-[state=open]:border-[var(--scale-hi)]",
        "data-[placeholder]:text-slag",
        "disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {children}
      <RadixSelect.Icon asChild>
        <CaretDown 
          className="size-4 shrink-0 text-slag transition-transform duration-[var(--dur-menu)] ease-[var(--ease-out)] group-data-[state=open]:rotate-180"
        />
      </RadixSelect.Icon>
    </RadixSelect.Trigger>
  );
});

export const SelectContent = React.forwardRef<
  React.ComponentRef<typeof RadixSelect.Content>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Content>
>(function SelectContent({ className, children, ...props }, ref) {
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        ref={ref}
        position="popper"
        sideOffset={6}
        className={cn(
          // Nivel 1 de elevación: sombra, sin borde. Nunca las dos (§4.4).
          "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden",
          "bg-[var(--anvil-hi)] rounded-[10px] shadow-elev-1",
          "origin-[var(--radix-select-content-transform-origin)]",
          "data-[state=open]:animate-[menu-entra_var(--dur-menu)_var(--ease-out)]",
          "data-[state=closed]:animate-[menu-sale_150ms_var(--ease-out)]",
          className,
        )}
        {...props}
      >
        <RadixSelect.Viewport className="p-1 max-h-72">{children}</RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  );
});

export const SelectItem = React.forwardRef<
  React.ComponentRef<typeof RadixSelect.Item>,
  React.ComponentPropsWithoutRef<typeof RadixSelect.Item>
>(function SelectItem({ className, children, ...props }, ref) {
  return (
    <RadixSelect.Item
      ref={ref}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2",
        "rounded-[6px] py-2 pl-3 pr-8 text-[0.875rem] text-smoke outline-none",
        "transition-colors duration-[120ms] ease-[var(--ease-out)]",
        "data-[highlighted]:bg-[var(--anvil)] data-[highlighted]:text-ash",
        "data-[state=checked]:text-ash",
        className,
      )}
      {...props}
    >
      <RadixSelect.ItemText>{children}</RadixSelect.ItemText>
      <RadixSelect.ItemIndicator className="absolute right-2 inline-flex">
        <Check className="size-4 text-[var(--heat)]" />
      </RadixSelect.ItemIndicator>
    </RadixSelect.Item>
  );
});
