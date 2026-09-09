"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { useMovimientoReducido } from "@/lib/a11y/preferencias";
import { SPRING } from "@/lib/motion";

/**
 * EL RELATO · el texto y la película comparten reloj.
 *
 * El problema que resuelve: con el copy scrolleando por delante de una toma
 * fija, la página se lee como dos cosas —un papel tapiz que se mueve solo y
 * un documento que pasa por encima—. No basta con que el fondo sea bonito;
 * mientras el texto suba y la imagen no, son dos objetos.
 *
 * La solución es la de la referencia, y es una sola idea: el texto NO scrollea.
 * Se queda clavado en la pantalla, y lo que el scroll hace es avanzar el
 * tiempo —el fotograma de la película y el momento del relato a la vez—. Cada
 * bloque de copy tiene su tramo del recorrido: entra, se sostiene mientras la
 * cámara recorre su parte de la toma, y sale cuando le toca al siguiente. Como
 * los dos leen el MISMO progreso, no pueden desincronizarse: no hay dos
 * animaciones que haya que cuadrar, hay una sola magnitud.
 *
 * De ahí que el bloque quieto se sienta unido a la imagen que se mueve: el
 * espectador atribuye el movimiento a la cámara, no a la página. Es la
 * diferencia entre mirar por una ventanilla y pasar páginas.
 *
 * Accesibilidad: los tramos que no tocan no son solo invisibles, son `inert`.
 * Un bloque a opacidad 0 sigue estando en el orden de tabulación y sigue
 * leyéndose en voz alta, así que sin esto el teclado caería en un botón que
 * nadie ve y el lector de pantalla anunciaría cinco titulares seguidos. Con
 * movimiento reducido no se fija nada: los tramos vuelven a ser secciones
 * apiladas, que es lo que son cuando les quitas el tiempo.
 */

/* Pantallas de scroll por tramo. Con 100 el reparto sale a unos 700 px por
   tramo y los cruces se comen medio recorrido: el texto pasa más tiempo
   entrando y saliendo que puesto, que es justo lo que se siente como
   parpadeo. Con 130 el sostenido domina y el cruce es un gesto. */
const ALTO_TRAMO = 130;

export interface Tramo {
  id: string;
  /** El primero lleva el h1; el resto, h2. */
  titulo: React.ReactNode;
  eyebrow?: string;
  cuerpo?: React.ReactNode;
  /** Listas, botones, cifras: lo que acompaña al titular en ese tramo. */
  pie?: React.ReactNode;
}

export function Relato({ tramos }: { tramos: Tramo[] }) {
  const reduce = useMovimientoReducido();
  return reduce ? <Apilado tramos={tramos} /> : <Fijado tramos={tramos} />;
}

/* ---------------------------------------------------------------- */

function Fijado({ tramos }: { tramos: Tramo[] }) {
  const pista = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(0);

  const { scrollYProgress } = useScroll({
    target: pista,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, SPRING.scroll);

  /* El tramo activo se calcula del mismo progreso que mueve la opacidad, así
     que `inert` y lo que se ve no pueden discrepar. */
  useMotionValueEvent(p, "change", (v) => {
    const i = Math.min(tramos.length - 1, Math.max(0, Math.floor(v * tramos.length)));
    setActivo((prev) => (prev === i ? prev : i));
  });

  return (
    <div
      ref={pista}
      className="relative"
      style={{ height: `${tramos.length * ALTO_TRAMO}vh` }}
    >
      <div className="sticky top-0 flex h-[100dvh] items-center overflow-hidden">
        {tramos.map((t, i) => (
          <Bloque
            key={t.id}
            tramo={t}
            indice={i}
            total={tramos.length}
            progreso={p}
            inerte={i !== activo}
          />
        ))}
      </div>
    </div>
  );
}

function Bloque({
  tramo,
  indice,
  total,
  progreso,
  inerte,
}: {
  tramo: Tramo;
  indice: number;
  total: number;
  progreso: MotionValue<number>;
  inerte: boolean;
}) {
  const inicio = indice / total;
  const fin = (indice + 1) / total;
  const d = fin - inicio;
  /* Cruce corto y relevo CONSECUTIVO: el saliente termina de irse justo donde
     el entrante empieza a llegar.

     Se probó lo contrario —ventanas solapadas, para que nunca faltara texto en
     pantalla— y el resultado fue peor de lo que evitaba: dos titulares
     completos superpuestos al 55 %, con la misma familia, el mismo cuerpo y el
     mismo margen izquierdo. Ilegible. Ningún desplazamiento vertical los
     separa, porque los bloques miden más de media pantalla.

     Así que en la frontera hay un instante en que solo se ve la toma. No es un
     hueco que se nos haya colado: es la respiración entre dos ideas, y es lo
     que hace la referencia. Lo que importa es que sea BREVE —a 0.10 del tramo
     por lado son unos 100 px de scroll, un golpe de rueda— y no un tramo
     muerto. `scripts/verificar-relato.mjs` lo mide y falla si crece.

     El primero está puesto desde el principio —la página tiene que saludar sin
     pedir scroll— y el último no se va, porque después de él sigue el resto de
     la página. */
  const cruce = d * 0.1;
  const marcas = [inicio, inicio + cruce, fin - cruce, fin];
  const opacidad = useTransform(progreso, marcas, [indice === 0 ? 1 : 0, 1, 1, indice === total - 1 ? 1 : 0]);
  /* Un desplazamiento corto, en la dirección del scroll: el texto entra por
     abajo y sale por arriba, como si la cámara pasara por delante de él. */
  const y = useTransform(progreso, marcas, [indice === 0 ? 0 : 48, 0, 0, indice === total - 1 ? 0 : -48]);

  return (
    <motion.div
      style={{ opacity: opacidad, y }}
      inert={inerte}
      className="absolute inset-x-0 mx-auto w-full max-w-[1400px] px-6 lg:px-10"
    >
      <Contenido tramo={tramo} indice={indice} />
    </motion.div>
  );
}

/* ---------------------------------------------------------------- */

function Apilado({ tramos }: { tramos: Tramo[] }) {
  return (
    <div>
      {tramos.map((t, i) => (
        <section key={t.id} className="py-24 lg:py-28" aria-labelledby={`${t.id}-titulo`}>
          <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
            <Contenido tramo={t} indice={i} />
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Contenido({ tramo, indice }: { tramo: Tramo; indice: number }) {
  const Titular = indice === 0 ? "h1" : "h2";
  return (
    <>
      {tramo.eyebrow && <p className="etiqueta text-slag">{tramo.eyebrow}</p>}
      <Titular
        id={`${tramo.id}-titulo`}
        className={indice === 0 ? "mt-6 display-xl max-w-[17ch]" : "mt-6 display-lg max-w-[20ch]"}
      >
        {tramo.titulo}
      </Titular>
      {tramo.cuerpo && <div className="mt-7 medida cuerpo-lg text-smoke">{tramo.cuerpo}</div>}
      {tramo.pie && <div className="mt-10">{tramo.pie}</div>}
    </>
  );
}
