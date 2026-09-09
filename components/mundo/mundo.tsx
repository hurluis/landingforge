"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ESCENAS, PANTALLAS_TOTALES, type Escena } from "@/lib/mundo/escenas";
import { montarFilm } from "@/components/mundo/film";
import { Boton } from "@/components/ui/boton";
import { cn } from "@/lib/utils";

/**
 * EL MUNDO · la apertura de la página.
 *
 * Seis escenas encadenadas al scroll. Lo que cambió: el sujeto ya no es
 * geometría dibujada en tiempo real con three, sino un film de producto
 * servido como secuencia de fotogramas y conducido por el scroll.
 *
 * Por qué se cambió, dicho sin adornos: la geometría contaba una metáfora
 * —taller, forja, plaza— y el film enseña LO QUE EL PRODUCTO PRODUCE. Para
 * un vendedor que llega a decidir en tres segundos, ver el resultado pesa
 * más que ver una alegoría del mecanismo, por buena que sea la alegoría.
 *
 * El precio, y hay que decirlo porque DECISIONES.md había argumentado lo
 * contrario:
 *
 *   · Ya no pesa kilobytes. Son 2,4 MB de fotogramas, cargados de forma
 *     progresiva: primero uno, después uno de cada ocho, después el resto.
 *     La portada es utilizable con el 12% descargado.
 *   · Ya no escala a cualquier proporción sin recortar. El film es 2,28:1 y
 *     en vertical hay que recortar; el encuadre se corre al centro-derecha,
 *     que es donde vive el producto en las cuatro tomas.
 *   · Ya depende de un asset. Si mañana hace falta otro film, se regenera
 *     con `npm run film`.
 *
 * Lo que NO cambió, porque nunca fue del motor sino de la página: las seis
 * copias, el riel de ruta, el umbral único de interactividad para ratón,
 * teclado y lector de pantalla, y `MundoEstatico` para movimiento reducido.
 *
 * El motor de geometría no se borró del repositorio —`components/mundo/
 * geometria.ts` sigue ahí, igual que La Forja cuando salió de la portada—:
 * salió de la página, no de la historia del proyecto.
 */

export function Mundo() {
  const reduce = useReducedMotion();
  if (reduce) return <MundoEstatico />;
  return <MundoVivo />;
}

/* ================================================================ */

function MundoVivo() {
  const seccion = useRef<HTMLElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const copias = useRef<(HTMLDivElement | null)[]>([]);
  const marca = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const canvas = lienzo.current;
    const host = seccion.current;
    if (!canvas || !host) return;

    /* En tiempo ocioso: el film no compite con el LCP, que es el titular. */
    let desmontar: (() => void) | undefined;
    let vivo = true;
    const arrancar = () => {
      if (vivo) desmontar = montarFilm(canvas, host, copias.current, marca.current);
    };

    const ocioso =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(arrancar, { timeout: 1200 })
        : window.setTimeout(arrancar, 200);

    return () => {
      vivo = false;
      if (typeof window.cancelIdleCallback === "function" && typeof ocioso === "number") {
        window.cancelIdleCallback(ocioso);
      }
      window.clearTimeout(ocioso as number);
      desmontar?.();
    };
  }, []);

  return (
    <section
      ref={seccion}
      aria-labelledby="mundo-titulo"
      className="relative bg-[var(--void)]"
      style={{ height: `${PANTALLAS_TOTALES * 100}vh` }}
    >
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        <canvas
          ref={lienzo}
          aria-hidden
          className="absolute inset-0 size-full opacity-0 transition-opacity duration-1000 ease-[var(--ease-out)]"
        />

        {/* Velo inferior: separa el texto del film sin taparlo. El degradado
            sale de --void, así que sigue al sistema si el fondo cambia. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[70%] bg-[linear-gradient(to_top,var(--void)_30%,color-mix(in_oklab,var(--void)_90%,transparent)_60%,transparent_100%)] lg:h-[62%] lg:bg-[linear-gradient(to_top,var(--void)_8%,color-mix(in_oklab,var(--void)_78%,transparent)_46%,transparent_100%)]"
        />

        {/* Velo lateral, solo en escritorio.
            Con dioramas de geometría el fondo tras la copia era siempre
            oscuro porque lo dibujábamos nosotros. El film no se controla: la
            primera toma trae un softbox blanco justo detrás del titular, y
            ahí el texto claro sobre claro desaparece. Esto le garantiza una
            cama oscura a la columna de texto sea cual sea el fotograma, en
            vez de confiar en que ninguno traiga una zona clara.
            En vertical no hace falta: allí la copia va abajo y ya la cubre
            el velo inferior. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[62%] lg:block bg-[linear-gradient(to_right,var(--void)_0%,color-mix(in_oklab,var(--void)_82%,transparent)_42%,transparent_100%)]"
        />

        {/* Riel de ruta: dónde vas en el recorrido. */}
        <nav
          aria-label="Recorrido"
          className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 lg:block"
        >
          <ol className="flex flex-col gap-3">
            {ESCENAS.map((e, i) => (
              <li
                key={e.id}
                ref={(n) => {
                  marca.current[i] = n;
                }}
                className="flex items-center justify-end gap-2.5 opacity-40 transition-opacity duration-300 ease-[var(--ease-out)] [text-shadow:0_1px_6px_var(--void)] [&>span:last-child]:shadow-[0_0_6px_var(--void)]"
              >
                <span className="mono-sm text-slag">{e.indice}</span>
                <span className="block h-px w-6 bg-[var(--scale-hi)]" />
              </li>
            ))}
          </ol>
        </nav>

        {/* La copia. Las seis van en el DOM siempre y el scroll decide cuál
            está viva: el recorrido completo sigue siendo accesible, una
            escena a la vez, en vez de seis superpuestas anunciándose juntas.
            Quien prefiere movimiento reducido recibe `MundoEstatico`, que las
            presenta las seis en flujo normal.

            Todas nacen `inert` menos la primera. Entre el HTML del servidor y
            el primer frame del bucle hay una ventana en la que las seis
            están a opacidad 0; sin esto, el tabulador las recorre todas. */}
        <div className="absolute inset-0">
          {ESCENAS.map((e, i) => (
            <div
              key={e.id}
              ref={(n) => {
                copias.current[i] = n;
              }}
              inert={i !== 0}
              aria-hidden={i !== 0}
              className="absolute inset-x-0 bottom-0 px-6 pb-16 opacity-0 sm:pb-20 lg:px-10 lg:pb-24"
            >
              <BloqueCopia escena={e} principal={i === 0} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */

function BloqueCopia({ escena, principal }: { escena: Escena; principal: boolean }) {
  const Titulo = principal ? "h1" : "h2";
  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <div className="max-w-[42rem]">
        <p className="flex items-center gap-3">
          <span className="mono-sm text-[var(--heat)]">{escena.indice}</span>
          <span className="h-px w-8 bg-[var(--scale-hi)]" />
          <span className="etiqueta text-smoke">{escena.eyebrow}</span>
        </p>

        <Titulo
          id={principal ? "mundo-titulo" : undefined}
          className={cn("mt-5", principal ? "display-lg" : "display-md")}
        >
          {escena.titulo}
        </Titulo>

        <p className="mt-5 cuerpo-lg text-smoke">{escena.cuerpo}</p>

        {escena.etiquetas.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {escena.etiquetas.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-[var(--scale)] px-3 py-1 mono-sm text-slag"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}

        {escena.id === "tienda" && (
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Boton asChild variante="heat" tamano="lg">
              <Link href="/app/nueva">
                Forjar mi landing
                <ArrowRight weight="bold" />
              </Link>
            </Boton>
            <Link
              href="/metodologia"
              className="etiqueta text-[var(--quench)] no-underline hf:underline"
            >
              Ver la metodología
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================ */
/* Movimiento reducido                                               */
/* ================================================================ */

/**
 * Las mismas seis escenas, en flujo normal y sin lienzo. Movimiento reducido
 * significa menos movimiento, no menos historia: el texto es idéntico y el
 * recorrido se sigue leyendo de arriba abajo.
 */
function MundoEstatico() {
  return (
    <section aria-labelledby="mundo-titulo" className="pt-32 pb-24">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        <ol className="flex flex-col gap-24">
          {ESCENAS.map((e, i) => (
            <li key={e.id} className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div>
                <BloqueCopia escena={e} principal={i === 0} />
              </div>
              {/* Sustituto del diorama: un campo de temperatura plano, que
                  dice lo mismo que la escena sin mover un píxel. */}
              <div
                aria-hidden
                className="aspect-[4/3] rounded-[16px] border border-[var(--scale)]"
                style={{
                  background: `radial-gradient(120% 90% at 50% 100%, color-mix(in oklab, ${
                    e.calor > 0.5 ? "var(--heat)" : "var(--quench)"
                  } ${Math.round(12 + e.calor * 26)}%, var(--anvil)) 0%, var(--void) 72%)`,
                }}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
