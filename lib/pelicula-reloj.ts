/**
 * El reloj de la película — una sola fuente de verdad para el tiempo de la toma.
 *
 * El canvas decide qué fotograma toca; el HUD lo enseña; los capítulos saben
 * en qué acto están. Si cada uno calculase su propio progreso, bastaría una
 * diferencia de suavizado para que el contador dijera «fotograma 212» mientras
 * la pantalla enseña el 219. Así que solo `Pelicula` calcula, y publica aquí.
 *
 * Va fuera de React a propósito: se publica en cada frame de animación, y un
 * estado de React en cada frame sería un render por frame. Quien escucha
 * escribe directo al DOM.
 */

export const TOTAL_FOTOGRAMAS = 480;

/**
 * Los actos de la toma, leídos del propio vídeo (una hoja de contactos cada
 * 40 fotogramas). Son la razón de que el copy caiga donde cae: cada capítulo
 * de la apertura aterriza cuando la cámara llega a su acto.
 */
export const ACTOS = [
  { id: "estudio", nombre: "Estudio", desde: 0 },
  { id: "despegue", nombre: "Despegue", desde: 40 },
  { id: "flotacion", nombre: "Flotación", desde: 80 },
  { id: "marca", nombre: "La marca", desde: 200 },
  { id: "mano", nombre: "En la mano", desde: 360 },
] as const;

export type Acto = (typeof ACTOS)[number];

export function actoDe(fotograma: number): Acto {
  let actual: Acto = ACTOS[0];
  for (const a of ACTOS) if (fotograma >= a.desde) actual = a;
  return actual;
}

export interface EstadoPelicula {
  /** 0 … TOTAL_FOTOGRAMAS-1, el que está pintado en el canvas. */
  fotograma: number;
  /** 0 … 1 dentro de la zona de la apertura. */
  progreso: number;
  /** 0 mientras dura la toma; sube a 1 al salir de la zona. */
  salida: number;
}

let estado: EstadoPelicula = { fotograma: 0, progreso: 0, salida: 0 };
const oyentes = new Set<(e: EstadoPelicula) => void>();

export function publicar(e: EstadoPelicula): void {
  estado = e;
  oyentes.forEach((o) => o(e));
}

/** Se llama al instante con el estado actual, y en cada cambio después. */
export function escuchar(o: (e: EstadoPelicula) => void): () => void {
  oyentes.add(o);
  o(estado);
  return () => {
    oyentes.delete(o);
  };
}
