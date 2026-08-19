import "server-only";

/**
 * Rate limiting — §9.6. Sin él, cualquiera con la URL puede vaciar la cuota.
 *
 * Ventana deslizante en memoria del proceso. Es suficiente para esta entrega y
 * para un despliegue de una sola instancia; en varias instancias hay que
 * mover el contador a Redis o al KV de la plataforma. Se dice aquí para que
 * nadie lo descubra en producción.
 */

type Ventana = { marcas: number[] };
const ventanas = new Map<string, Ventana>();

/** Limpieza perezosa: se purga al consultar, no con un temporizador. */
function purgar(v: Ventana, desde: number) {
  while (v.marcas.length > 0 && v.marcas[0] < desde) v.marcas.shift();
}

export interface ResultadoLimite {
  permitido: boolean;
  restantes: number;
  /** Segundos hasta que se libere un hueco. */
  esperaSegundos: number;
}

export function limitar(clave: string, maximo: number, ventanaMs: number): ResultadoLimite {
  const ahora = Date.now();
  const v = ventanas.get(clave) ?? { marcas: [] };
  purgar(v, ahora - ventanaMs);

  if (v.marcas.length >= maximo) {
    ventanas.set(clave, v);
    const espera = Math.ceil((v.marcas[0] + ventanaMs - ahora) / 1000);
    return { permitido: false, restantes: 0, esperaSegundos: Math.max(1, espera) };
  }

  v.marcas.push(ahora);
  ventanas.set(clave, v);
  return { permitido: true, restantes: maximo - v.marcas.length, esperaSegundos: 0 };
}

/** IP del cliente detrás de un proxy. Sin cabecera, se agrupa todo junto. */
export function ipDe(peticion: Request): string {
  const reenviada = peticion.headers.get("x-forwarded-for");
  if (reenviada) return reenviada.split(",")[0].trim();
  return peticion.headers.get("x-real-ip") ?? "desconocida";
}
