import Image from "next/image";
import type { TipologiaSeccion } from "@/lib/datos/tipos";

/**
 * Una sección REAL generada con LandingForge, no una maqueta.
 *
 * Hasta ahora la tira y el muestrario dibujaban las nueve secciones con
 * `Lamina`: rectángulos, barras grises y una paleta de ejemplo. Servía para
 * enseñar la ESTRUCTURA de cada tipología, y como diagrama estaba bien, pero
 * una página que vende piezas visuales no puede ilustrarse con wireframes. El
 * visitante venía a ver si el resultado es bueno, y le enseñábamos un plano.
 *
 * Estas son capturas de campañas de verdad, una por tipología, servidas desde
 * `public/secciones`. Van con `alt` vacío a propósito: cada una lleva al lado
 * su rótulo visible —«02 · Beneficios»— así que describirlas otra vez solo
 * haría que el lector de pantalla dijera lo mismo dos veces seguidas.
 */
export function SeccionReal({
  tipologia,
  prioridad = false,
}: {
  tipologia: TipologiaSeccion;
  prioridad?: boolean;
}) {
  return (
    <Image
      src={`/secciones/${tipologia}.png`}
      alt=""
      fill
      /* Nunca se pinta más ancha de 260 px, y next/image sirve avif encima. */
      sizes="(max-width: 640px) 62vw, 260px"
      className="object-cover"
      priority={prioridad}
    />
  );
}
