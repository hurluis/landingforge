"use client";

import { useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
  type Variants,
} from "motion/react";
import { useMovimientoReducido } from "@/lib/a11y/preferencias";
import { EASE, SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

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

/* EL REVELADO, línea a línea.
 *
 * Cada línea vive en una máscara `overflow-hidden` y entra desde un 120 % por
 * debajo CON UNA ROTACIÓN de seis grados y el origen en la esquina superior
 * izquierda. Esa rotación es la diferencia entre un texto que aparece y un
 * texto que llega: al enderezarse, la línea pivota sobre su inicio y el ojo lee
 * un gesto físico, no un cambio de opacidad. Es la técnica de la referencia.
 *
 * Y entran ESCALONADAS. Que la segunda línea salga cuando la primera va por la
 * mitad es lo que hace que un titular de tres líneas se lea como una frase que
 * se dice, en vez de como un bloque que se enciende.
 *
 * El cuerpo y los items van más blandos —desplazamiento corto y opacidad—
 * porque son texto de lectura: rotar un párrafo entero marea. */
const CONTENEDOR: Variants = {
  oculto: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

const LINEA: Variants = {
  oculto: { y: "120%", rotate: 6 },
  visible: { y: "0%", rotate: 0, transition: { duration: 0.8, ease: EASE.out } },
};

const BLANDO: Variants = {
  oculto: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.62, ease: EASE.out } },
};

/* Con movimiento reducido no se mueve nada: aparece y ya. */
const QUIETO: Variants = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
};

/** <ol> cuando el orden significa algo, <ul> cuando no. */
function ListaMotion({
  ordenada,
  ...props
  /* Se descarta `ref`: las dos ramas devuelven elementos distintos y aquí
     nunca se pasa una, así que unificar el tipo no compra nada. */
}: { ordenada?: boolean } & Omit<React.ComponentProps<typeof motion.ul>, "ref">) {
  const Etiqueta = ordenada ? motion.ol : motion.ul;
  return <Etiqueta {...props} />;
}

/** Una línea recortada por su propia máscara. */
function Linea({ children, v }: { children: React.ReactNode; v: Variants }) {
  return (
    /* El relleno inferior deja sitio a los descendentes y a la esquina que
       levanta la rotación; el margen negativo lo devuelve, así que el ritmo
       vertical no cambia. Sin esto la máscara corta las jotas. */
    <span className="block overflow-hidden pb-[0.16em] -mb-[0.16em]">
      <motion.span variants={v} className="block origin-top-left will-change-transform">
        {children}
      </motion.span>
    </span>
  );
}

export interface Tramo {
  id: string;
  /** Una entrada por LÍNEA: cada una entra por su cuenta y escalonada. */
  titulo: string[];
  eyebrow?: string;
  cuerpo?: React.ReactNode;
  /** Bloques que aparecen UNO POR UNO. Tarjetas, pasos, consecuencias. */
  items?: { clave: string; nodo: React.ReactNode }[];
  /** Clase de la lista que los contiene, para que el layout viva en la página. */
  claseItems?: string;
  /** Cuando el orden importa —los tres pasos—, la lista es <ol>. */
  itemsOrdenados?: boolean;
  /** Lo que cierra el tramo: botones, una cifra. Entra al final. */
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
            activo={i === activo}
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
  activo,
}: {
  tramo: Tramo;
  indice: number;
  total: number;
  progreso: MotionValue<number>;
  activo: boolean;
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
      inert={!activo}
      /* El copy vive en una COLUMNA IZQUIERDA, no a todo el ancho. Es la
         medida de la referencia y es lo que hace que la película sea la
         protagonista: la mitad derecha del encuadre no lleva nada encima, así
         que ahí el fotograma se ve a plena luz. A todo el ancho habría que
         cubrir la pantalla entera de degradado para que el texto se leyera, y
         entonces la imagen vuelve a ser papel pintado. */
      className="absolute inset-x-0 mx-auto w-full max-w-[1400px] px-6 lg:px-10"
    >
      <Contenido tramo={tramo} indice={indice} visible={activo} />
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
            <Contenido tramo={t} indice={i} visible />
          </div>
        </section>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- */

function Contenido({
  tramo,
  indice,
  visible,
}: {
  tramo: Tramo;
  indice: number;
  visible: boolean;
}) {
  const reduce = useMovimientoReducido();
  const Titular = indice === 0 ? motion.h1 : motion.h2;
  const linea = reduce ? QUIETO : LINEA;
  const blando = reduce ? QUIETO : BLANDO;

  return (
    <motion.div
      className="tramo w-full lg:max-w-[min(56vw,760px)]"
      variants={CONTENEDOR}
      initial="oculto"
      animate={visible ? "visible" : "oculto"}
    >
      {tramo.eyebrow && (
        <p className="etiqueta text-slag">
          <Linea v={linea}>{tramo.eyebrow}</Linea>
        </p>
      )}

      <Titular
        id={`${tramo.id}-titulo`}
        className={
          indice === 0
            ? "mt-5 display-xl text-[clamp(2.2rem,3.9vw,3.6rem)]"
            : /* Un tramo clavado no puede crecer hacia abajo: lo que no cabe
                 en la pantalla no existe. Por eso el titular de tramo va por
                 debajo de display-lg —unos 49 px a 1440, la medida de los
                 rótulos de sección de la referencia— y deja sitio al pie. */
              "mt-5 display-lg text-[clamp(2rem,3.4vw,3.2rem)]"
        }
      >
        {tramo.titulo.map((l) => (
          <Linea key={l} v={linea}>
            {l}
          </Linea>
        ))}
      </Titular>

      {tramo.cuerpo && (
        <motion.div variants={blando} className="mt-5 medida cuerpo-lg text-smoke">
          {tramo.cuerpo}
        </motion.div>
      )}

      {/* Uno por uno: cada bloque hereda el escalonado del contenedor, así que
          las tarjetas no se encienden a la vez sino que se van poniendo. */}
      {tramo.items && (
        /* `motion.ul` no acepta `as`; se elige el componente, que además deja
           el tipo correcto en cada rama. */
        <ListaMotion
          ordenada={tramo.itemsOrdenados}
          variants={CONTENEDOR}
          className={cn("mt-8", tramo.claseItems)}
        >
          {tramo.items.map((it) => (
            <motion.li key={it.clave} variants={blando}>
              {it.nodo}
            </motion.li>
          ))}
        </ListaMotion>
      )}

      {tramo.pie && (
        <motion.div variants={blando} className="mt-8">
          {tramo.pie}
        </motion.div>
      )}
    </motion.div>
  );
}
