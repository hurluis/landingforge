"use client";

import * as React from "react";
import { TIPOLOGIAS } from "@/lib/metodologia/tipologias";
import { asignarPaleta } from "@/lib/metodologia/paletas";
import { Lamina } from "@/components/marketing/lamina";
import { Revelar } from "@/components/ui/revelar";
import { cn } from "@/lib/utils";

/**
 * La tira de contactos — §6.2.4. El bloque más importante después del hero:
 * aquí se demuestra el método.
 *
 * Movimiento 4 del inventario: scroll horizontal NATIVO con scroll-snap. Sin
 * carrusel automático — el usuario controla. El fotograma activo sube a 1.02
 * y gana el borde metálico, 200ms var(--ease-out).
 *
 * Reveal de izquierda a derecha (§5.3): la sección es horizontal, así que
 * entra como una tira de negativo que se desliza. Ninguna otra sección de la
 * página usa esta dirección.
 */

/* Una paleta distinta por tipología, tomada de la matriz real: la tira
   demuestra justamente que dos secciones no reciben la misma identidad. */
const PALETAS_DEMO = [
  asignarPaleta("cosmetica", { genero: "f", edadMin: 30, edadMax: 55 }),
  asignarPaleta("suplemento-deportivo", { genero: "m", edadMin: 20, edadMax: 34 }),
  asignarPaleta("skincare-lujo", { genero: "f", edadMin: 28, edadMax: 50 }),
  asignarPaleta("electronica", { genero: "mixto", edadMin: 25, edadMax: 45 }),
  asignarPaleta("suplemento-natural", { genero: "mixto", edadMin: 30, edadMax: 60 }),
  asignarPaleta("clinico", { genero: "mixto", edadMin: 35, edadMax: 65 }),
  asignarPaleta("control-peso", { genero: "f", edadMin: 30, edadMax: 55 }),
  asignarPaleta("dispositivo-belleza", { genero: "f", edadMin: 25, edadMax: 45 }),
  asignarPaleta("capilar", { genero: "f", edadMin: 22, edadMax: 40 }),
];

export function TiraContactos() {
  const scroller = React.useRef<HTMLUListElement>(null);
  const botones = React.useRef<(HTMLButtonElement | null)[]>([]);
  const [activo, setActivo] = React.useState(0);

  /* El activo es el fotograma cuyo centro está más cerca del centro del
     visor. Se calcula desde el scroll nativo, no al revés: el scroll manda. */
  React.useEffect(() => {
    const nodo = scroller.current;
    if (!nodo) return;
    let frame = 0;
    const medir = () => {
      frame = 0;
      const centro = nodo.scrollLeft + nodo.clientWidth / 2;
      let mejor = 0;
      let menor = Number.POSITIVE_INFINITY;
      Array.from(nodo.children).forEach((hijo, i) => {
        const el = hijo as HTMLElement;
        const c = el.offsetLeft + el.offsetWidth / 2;
        const d = Math.abs(c - centro);
        if (d < menor) {
          menor = d;
          mejor = i;
        }
      });
      setActivo(mejor);
    };
    const alScrollear = () => {
      if (frame) return;
      frame = requestAnimationFrame(medir);
    };
    medir();
    nodo.addEventListener("scroll", alScrollear, { passive: true });
    return () => {
      nodo.removeEventListener("scroll", alScrollear);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  const irA = React.useCallback((i: number) => {
    const limite = Math.max(0, Math.min(TIPOLOGIAS.length - 1, i));
    botones.current[limite]?.focus();
    botones.current[limite]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, []);

  const alTeclado = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      irA(activo + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      irA(activo - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      irA(0);
    } else if (e.key === "End") {
      e.preventDefault();
      irA(TIPOLOGIAS.length - 1);
    }
  };

  const ficha = TIPOLOGIAS[activo];

  return (
    <Revelar as="section" desde="izquierda" aria-labelledby="tira-titulo" className="py-24">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <h2 id="tira-titulo" className="display-lg medida">
          Nueve secciones, cada una con su trabajo.
        </h2>
        <p className="mt-6 medida cuerpo-lg text-mid">
          No son plantillas intercambiables. Cada tipología tiene una estructura, un
          propósito y una regla que la mayoría se salta. Recórrelas.
        </p>
      </div>

      <ul
        ref={scroller}
        onKeyDown={alTeclado}
        aria-label="Las nueve tipologías de sección"
        className="tira mt-12 flex gap-4 overflow-x-auto px-[calc(50%-100px)] pb-2 sm:px-[calc(50%-124px)]"
      >
        {TIPOLOGIAS.map((t, i) => (
          <li key={t.id} className="shrink-0">
            <button
              type="button"
              ref={(n) => {
                botones.current[i] = n;
              }}
              tabIndex={i === activo ? 0 : -1}
              aria-current={i === activo}
              onClick={() => irA(i)}
              className={cn(
                "block w-[200px] sm:w-[248px] rounded-[12px]",
                "transition-transform duration-[200ms] ease-[var(--ease-out)]",
                i === activo ? "scale-[1.02]" : "scale-100",
              )}
            >
              <span
                className={cn(
                  "relative block aspect-[9/16] overflow-hidden rounded-[12px] bg-[var(--surface-sunk)]",
                  "transition-opacity duration-[200ms] ease-[var(--ease-out)]",
                  i === activo ? "borde-metal opacity-100" : "border border-[var(--line)] opacity-60",
                )}
              >
                <Lamina tipologia={t.id} paleta={PALETAS_DEMO[i]} />
              </span>
              <span className="mt-3 flex items-baseline gap-2 px-0.5">
                <span className="mono-sm text-lo">{String(t.numero).padStart(2, "0")}</span>
                <span
                  className={cn(
                    "etiqueta transition-colors duration-[200ms] ease-[var(--ease-out)]",
                    i === activo ? "text-hi" : "text-lo",
                  )}
                >
                  {t.nombre}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Ficha del fotograma activo. Sin animación: el cambio tiene que ser
          inmediato para que valga la pena recorrer la tira. */}
      <div className="mx-auto mt-8 max-w-[1200px] px-4 sm:px-8">
        <div aria-live="polite" className="grid gap-6 border-t border-[var(--line)] pt-6 md:grid-cols-[1fr_1.4fr]">
          <div>
            <h3 className="display-md">{ficha.nombre}</h3>
            <p className="mt-2 cuerpo text-mid medida">{ficha.proposito}</p>
          </div>
          <div>
            <p className="etiqueta text-lo">La regla que la mayoría se salta</p>
            <p className="mt-2 cuerpo-lg text-hi medida">{ficha.reglaCritica}</p>
          </div>
        </div>
        <p className="mt-6 mono-sm text-lo">
          Usa las flechas del teclado o desliza la tira
        </p>
      </div>
    </Revelar>
  );
}
