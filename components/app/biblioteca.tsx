"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, MagnifyingGlass, Trash, PencilSimple } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import type { Campana } from "@/lib/datos/tipos";
import { Lamina } from "@/components/marketing/lamina";
import { Boton } from "@/components/ui/boton";
import { Badge } from "@/components/ui/piezas";
import {
  Dialogo,
  DialogoCierre,
  DialogoContenido,
  DialogoDisparador,
} from "@/components/ui/dialogo";
import { fechaCorta } from "@/lib/formato";
import { cn } from "@/lib/utils";

/**
 * Biblioteca — §6.3. Grilla de campañas con miniatura, paleta, fecha y estado.
 * Buscador. Los cinco estados de §11 viven aquí: vacío, cargando (skeleton en
 * la ruta), error, parcial (la campaña marca sus secciones fallidas) y lleno.
 */

const ETIQUETA_ESTADO: Record<Campana["estado"], { texto: string; tono: "neutro" | "ok" | "aviso" | "peligro" | "maquina" }> = {
  borrador: { texto: "borrador", tono: "neutro" },
  generando: { texto: "generando", tono: "maquina" },
  lista: { texto: "lista", tono: "ok" },
  error: { texto: "error", tono: "peligro" },
};

export function Biblioteca({ campanas }: { campanas: Campana[] }) {
  const router = useRouter();
  const [busqueda, setBusqueda] = React.useState("");
  const [ocupada, setOcupada] = React.useState<string | null>(null);

  const filtradas = React.useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (q === "") return campanas;
    return campanas.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.producto.descripcion.toLowerCase().includes(q) ||
        c.paleta.nombre.toLowerCase().includes(q),
    );
  }, [busqueda, campanas]);

  async function duplicar(c: Campana) {
    setOcupada(c.id);
    try {
      const r = await fetch(`/api/campanas/${c.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "duplicar" }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast.success("Campaña duplicada");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo duplicar.");
    } finally {
      setOcupada(null);
    }
  }

  async function borrar(c: Campana) {
    setOcupada(c.id);
    try {
      const r = await fetch(`/api/campanas/${c.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error);
      toast.success("Campaña eliminada");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar.");
    } finally {
      setOcupada(null);
    }
  }

  /* Renombrar vive en la pantalla de campaña, editando el título en su sitio.
     Abrir un modal para cambiar un nombre es justo el caso que §4.8 prohíbe:
     una tarea que no necesita interrupción ni foco protegido. */

  /* Estado vacío: invita a actuar. Título, una línea y un botón (§11). */
  if (campanas.length === 0) {
    return (
      <div className="mx-auto max-w-[520px] py-24 text-center">
        <h2 className="display-md">Sube la foto de tu primer producto</h2>
        <p className="mt-3 cuerpo text-smoke">
          En cuatro preguntas tienes la paleta asignada y los prompts de las secciones que
          elijas.
        </p>
        <div className="mt-8 flex justify-center">
          <Boton asChild variante="heat" tamano="lg">
            <Link href="/app/nueva">Crear mi primera campaña</Link>
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative min-w-[240px] flex-1 max-w-[360px]">
          <MagnifyingGlass 
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slag"
          />
          <label htmlFor="buscar" className="sr-only">
            Buscar campañas
          </label>
          <input
            id="buscar"
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por producto o paleta"
            className={cn(
              "h-10 w-full rounded-[10px] pl-9 pr-3 text-[0.9375rem]",
              "bg-[var(--anvil)] text-ash placeholder:text-slag",
              "border border-[var(--scale)]",
              "transition-colors duration-[140ms] ease-[var(--ease-out)]",
              "focus:border-[var(--scale-hi)]",
            )}
          />
        </div>
        <Boton asChild variante="heat" tamano="md">
          <Link href="/app/nueva">Nueva campaña</Link>
        </Boton>
      </div>

      {filtradas.length === 0 ? (
        <p className="mt-16 text-center cuerpo text-smoke">
          Ninguna campaña coincide con «{busqueda}».
        </p>
      ) : (
        <ul
          className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {filtradas.map((c) => {
            const estado = ETIQUETA_ESTADO[c.estado];
            const parcial = c.seccionesFallidas.length > 0;
            return (
              <li
                key={c.id}
                className="flex flex-col rounded-[16px] border border-[var(--scale)] bg-[var(--anvil)] p-3"
              >
                <Link
                  href={`/app/c/${c.id}`}
                  className="relative block aspect-[9/16] overflow-hidden rounded-[10px] bg-[var(--sunk)] no-underline"
                >
                  <Lamina tipologia={c.prompts[0]?.tipologia ?? "hero"} paleta={c.paleta} />
                </Link>

                <div className="mt-3 flex items-start justify-between gap-2">
                  <Link href={`/app/c/${c.id}`} className="titulo text-ash no-underline hf:text-[var(--heat)]">
                    {c.nombre}
                  </Link>
                  <Badge tono={parcial ? "aviso" : estado.tono}>
                    {parcial ? "parcial" : estado.texto}
                  </Badge>
                </div>

                <p className="mt-1 mono-sm text-slag">
                  {c.prompts.length} de {c.prompts.length + c.seccionesFallidas.length} secciones ·{" "}
                  {fechaCorta(c.actualizadaEn)}
                </p>

                <div className="mt-3 flex items-center gap-1.5" title={c.paleta.nombre}>
                  {[c.paleta.fondo, c.paleta.acento, c.paleta.texto, c.paleta.secundario, c.paleta.energia].map(
                    (hex) => (
                      <span
                        key={hex}
                        aria-hidden
                        style={{ background: hex }}
                        className="size-3 rounded-full border border-[var(--scale)]"
                      />
                    ),
                  )}
                  <span className="ml-1 mono-sm text-slag">{c.paleta.nombre}</span>
                </div>

                <div className="mt-4 flex items-center gap-1 border-t border-[var(--scale)] pt-3">
                  <Boton asChild variante="fantasma" tamano="sm">
                    <Link href={`/app/c/${c.id}`} aria-label={`Abrir ${c.nombre}`}>
                      <PencilSimple  />
                    </Link>
                  </Boton>
                  <Boton
                    variante="fantasma"
                    tamano="sm"
                    onClick={() => duplicar(c)}
                    disabled={ocupada === c.id}
                    aria-label={`Duplicar ${c.nombre}`}
                  >
                    <Copy />
                  </Boton>

                  {/* El ÚNICO modal del producto: destructivo y con foco
                      protegido (§7.2). */}
                  <Dialogo>
                    <DialogoDisparador asChild>
                      <Boton
                        variante="fantasma"
                        tamano="sm"
                        className="ml-auto text-[var(--danger)]"
                        disabled={ocupada === c.id}
                        aria-label={`Eliminar ${c.nombre}`}
                      >
                        <Trash  />
                      </Boton>
                    </DialogoDisparador>
                    <DialogoContenido
                      titulo={`Eliminar «${c.nombre}»`}
                      descripcion="Se borran la campaña y sus prompts. No se puede deshacer, y los créditos que ya gastaste no vuelven."
                    >
                      <div className="flex justify-end gap-2">
                        <DialogoCierre asChild>
                          <Boton variante="contorno">Conservar</Boton>
                        </DialogoCierre>
                        <DialogoCierre asChild>
                          <Boton variante="peligro" onClick={() => borrar(c)}>
                            Eliminar la campaña
                          </Boton>
                        </DialogoCierre>
                      </div>
                    </DialogoContenido>
                  </Dialogo>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
