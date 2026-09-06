/**
 * EL MUNDO · las seis escenas y el recorrido de la cámara.
 *
 * Este archivo es dato puro: no importa three, ni React, ni toca el DOM. Se
 * puede leer, discutir y cambiar sin abrir el motor, y por eso la coreografía
 * se ajusta editando números aquí en vez de buscándolos dentro del bucle.
 *
 * El argumento del recorrido es el mismo de la marca —material en bruto,
 * calor, pieza terminada— contado en seis paradas en lugar de en cinco beats
 * sobre un solo fotograma:
 *
 *   1 caos      el problema, en frío. Es la única escena sin nada de --heat.
 *   2 forja     la metodología actuando. Máximo calor de toda la página.
 *   3 linea     las nueve tipologías saliendo de sus moldes.
 *   4 mercado   Colombia: contraentrega, reseñas, domicilio.
 *   5 boveda    confianza, en temple frío. La escena más quieta.
 *   6 tienda    el resultado, encendido y cálido.
 *
 * La temperatura sube, se enfría en la bóveda y vuelve a subir al cerrar. Es
 * la misma curva que ya recorren el campo de luz y la constelación, así que
 * las tres capas cuentan lo mismo al mismo tiempo.
 */

export type IdEscena = "caos" | "forja" | "linea" | "mercado" | "boveda" | "tienda";

export interface Escena {
  id: IdEscena;
  /** Centro del diorama en el espacio del mundo. */
  centro: [number, number, number];
  /** Dónde se planta la cámara cuando ha «llegado» a esta escena. */
  camara: [number, number, number];
  /** A qué mira entonces. Casi siempre el centro, desplazado a gusto. */
  mira: [number, number, number];
  /**
   * Altura extra del punto de paso ANTES de esta escena. Es el «salto aéreo»
   * entre dioramas: la cámara sube, cruza y vuelve a bajar. Sin él, el vuelo
   * atraviesa el suelo de la escena anterior.
   */
  salto: number;
  /**
   * Cuánto scroll ocupa la escena, en pantallas. Las escenas con más que leer
   * duran más. La suma de todas es la altura de la sección.
   */
  pantallas: number;
  /**
   * Cuánto se demora la cámara en el centro de la escena, 0 a 1. Reparte el
   * tiempo hacia el medio del tramo, que es cuando el texto está a plena
   * opacidad, y acelera hacia la costura. Por encima de 0.6 se nota frenar.
   */
  reposo: number;
  /** Temperatura de la escena, 0 frío a 1 incandescente. Mueve las luces. */
  calor: number;

  /* --- Lo que se lee encima --- */
  indice: string;
  eyebrow: string;
  titulo: string;
  cuerpo: string;
  etiquetas: string[];
}

export const ESCENAS: readonly Escena[] = [
  {
    id: "caos",

    centro: [0, 0, 0],
    camara: [0, 4, 20],
    mira: [0, 0.6, 0],
    salto: 0,
    pantallas: 1.5,
    reposo: 0.4,
    calor: 0,
    indice: "01",
    eyebrow: "Antes",
    /* El h1 de la página. Es el titular del hero anterior, conservado palabra
       por palabra: cambia el escenario, no la promesa. */
    titulo: "Tu producto no se parece a ningún otro. Tu landing tampoco debería.",
    cuerpo:
      "Y sin embargo se vende con una foto de celular contra una pared blanca, luz de bombillo y un fondo que no dice nada. El comprador no ve un negocio. Ve un riesgo.",
    etiquetas: ["Sin estructura", "Sin señales locales"],
  },
  {
    id: "forja",

    centro: [26, -2, -30],
    camara: [26, 2.2, -12],
    mira: [26, -2.2, -30],
    salto: 9,
    pantallas: 1.8,
    reposo: 0.5,
    calor: 1,
    indice: "02",
    eyebrow: "La metodología",
    titulo: "El prompt es la pieza.",
    cuerpo:
      "El motor no es una IA que hace imágenes bonitas. Es una metodología de ingeniería de prompts, estructurada y versionada, que se ejecuta sobre un modelo generativo intercambiable. El modelo se puede cambiar. La metodología es el activo.",
    etiquetas: ["Siete componentes", "Validador de siete reglas"],
  },
  {
    id: "linea",

    centro: [-2, -6, -66],
    camara: [14, 2, -52],
    mira: [-2, -5.2, -66],
    salto: 10,
    pantallas: 1.8,
    reposo: 0.45,
    calor: 0.62,
    indice: "03",
    eyebrow: "Nueve tipologías",
    titulo: "Cada sección tiene su molde.",
    cuerpo:
      "Hero, beneficios, antes y después, paso a paso, testimonios, autoridad, confianza, precios y estilo de vida. Cada una con su propósito, su regla crítica y la lista de errores que el prompt tiene que evitar de forma explícita.",
    etiquetas: ["9 moldes", "Reglas por tipología"],
  },
  {
    id: "mercado",

    centro: [-34, -10, -96],
    camara: [-17, -3.5, -82],
    mira: [-34, -10.5, -96],
    salto: 11,
    pantallas: 1.8,
    reposo: 0.45,
    calor: 0.5,
    indice: "04",
    eyebrow: "Mercado colombiano",
    titulo: "Contraentrega, sello y caras de aquí.",
    cuerpo:
      "Las señales que convierten en Colombia no son las que convierten afuera. Pagar cuando el producto llega a la mano, el registro sanitario visible, y caras que un colombiano reconozca como suyas. Van especificadas en el prompt, no dejadas al azar del modelo.",
    etiquetas: ["Contraentrega", "Origen regional", "$99.900"],
  },
  {
    id: "boveda",

    centro: [-6, -16, -130],
    camara: [-6, -11.5, -111],
    mira: [-6, -16.2, -130],
    salto: 10,
    pantallas: 1.6,
    reposo: 0.55,
    calor: 0.08,
    indice: "05",
    eyebrow: "Confianza",
    titulo: "El sello va antes que el precio.",
    cuerpo:
      "Garantía, política de devolución y registro sanitario. Es lo que un comprador necesita ver para decidirse a pagar por algo que todavía no tiene en la mano, y es la sección que más gente deja para el final.",
    etiquetas: ["Garantía", "Devolución"],
  },
  {
    id: "tienda",

    centro: [24, -20, -160],
    camara: [24, -15.5, -139],
    mira: [24, -20.5, -160],
    salto: 11,
    pantallas: 2.1,
    reposo: 0.5,
    calor: 0.85,
    indice: "06",
    eyebrow: "Después",
    titulo: "Una landing que se ve como un negocio.",
    cuerpo:
      "Nueve secciones con la paleta ya asignada, el copy escrito y los prompts validados, listos para producir. El mismo producto, contado como lo contaría una marca que sí tiene equipo de diseño.",
    etiquetas: ["9 secciones", "Paleta asignada", "Listo para producir"],
  },
] as const;

/** Altura total de la sección, en pantallas. La usa el layout y el bucle. */
export const PANTALLAS_TOTALES = ESCENAS.reduce((s, e) => s + e.pantallas, 0);

/**
 * Los límites de cada escena en progreso normalizado 0..1.
 * `[inicio, fin]` por escena, proporcionales a `pantallas`.
 */
export const TRAMOS: readonly [number, number][] = (() => {
  let acumulado = 0;
  return ESCENAS.map((e) => {
    const inicio = acumulado / PANTALLAS_TOTALES;
    acumulado += e.pantallas;
    return [inicio, acumulado / PANTALLAS_TOTALES] as [number, number];
  });
})();
