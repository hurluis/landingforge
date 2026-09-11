"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Copy, MagnifyingGlass, Trash } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import type { Campana } from "@/lib/datos/tipos";
import { TIPOLOGIAS } from "@/lib/metodologia/tipologias";
import { Boton } from "@/components/ui/boton";
import { Badge } from "@/components/ui/piezas";
import { Rotulo } from "@/components/panel/piezas";
import {
  Dialogo,
  DialogoCierre,
  DialogoContenido,
  DialogoDisparador,
} from "@/components/ui/dialogo";
import { fechaCorta } from "@/lib/formato";
import { cn } from "@/lib/utils";

/**
 * Biblioteca — §6.3. Las campañas como carteles, no como tarjetas.
 *
 * Cada campaña se pinta con lo único que es suyo: su paleta y la foto de su
 * producto. El fondo del cartel es el color de fondo que la matriz le asignó,
 * el producto va encima como en su hero, y abajo corre la tira de sus cinco
 * colores. Así dos campañas no se parecen nunca, que es la promesa del
 * producto, y la biblioteca se lee de un vistazo por color antes que por
 * nombre. Antes cada una llevaba la misma maqueta esquemática en DOM.
 *
 * Los cinco estados de §11 viven aquí: vacío, cargando (skeleton en la ruta),
 * error, parcial (la campaña marca sus secciones fallidas) y lleno.
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

  if (campanas.length === 0) return <Vacia />;

  return (
    <section aria-labelledby="campanas-titulo">
      <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[var(--scale)] pt-8">
        <h2 id="campanas-titulo" className="titulo">
          Tus campañas
        </h2>
        <div className="relative w-full max-w-[340px]">
          <MagnifyingGlass
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slag"
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
              "h-10 w-full rounded-full pl-10 pr-4 text-[0.9375rem]",
              "border border-[var(--scale-hi)] bg-transparent text-ash placeholder:text-slag",
              "transition-colors duration-[140ms] ease-[var(--ease-out)] hf:border-ash focus:border-ash",
            )}
          />
        </div>
      </div>

      {filtradas.length === 0 ? (
        <p className="mt-16 cuerpo-lg text-smoke">Ninguna campaña coincide con «{busqueda}».</p>
      ) : (
        <ul className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtradas.map((c) => {
            const estado = ETIQUETA_ESTADO[c.estado];
            const parcial = c.seccionesFallidas.length > 0;
            const colores = [c.paleta.fondo, c.paleta.acento, c.paleta.texto, c.paleta.secundario, c.paleta.energia];
            return (
              <li key={c.id} className="group flex flex-col">
                <Link
                  href={`/app/c/${c.id}`}
                  aria-label={`Abrir ${c.nombre}`}
                  className="relative block aspect-[4/5] overflow-hidden rounded-2xl no-underline shadow-[0_24px_60px_-30px_rgb(0_0_0/0.8)]"
                  style={{ background: c.paleta.fondo }}
                >
                  <span
                    aria-hidden
                    className="absolute left-6 top-6 h-1 w-10 rounded-full"
                    style={{ background: c.paleta.acento }}
                  />
                  {c.producto.imagenUrl ? (
                    <Image
                      src={c.producto.imagenUrl}
                      alt=""
                      fill
                      unoptimized
                      sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                      className="object-contain p-10 pb-14 transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.04]"
                    />
                  ) : (
                    <span
                      className="absolute inset-x-6 bottom-12 line-clamp-4 font-[family-name:var(--font-round)] text-[1.75rem] font-semibold leading-[1.02] tracking-[-0.03em]"
                      style={{ color: c.paleta.texto }}
                    >
                      {c.producto.nombre}
                    </span>
                  )}
                  <span aria-hidden className="absolute inset-x-0 bottom-0 flex h-2">
                    {colores.map((hex, i) => (
                      <span key={`${hex}-${i}`} className="flex-1" style={{ background: hex }} />
                    ))}
                  </span>
                </Link>

                <div className="mt-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/app/c/${c.id}`}
                      className="block truncate titulo text-ash no-underline transition-colors duration-[140ms] hf:text-[var(--heat)]"
                    >
                      {c.nombre}
                    </Link>
                    <p className="mt-1 mono-sm text-slag">
                      {c.prompts.length} de {c.prompts.length + c.seccionesFallidas.length} secciones ·{" "}
                      {fechaCorta(c.actualizadaEn)}
                    </p>
                  </div>
                  <Badge tono={parcial ? "aviso" : estado.tono} className="shrink-0">
                    {parcial ? "parcial" : estado.texto}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center gap-1">
                  <span className="mr-auto truncate mono-sm text-slag" title={c.paleta.razon}>
                    {c.paleta.nombre}
                  </span>
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
                        className="text-[var(--danger)]"
                        disabled={ocupada === c.id}
                        aria-label={`Eliminar ${c.nombre}`}
                      >
                        <Trash />
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
    </section>
  );
}

/**
 * Estado vacío: invita a actuar (§11). Y enseña lo que se va a recibir: las
 * nueve secciones de una campaña real, las mismas de la home, en fila.
 */
function Vacia() {
  return (
    <section aria-labelledby="vacia-titulo" className="border-t border-[var(--scale)] pt-10">
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div className="max-w-xl">
          <Rotulo className="text-smoke">Tu primera campaña</Rotulo>
          <h2 id="vacia-titulo" className="mt-4 display-md">
            Sube la foto de tu producto y recibe las nueve secciones.
          </h2>
          <p className="mt-4 cuerpo-lg text-smoke">
            Cuatro preguntas: qué es, para quién, dónde lo vendes y cuánto cuesta. La matriz
            asigna la paleta y el motor construye un prompt validado por sección.
          </p>
        </div>
        <Boton asChild variante="heat" tamano="lg">
          <Link href="/app/nueva">
            Crear mi primera campaña
            <ArrowRight className="size-5" />
          </Link>
        </Boton>
      </div>

      <ul className="mt-12 flex gap-4 overflow-x-auto pb-4 tira-nativa">
        {TIPOLOGIAS.map((t) => (
          <li key={t.id} className="w-[150px] shrink-0 sm:w-[170px]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-xl">
              <Image
                src={`/secciones/${t.id}.png`}
                alt={`Sección ${t.nombre} de una campaña real`}
                fill
                sizes="170px"
                className="object-cover object-top"
              />
            </div>
            <p className="mt-3 flex items-baseline gap-2">
              <span className="mono-sm text-slag">{String(t.numero).padStart(2, "0")}</span>
              <span className="etiqueta text-smoke">{t.nombre}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
