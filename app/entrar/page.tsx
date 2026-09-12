import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/marketing/wordmark";
import { usuarioActual } from "@/lib/auth/sesion";
import { cn } from "@/lib/utils";
import { traductor } from "@/lib/i18n/servidor";
import type { Traductor } from "@/lib/i18n/idioma";
import { FormularioEntrada } from "./formulario";

export async function generateMetadata(): Promise<Metadata> {
  const t = await traductor();
  return { title: t("Entrar") };
}

/**
 * Entrar — la puerta del estudio.
 *
 * A la izquierda, el formulario. A la derecha, el mismo plano con el que abre
 * la home —el frasco en su pedestal, bajo la luz de ventana— y delante, lo
 * que se compra: tres secciones de una campaña real, con la de precios al
 * frente. Antes aquí había una pieza de ejemplo dibujada; esto es el producto
 * de verdad, el mismo que enseña la tira de la home.
 *
 * El plano lleva la clase de la película, así que sobre papel se revela en
 * clave alta como en el resto del sitio, y los paños salen del mismo color.
 */

const piezas = (t: Traductor) => [
  {
    src: "/secciones/hero.png",
    alt: t("Sección hero de una campaña real de suplemento"),
    clase: "h-[46vh] -rotate-[7deg] translate-x-10 translate-y-8",
  },
  {
    src: "/secciones/precios.png",
    alt: t("Sección de precios de la misma campaña"),
    clase: "z-10 h-[56vh]",
  },
  {
    src: "/secciones/testimonios.png",
    alt: t("Sección de testimonios de la misma campaña"),
    clase: "h-[46vh] rotate-[7deg] -translate-x-10 translate-y-8",
  },
];

const SOMBRA = "rgb(var(--pelicula-sombra)";

export default async function Entrar() {
  // Con sesión abierta, esta pantalla no tiene nada que ofrecer.
  if (await usuarioActual()) redirect("/app");
  const t = await traductor();

  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="flex flex-col px-5 py-8 sm:px-10 lg:px-16">
        <Wordmark />
        <div className="flex flex-1 items-center py-14">
          <Suspense fallback={<div className="h-[420px]" />}>
            <FormularioEntrada />
          </Suspense>
        </div>
      </div>

      <aside
        aria-label={t("Una campaña real, hecha con LandingForge")}
        className="relative hidden overflow-hidden bg-[rgb(var(--pelicula-sombra))] lg:block"
      >
        <Image
          src="/secuencia/0001.jpg"
          alt=""
          fill
          priority
          sizes="55vw"
          className="pelicula-capa object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 80% 70% at 50% 45%, transparent 30%, ${SOMBRA} / 0.7) 85%), linear-gradient(180deg, ${SOMBRA} / 0.25) 0%, transparent 30%, transparent 60%, ${SOMBRA} / 0.9) 100%)`,
          }}
        />

        <div className="absolute inset-x-0 top-[12vh] flex items-center justify-center">
          {piezas(t).map((p) => (
            <div
              key={p.src}
              className={cn(
                "relative aspect-[9/16] shrink-0 overflow-hidden rounded-2xl shadow-[0_40px_90px_-30px_rgb(0_0_0/0.9)]",
                p.clase,
              )}
            >
              <Image src={p.src} alt={p.alt} fill sizes="22vw" className="object-cover object-top" />
            </div>
          ))}
        </div>

        <div className="absolute inset-x-12 bottom-12 flex items-end justify-between gap-8">
          <div>
            <p className="flex items-center gap-3 etiqueta text-ash sobre-pelicula">
              <span aria-hidden className="h-px w-8 bg-current" />
              {t("Una campaña real")}
            </p>
            <p className="mt-3 max-w-sm text-lg leading-relaxed text-ash sobre-pelicula">
              {t(
                "Hero, precios y testimonios de un suplemento. Tres de las nueve secciones que LandingForge arma con una foto.",
              )}
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
