"use client";

import * as React from "react";
import * as RadixAccordion from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Acordeón — el único lugar del producto donde se permite animar `height`,
 * porque no hay equivalente con transform (§6.2.9). Por eso va corto: 200ms.
 * Radix mide la altura y la expone en --radix-accordion-content-height.
 */

export function Acordeon({
  items,
  className,
}: {
  items: { id: string; pregunta: string; respuesta: React.ReactNode }[];
  className?: string;
}) {
  return (
    <RadixAccordion.Root type="single" collapsible className={cn("w-full", className)}>
      {items.map((item) => (
        <RadixAccordion.Item
          key={item.id}
          value={item.id}
          className="border-t border-[var(--line)] last:border-b"
        >
          <RadixAccordion.Header>
            <RadixAccordion.Trigger
              className={cn(
                "grupo flex w-full items-center justify-between gap-6 py-6 text-left",
                "titulo text-mid",
                "transition-colors duration-[140ms] ease-[var(--ease-out)]",
                "hf:text-hi data-[state=open]:text-hi",
              )}
            >
              <span className="text-balance">{item.pregunta}</span>
              <Plus
                strokeWidth={1.5}
                aria-hidden
                className={cn(
                  "size-5 shrink-0 text-lo",
                  "transition-transform duration-[200ms] ease-[var(--ease-out)]",
                  "group-data-[state=open]:rotate-45",
                )}
              />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
          <RadixAccordion.Content
            className={cn(
              "overflow-hidden",
              "data-[state=open]:animate-[acordeon-abre_200ms_var(--ease-out)]",
              "data-[state=closed]:animate-[acordeon-cierra_200ms_var(--ease-out)]",
            )}
          >
            <div className="medida cuerpo text-mid pb-6 pr-10">{item.respuesta}</div>
          </RadixAccordion.Content>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  );
}
