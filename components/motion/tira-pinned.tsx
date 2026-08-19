"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "motion/react";
import { TIPOLOGIAS } from "@/lib/metodologia/tipologias";
import { asignarPaleta } from "@/lib/metodologia/paletas";
import { Lamina } from "@/components/marketing/lamina";
import { SPRING } from "@/lib/motion";
import { useEsEscritorio } from "@/components/motion/medios";
import { cn } from "@/lib/utils";

/**
 * M6 · Las nueve secciones, pan horizontal pinned.
 *
 * El scroll vertical mueve la tira horizontalmente. Es el bloque más
 * importante después del hero: aquí se demuestra el método.
 *
 * En móvil NO se pinnea: pasa a scroll horizontal nativo con snap de
 * proximidad, no obligatorio, porque el usuario tiene que poder parar entre
 * dos fotogramas sin que la página lo empuje.
 *
 * Accesibilidad: las flechas del teclado saltan de panel y el foco arrastra
 * el scroll. Si alguien con teclado no puede llegar al noveno fotograma, la
 * sección está rota.
 */

/* Una paleta distinta por tipología, salida de la matriz real: la tira
   demuestra en sí misma que dos clientes no reciben la misma identidad. */
const PALETAS = [
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

const N = TIPOLOGIAS.length;

export function TiraPinned() {
  const escritorio = useEsEscritorio();
  const reduce = useReducedMotion();

  if (!escritorio || reduce) return <TiraNativa />;
  return <TiraPan />;
}

/* ---------------------------------------------------------------- */

function TiraPan() {
  const pista = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(0);

  const carril = useRef<HTMLUListElement>(null);
  /* El recorrido se MIDE, no se adivina con porcentajes: el ancho real del
     carril depende del gap y del padding, y una fórmula tipo (n-1)/n deja
     fotogramas fuera o de más. Se recalcula solo al redimensionar. */
  const [recorrido, setRecorrido] = useState(0);

  useEffect(() => {
    const medir = () => {
      const nodo = carril.current;
      if (!nodo) return;
      setRecorrido(Math.max(0, nodo.scrollWidth - window.innerWidth + 80));
    };
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);

  const { scrollYProgress } = useScroll({
    target: pista,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, SPRING.scroll);

  const px = useTransform(p, [0, 1], [0, -recorrido]);
  const x = useMotionTemplate`translate3d(${px}px, 0, 0)`;
  const anchoBarra = useTransform(p, [0, 1], ["0%", "100%"]);

  useMotionValueEvent(p, "change", (v) => {
    const i = Math.round(v * (N - 1));
    setActivo((prev) => (prev === i ? prev : i));
  });

  /* El teclado mueve el scroll de la ventana, que es lo que mueve el pan.
     Así el foco y la posición nunca se desincronizan. */
  const irA = useCallback((i: number) => {
    const nodo = pista.current;
    if (!nodo) return;
    const destino = Math.max(0, Math.min(N - 1, i));
    const alto = nodo.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: nodo.offsetTop + (alto * destino) / (N - 1),
      behavior: "smooth",
    });
  }, []);

  const ficha = TIPOLOGIAS[activo];

  return (
    <section aria-labelledby="tira-titulo" className="relative">
      <div ref={pista} className="relative h-[520vh]">
        <div className="sticky top-0 flex h-[100dvh] flex-col justify-center overflow-hidden pt-24 pb-10">
          <div className="mx-auto w-full max-w-[1400px] px-10">
            <h2 id="tira-titulo" className="display-md max-w-[24ch]">
              Nueve secciones. Cada una con su regla.
            </h2>
          </div>

          <div className="mt-8 overflow-hidden">
            <motion.ul
              ref={carril}
              style={{ transform: x }}
              className="flex w-max items-center gap-8 px-10"
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") { e.preventDefault(); irA(activo + 1); }
                if (e.key === "ArrowLeft") { e.preventDefault(); irA(activo - 1); }
                if (e.key === "Home") { e.preventDefault(); irA(0); }
                if (e.key === "End") { e.preventDefault(); irA(N - 1); }
              }}
            >
              {TIPOLOGIAS.map((t, i) => (
                <li key={t.id} className="w-[clamp(140px,13vw,205px)] shrink-0">
                  <button
                    type="button"
                    tabIndex={i === activo ? 0 : -1}
                    aria-current={i === activo}
                    onFocus={() => irA(i)}
                    onClick={() => irA(i)}
                    className={cn(
                      "block w-full text-left transition-transform duration-[320ms] ease-[var(--ease-out)]",
                      i === activo ? "scale-[1.04]" : "scale-100",
                    )}
                  >
                    <span
                      className={cn(
                        "relative block aspect-[9/16] overflow-hidden rounded-[14px] bg-sunk",
                        "transition-opacity duration-[320ms] ease-[var(--ease-out)]",
                        i === activo ? "opacity-100" : "opacity-45",
                      )}
                    >
                      <Lamina tipologia={t.id} paleta={PALETAS[i]} />
                      {i === activo && <span aria-hidden className="anillo-templado" />}
                    </span>
                    <span className="mt-3 flex items-baseline gap-2">
                      <span className="mono-sm text-slag">{String(t.numero).padStart(2, "0")}</span>
                      <span
                        className={cn(
                          "etiqueta transition-colors duration-[320ms]",
                          i === activo ? "text-ash" : "text-slag",
                        )}
                      >
                        {t.nombre}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </motion.ul>
          </div>

          <div className="mx-auto mt-8 w-full max-w-[1400px] px-10">
            <div aria-hidden className="h-px w-full bg-scale">
              <motion.span style={{ width: anchoBarra }} className="block h-px bg-heat" />
            </div>
            <Ficha nombre={ficha.nombre} proposito={ficha.proposito} regla={ficha.reglaCritica} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */

function TiraNativa() {
  const [activo, setActivo] = useState(0);
  const scroller = useRef<HTMLUListElement>(null);

  const medir = useCallback(() => {
    const nodo = scroller.current;
    if (!nodo) return;
    const centro = nodo.scrollLeft + nodo.clientWidth / 2;
    let mejor = 0;
    let menor = Number.POSITIVE_INFINITY;
    Array.from(nodo.children).forEach((hijo, i) => {
      const el = hijo as HTMLElement;
      const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - centro);
      if (d < menor) { menor = d; mejor = i; }
    });
    setActivo((prev) => (prev === mejor ? prev : mejor));
  }, []);

  const ficha = TIPOLOGIAS[activo];

  return (
    <section aria-labelledby="tira-titulo-movil" className="py-32">
      <div className="mx-auto w-full max-w-[1400px] px-6">
        <h2 id="tira-titulo-movil" className="display-lg max-w-[16ch]">
          Nueve secciones. Cada una con su regla.
        </h2>
      </div>

      <ul
        ref={scroller}
        onScroll={medir}
        aria-label="Las nueve tipologías de sección"
        className="tira-nativa mt-10 flex gap-5 overflow-x-auto px-6 pb-4"
      >
        {TIPOLOGIAS.map((t, i) => (
          <li key={t.id} className="w-[62vw] max-w-[260px] shrink-0">
            <span
              className={cn(
                "relative block aspect-[9/16] overflow-hidden rounded-[14px] bg-sunk transition-opacity",
                i === activo ? "opacity-100" : "opacity-50",
              )}
            >
              <Lamina tipologia={t.id} paleta={PALETAS[i]} />
              {i === activo && <span aria-hidden className="anillo-templado" />}
            </span>
            <span className="mt-3 flex items-baseline gap-2">
              <span className="mono-sm text-slag">{String(t.numero).padStart(2, "0")}</span>
              <span className={cn("etiqueta", i === activo ? "text-ash" : "text-slag")}>
                {t.nombre}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <div className="mx-auto mt-6 w-full max-w-[1400px] px-6">
        <Ficha nombre={ficha.nombre} proposito={ficha.proposito} regla={ficha.reglaCritica} />
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- */

function Ficha({
  nombre,
  proposito,
  regla,
}: {
  nombre: string;
  proposito: string;
  regla: string;
}) {
  return (
    <div
      aria-live="polite"
      className="grid gap-4 border-t border-scale pt-5 md:grid-cols-[1fr_1.5fr] md:gap-12"
    >
      <div>
        <h3 className="titulo text-ash">{nombre}</h3>
        <p className="mt-1 cuerpo text-smoke">{proposito}</p>
      </div>
      <div>
        <p className="etiqueta text-slag">La regla que casi nadie aplica</p>
        <p className="mt-1 cuerpo-lg text-ash medida">{regla}</p>
      </div>
    </div>
  );
}
