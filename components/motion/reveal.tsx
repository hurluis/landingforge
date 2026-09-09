"use client";

import { memo } from "react";
import { motion } from "motion/react";
import { useMovimientoReducido } from "@/lib/a11y/preferencias";
import { EASE, UNA_VEZ } from "@/lib/motion";

/**
 * M5 · Revelado de titulares por línea con máscara.
 *
 * Este es el que reemplaza al `fade-up` genérico que hunde las páginas
 * generadas. Cada línea vive en un contenedor `overflow-hidden` y el span
 * interno sube desde el 105%: el texto no aparece, entra.
 *
 * Detalle que no es opcional: el disparador `whileInView` va en el TITULAR,
 * nunca en el span interno. El span arranca desplazado un 105% y por tanto
 * está recortado por su propia máscara, así que el IntersectionObserver no lo
 * ve nunca y la animación no se dispararía jamás. El titular sí es visible, y
 * las líneas se orquestan desde él con variantes.
 *
 * El texto completo está en el DOM desde el primer render, así que el
 * revelado no afecta al lector de pantalla ni al SEO.
 */

const LINEA = {
  oculto: { transform: "translateY(105%)" },
  visible: { transform: "translateY(0%)" },
};

const LINEA_SUAVE = {
  oculto: { opacity: 0 },
  visible: { opacity: 1 },
};

export const RevealLineas = memo(function RevealLineas({
  lineas,
  className,
  as = "h2",
  retraso = 0,
  id,
}: {
  lineas: string[];
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
  retraso?: number;
  /* Las secciones se nombran con `aria-labelledby` apuntando a su titular, y
     su titular casi siempre es este componente. Sin poder ponerle el id, esas
     referencias quedaban colgando y el lector de pantalla anunciaba la sección
     sin nombre. */
  id?: string;
}) {
  const reduce = useMovimientoReducido();
  const Etiqueta = motion[as];
  const variantes = reduce ? LINEA_SUAVE : LINEA;

  return (
    <Etiqueta
      id={id}
      className={className}
      initial="oculto"
      whileInView="visible"
      viewport={UNA_VEZ}
      variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: retraso } } }}
    >
      {lineas.map((linea, i) => (
        <span key={i} className="linea-mascara">
          <motion.span
            data-reveal
            className="block"
            variants={variantes}
            transition={{ duration: reduce ? 0.25 : 0.75, ease: EASE.out }}
          >
            {linea}
          </motion.span>
        </span>
      ))}
    </Etiqueta>
  );
});

/**
 * Acompañamiento del titular: cuerpo, botones, lo que sigue.
 * `direccion` la elige quien escribe la sección, derivada del contenido:
 * ninguna sección de la página repite la de otra.
 */
export const RevealBloque = memo(function RevealBloque({
  children,
  className,
  direccion = "abajo",
  retraso = 0,
  duracion = 0.6,
}: {
  children: React.ReactNode;
  className?: string;
  direccion?: "abajo" | "derecha" | "izquierda";
  retraso?: number;
  duracion?: number;
}) {
  const reduce = useMovimientoReducido();

  const desde =
    direccion === "derecha"
      ? "translateX(28px)"
      : direccion === "izquierda"
        ? "translateX(-28px)"
        : "translateY(16px)";

  return (
    <motion.div
      data-reveal
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, transform: desde }}
      whileInView={{ opacity: 1, transform: "translate(0px, 0px)" }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: reduce ? 0.25 : duracion, delay: retraso, ease: EASE.out }}
    >
      {children}
    </motion.div>
  );
});

/**
 * Stagger entre hermanos. Tope de 20 elementos simultáneos: más allá el ojo
 * deja de leerlo como secuencia y empieza a leerlo como ruido.
 */
export const RevealLista = memo(function RevealLista({
  items,
  className,
  claseItem,
  paso = 0.06,
  direccion = "abajo",
}: {
  items: React.ReactNode[];
  className?: string;
  claseItem?: string;
  paso?: number;
  direccion?: "abajo" | "derecha";
}) {
  const reduce = useMovimientoReducido();
  const desde = direccion === "derecha" ? "translateX(32px)" : "translateY(20px)";

  return (
    <motion.ul
      className={className}
      initial="oculto"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={{ visible: { transition: { staggerChildren: paso } } }}
    >
      {items.slice(0, 20).map((hijo, i) => (
        <motion.li
          key={i}
          data-reveal
          className={claseItem}
          variants={{
            oculto: reduce ? { opacity: 0 } : { opacity: 0, transform: desde },
            visible: {
              opacity: 1,
              transform: "translate(0px, 0px)",
              transition: { duration: reduce ? 0.25 : 0.55, ease: EASE.out },
            },
          }}
        >
          {hijo}
        </motion.li>
      ))}
    </motion.ul>
  );
});
