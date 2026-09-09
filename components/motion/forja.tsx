"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  useMotionTemplate,
  type MotionValue,
} from "motion/react";
import { useMovimientoReducido } from "@/lib/a11y/preferencias";
import { EASE, SPRING } from "@/lib/motion";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Magnetico } from "@/components/motion/interacciones";

/**
 * M1 + M2 · El hero y La Forja, en una sola secuencia continua.
 *
 * La primera pantalla es una tesis, no un encabezado: demuestra el mecanismo
 * del producto de inmediato. El usuario llega, lee la promesa, y al empezar a
 * bajar el titular le cede el sitio al prompt que se escribe solo mientras la
 * pieza se forma. De prosa a imagen, sin cortar.
 *
 * Mecánica: contenedor de 400vh, columna pinned, cinco beats sobre el mismo
 * `scrollYProgress`. Nada usa `useState`: un setState por frame es un render
 * por frame, y el blur de área grande ya es la operación más cara del sitio.
 *
 * Regla que no se rompe: el H1 y el CTA son legibles y clicables ANTES de que
 * termine cualquier animación de entrada.
 */

const FRASES = [
  "PALETA: #14171C fondo · #FF5C2B acento · #F4F5F7 texto · #1F242B secundario · #FFA05C energía. Formato vertical 9:16.",
  "Titular «Piel firme en 8 semanas» como el elemento de texto más grande de la pieza, arriba a la izquierda.",
  "Visual principal: el frasco de pie sobre piedra caliza, ocupando tres cuartos de la altura del fotograma, con sombra de contacto.",
  "ILUMINACIÓN: clave cálida a 45 grados arriba a la derecha, relleno suave a la izquierda, contorno frío que separa el envase del fondo.",
  "Cierre de mood: sereno y caro, sin brillos de plástico. Sello de contraentrega abajo y precio $129.900 en la esquina.",
];

const TEXTO = FRASES.join("\n\n");

const H1 = ["Tu producto no se parece a ningún otro.", "Tu landing tampoco debería."];

export function HeroForja() {
  const reduce = useMovimientoReducido();
  if (reduce) return <HeroEstatico />;
  return <HeroScrub />;
}

/* ---------------------------------------------------------------- */

function HeroScrub() {
  const envoltura = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: envoltura,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, SPRING.scroll);

  /* El titular cede el sitio al prompt en el primer 12% del recorrido. */
  const opTitular = useTransform(p, [0, 0.1], [1, 0]);
  const yTitular = useTransform(p, [0, 0.1], [0, -40]);
  const trTitular = useMotionTemplate`translateY(${yTitular}px)`;
  const opPrompt = useTransform(p, [0.06, 0.16], [0, 1]);

  /* Beat 1 (0 → .35): el material se enfoca.
     Va en DOS capas y no en una. La de abajo es el material en bruto y no
     lleva máscara nunca: si el clip empezara en inset(100%) el fotograma
     estaría literalmente vacío en la primera pantalla, que es lo contrario de
     lo que tiene que decir. La de arriba es la pieza ya formada, y es esa la
     que la máscara descubre de abajo hacia arriba. */
  const blur = useTransform(p, [0, 0.35], [26, 0]);
  const grano = useTransform(p, [0, 0.45], [0.55, 0.05]);
  /* Beat 2 (.15 → .55): entra el color. La imagen nace desaturada. */
  const sat = useTransform(p, [0.15, 0.55], [0.12, 1]);
  /* El bodegón es una foto de estudio oscura: desenfocarla 26px la promedia
     a casi negro. Sin levantar la exposición el fotograma se lee como una caja
     vacía en vez de como material sin trabajar, que es lo contrario de lo que
     tiene que decir la primera pantalla. */
  const brillo = useTransform(p, [0, 0.5], [1.6, 1]);
  /* Beat 3 (.30 → .70): la máscara descubre el fotograma de abajo hacia arriba. */
  const inset = useTransform(p, [0.3, 0.7], [100, 0]);
  /* Beat 4 (.70 → .88): se asientan los elementos de la sección. */
  const uiY = useTransform(p, [0.7, 0.88], [18, 0]);
  const uiOp = useTransform(p, [0.7, 0.88], [0, 1]);
  /* Beat 5 (.88 → 1): la pieza queda templada. Aparece el borde metálico. */
  const metal = useTransform(p, [0.88, 1], [0, 1]);

  /* La capa en bruto se apaga a medida que la pieza formada la cubre. */
  const opBruto = useTransform(p, [0.45, 0.75], [1, 0]);
  const blurBruto = useTransform(p, [0, 0.45], [26, 10]);

  /* Contraste bajo a propósito: sin él las altas luces se queman y el
     material deja de leerse como material para leerse como una lámpara. */
  const filtroBruto = useMotionTemplate`blur(${blurBruto}px) saturate(0.08) brightness(1.35) contrast(0.7)`;
  const filtro = useMotionTemplate`blur(${blur}px) saturate(${sat}) brightness(${brillo})`;
  const recorte = useMotionTemplate`inset(${inset}% 0 0 0)`;
  const trUI = useMotionTemplate`translateY(${uiY}px)`;

  return (
    <section
      ref={envoltura}
      aria-labelledby="hero-titulo"
      className="relative h-[300vh] lg:h-[400vh]"
    >
      <div className="sticky top-0 flex min-h-[100dvh] items-center overflow-hidden pt-20">
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 px-6 lg:grid-cols-[1.4fr_1fr] lg:gap-20 lg:px-10">
          {/* ---- Columna izquierda: el titular cede el sitio al prompt ---- */}
          <div className="relative min-h-[26rem] sm:min-h-[24rem]">
            <motion.div style={{ opacity: opTitular, transform: trTitular }}>
              <h1 id="hero-titulo" className="display-xl max-w-[19ch]">
                {H1.map((linea, i) => (
                  <span key={i} className="linea-mascara">
                    <motion.span
                      className="block"
                      initial={{ transform: "translateY(105%)" }}
                      animate={{ transform: "translateY(0%)" }}
                      transition={{ duration: 0.75, delay: 0.15 + i * 0.08, ease: EASE.out }}
                    >
                      {linea}
                    </motion.span>
                  </span>
                ))}
              </h1>

              <motion.p
                initial={{ opacity: 0, transform: "translateY(12px)" }}
                animate={{ opacity: 1, transform: "translateY(0px)" }}
                transition={{ duration: 0.5, delay: 0.48, ease: EASE.out }}
                className="mt-8 max-w-[46ch] cuerpo-lg text-smoke"
              >
                Sube la foto. LandingForge arma las nueve secciones que venden en Colombia.
                Sin plantillas.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, transform: "scale(0.96)" }}
                animate={{ opacity: 1, transform: "scale(1)" }}
                transition={{ duration: 0.45, delay: 0.62, ease: EASE.out }}
                className="mt-10 flex flex-wrap items-center gap-7"
              >
                {/* El único botón magnético de la página. */}
                <Magnetico>
                  <Boton asChild variante="heat" tamano="lg">
                    <Link href="/app/nueva">Crear mi primera landing</Link>
                  </Boton>
                </Magnetico>
                <BotonEnlace href="#tira-titulo">Ver el método</BotonEnlace>
              </motion.div>
            </motion.div>

            <motion.div
              style={{ opacity: opPrompt }}
              className="pointer-events-none absolute inset-0 flex items-center"
            >
              <PromptEscribiendose progreso={p} />
            </motion.div>
          </div>

          {/* ---- Columna derecha: el fotograma ---- */}
          <div className="relative mx-auto w-[min(70vw,280px)] lg:mx-0 lg:w-full lg:max-w-[360px]">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[14px] border border-scale bg-sunk">
              {/* Capa de abajo: el material en bruto. Sin máscara. */}
              <motion.div
                aria-hidden
                style={{ filter: filtroBruto, opacity: opBruto, willChange: "filter, opacity" }}
                className="absolute inset-0"
              >
                <Image
                  src="/pieza/frasco.png"
                  alt=""
                  width={540}
                  height={960}
                  priority
                  sizes="(max-width: 1024px) 70vw, 360px"
                  className="size-full object-cover"
                />
              </motion.div>

              {/* Capa de arriba: la pieza formada, que la máscara descubre. */}
              <motion.div
                style={{ filter: filtro, clipPath: recorte, willChange: "filter, clip-path" }}
                className="absolute inset-0"
              >
                <Image
                  src="/pieza/frasco.png"
                  alt="Sección hero generada para un suplemento de colágeno, con luz de estudio cálida y sombra de contacto"
                  width={540}
                  height={960}
                  priority
                  sizes="(max-width: 1024px) 70vw, 360px"
                  className="size-full object-cover"
                />
              </motion.div>

              <motion.div
                aria-hidden
                style={{ opacity: grano }}
                className="grano absolute inset-0 z-[2]"
              />

              <div className="absolute inset-0 z-[3] flex flex-col justify-between p-5">
                <motion.p
                  style={{ opacity: uiOp, transform: trUI }}
                  className="display-md text-[1.5rem] leading-[1.05] text-[#F4F5F7] drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)]"
                >
                  Piel firme en 8 semanas
                </motion.p>

                <motion.div
                  style={{ opacity: uiOp, transform: trUI }}
                  className="flex items-end justify-between gap-2"
                >
                  <span className="mono-sm rounded-[8px] bg-black/60 px-2.5 py-1 text-[#FFA05C] backdrop-blur-[2px]">
                    $129.900
                  </span>
                  <span className="mono-sm rounded-full border border-[#FF5C2B] px-3 py-1 text-[0.6875rem] text-[#FFA05C]">
                    contraentrega
                  </span>
                </motion.div>
              </div>

              {/* La hairline pasa a la rampa templada justo al terminar: la
                  única vez que el metal aparece en el hero. */}
              <motion.span aria-hidden style={{ opacity: metal }} className="anillo-templado z-[4]" />
            </div>
            <p className="mt-3 mono-sm text-slag">9:16 · 2K</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * El prompt no es un typewriter de reloj: su progreso está atado al scroll.
 * El texto completo vive en el DOM desde el primer render; el nodo animado va
 * `aria-hidden` y la copia accesible en `sr-only`. Un typewriter que escribe
 * dentro del árbol de accesibilidad es un problema real de lectores de pantalla.
 */
function PromptEscribiendose({ progreso }: { progreso: MotionValue<number> }) {
  const nodo = useRef<HTMLParagraphElement>(null);
  const cursor = useRef<HTMLSpanElement>(null);
  const visibles = useTransform(progreso, [0.1, 0.78], [0, TEXTO.length]);

  useMotionValueEvent(visibles, "change", (n) => {
    const el = nodo.current;
    if (!el) return;
    const corte = Math.max(0, Math.min(TEXTO.length, Math.round(n)));
    const texto = TEXTO.slice(0, corte);
    if (el.textContent !== texto) el.textContent = texto;
    if (cursor.current) {
      cursor.current.style.opacity = corte > 0 && corte < TEXTO.length ? "1" : "0";
    }
  });

  return (
    <div className="min-w-0 max-w-[56ch]">
      <p className="sr-only">{TEXTO}</p>
      <p ref={nodo} aria-hidden className="mono-sm whitespace-pre-wrap leading-relaxed text-smoke" />
      <span
        ref={cursor}
        aria-hidden
        className="inline-block h-[1em] w-[0.5em] translate-y-[0.15em] bg-heat opacity-0"
      />
    </div>
  );
}

/**
 * Movimiento reducido: la pieza terminada, el prompt completo, sin scrub.
 * Menos movimiento, no una página rota.
 */
function HeroEstatico() {
  return (
    <section aria-labelledby="hero-titulo" className="pt-32 pb-24">
      <div className="mx-auto grid w-full max-w-[1400px] items-center gap-12 px-6 lg:grid-cols-[1.4fr_1fr] lg:gap-20 lg:px-10">
        <div>
          <h1 id="hero-titulo" className="display-xl max-w-[19ch]">
            {H1.map((l, i) => (
              <span key={i} className="block">{l}</span>
            ))}
          </h1>
          <p className="mt-8 max-w-[46ch] cuerpo-lg text-smoke">
            Sube la foto. LandingForge arma las nueve secciones que venden en Colombia.
            Sin plantillas.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-7">
            <Boton asChild variante="heat" tamano="lg">
              <Link href="/app/nueva">Crear mi primera landing</Link>
            </Boton>
            <BotonEnlace href="#tira-titulo">Ver el método</BotonEnlace>
          </div>
          <p className="mt-10 mono-sm whitespace-pre-wrap leading-relaxed text-smoke">{TEXTO}</p>
        </div>

        <div className="relative mx-auto w-[min(70vw,280px)] lg:mx-0 lg:w-full lg:max-w-[360px]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-[14px] border border-scale bg-sunk">
            <Image
              src="/pieza/frasco.png"
              alt="Sección hero generada para un suplemento de colágeno, con luz de estudio cálida y sombra de contacto"
              width={540}
              height={960}
              priority
              sizes="360px"
              className="size-full object-cover"
            />
            <div className="absolute inset-0 z-[3] flex flex-col justify-between p-5">
              <p className="display-md text-[1.5rem] leading-[1.05] text-[#F4F5F7]">
                Piel firme en 8 semanas
              </p>
              <div className="flex items-end justify-between gap-2">
                <span className="mono-sm rounded-[8px] bg-black/60 px-2.5 py-1 text-[#FFA05C]">
                  $129.900
                </span>
                <span className="mono-sm rounded-full border border-[#FF5C2B] px-3 py-1 text-[0.6875rem] text-[#FFA05C]">
                  contraentrega
                </span>
              </div>
            </div>
            <span aria-hidden className="anillo-templado z-[4]" />
          </div>
          <p className="mt-3 mono-sm text-slag">9:16 · 2K</p>
        </div>
      </div>
    </section>
  );
}
