import type { Producto } from "@/lib/datos/tipos";

type ProductoGuardado = Producto & { precioCOP?: number; precioTachadoCOP?: number };

/**
 * El producto tal como sale de la base de datos, puesto al día.
 *
 * Antes de los mercados el precio se guardaba como `precioCOP` y toda campaña
 * era de Colombia. Esas filas siguen ahí, y se leen con los nombres nuevos en
 * vez de migrarlas: el JSON viejo no se toca y ningún componente tiene que
 * saber que existió.
 */
export function productoGuardado(crudo: ProductoGuardado): Producto {
  const { precioCOP, precioTachadoCOP, ...resto } = crudo;
  return {
    ...resto,
    mercado: crudo.mercado ?? "CO",
    precio: crudo.precio ?? precioCOP ?? 0,
    precioTachado: crudo.precioTachado ?? precioTachadoCOP,
  };
}
