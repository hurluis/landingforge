/**
 * EL MUNDO · las seis escenas y el recorrido de la cámara.
 *
 * Este archivo es dato puro: no importa three, ni React, ni toca el DOM. Se
 * puede leer, discutir y cambiar sin abrir el motor, y por eso la coreografía
 * se ajusta editando números aquí en vez de buscándolos dentro del bucle.
 *
 * EL ARCO CUENTA EL SERVICIO, NO LA TECNOLOGÍA. El visitante es un vendedor
 * de e-commerce o dropshipping: llegó porque quiere vender más, no porque le
 * interese la ingeniería de prompts. Así que el recorrido va de su problema a
 * su resultado, y el motor aparece en medio como el medio que es:
 *
 *   1 caos      el problema real: foto de proveedor y plantilla genérica.
 *   2 forja     el motor: de una foto a la landing completa.
 *   3 linea     las nueve secciones, cada una con su trabajo sobre el scroll.
 *   4 mercado   engagement donde de verdad ocurre: el scroll colombiano.
 *   5 boveda    confianza, que es lo que convierte a quien no te conoce.
 *   6 tienda    el resultado: tráfico que se vuelve pedidos.
 *
 * La ingeniería de prompts se nombra en la escena 2 y se explica en
 * /metodologia. Aquí es el mecanismo, no el titular: nadie compra un prompt,
 * se compra una landing que vende.
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
    eyebrow: "El problema",
    /* El h1 de la página. Es el titular del hero anterior, conservado palabra
       por palabra: cambia el escenario, no la promesa. */
    titulo: "Tu producto no se parece a ningún otro. Tu landing tampoco debería.",
    cuerpo:
      "Pero sale con la foto que te mandó el proveedor y una plantilla igual a la de los otros doscientos que venden lo mismo. En un feed donde el comprador decide en tres segundos, eso no compite: desaparece.",
    etiquetas: ["Foto de proveedor", "Plantilla genérica"],
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
    eyebrow: "El motor",
    titulo: "De una foto a la landing completa.",
    cuerpo:
      "Subes la foto de tu producto y respondes cuatro preguntas. LandingForge te devuelve la paleta asignada, el copy escrito y las nueve secciones listas para producir. La ingeniería de prompts es el mecanismo por dentro; lo que recibes es la landing.",
    etiquetas: ["Foto → landing", "Paleta asignada", "Copy escrito"],
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
    eyebrow: "Engagement por diseño",
    titulo: "Nueve secciones que sostienen el scroll.",
    cuerpo:
      "El hero frena el dedo. Los beneficios convencen al que ya miró. El antes y después prueba. Los testimonios y el sello quitan el miedo. Cada sección tiene un trabajo sobre la atención, y ninguna está ahí para rellenar.",
    etiquetas: ["9 secciones", "Cada una con su trabajo"],
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
    titulo: "Hecha para el scroll de aquí.",
    cuerpo:
      "El tráfico que compras en TikTok y Meta llega con las expectativas de este mercado: pagar cuando el producto está en la mano, precios con punto de miles y caras que un colombiano reconozca como suyas. Va especificado en cada sección, no dejado al azar.",
    etiquetas: ["Contraentrega", "Caras de aquí", "$99.900"],
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
    eyebrow: "Lo que convierte",
    titulo: "El sello va antes que el precio.",
    cuerpo:
      "Tu comprador no conoce tu marca y le estás pidiendo que pague por algo que todavía no tiene en la mano. Garantía, política de devolución y registro sanitario visibles no son un trámite: son la diferencia entre un carrito abandonado y un pedido.",
    etiquetas: ["Garantía", "Devolución", "Registro"],
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
    eyebrow: "El resultado",
    titulo: "Tráfico que se vuelve pedidos.",
    cuerpo:
      "La misma inversión en anuncios, cayendo en una página que retiene y convierte en vez de en una plantilla. Nueve secciones listas para publicar, y el mismo producto contado como lo contaría una marca con equipo de diseño detrás.",
    etiquetas: ["Listo para publicar", "9 secciones", "Sin diseñador"],
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
