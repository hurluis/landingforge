import type { Plan } from "@/lib/datos/tipos";

/**
 * Planes — §8.2 del brief.
 *
 * ⚠️ Los precios son ILUSTRATIVOS y están sin validar. Antes de publicarlos hay
 * que correr la fórmula de §8.1 con la tarifa vigente de la API de imagen.
 * Publicar un precio sin unit economics es la forma más rápida de vender a
 * pérdida. La página de precios lo declara con esa misma honestidad.
 */

export interface DefinicionPlan {
  id: Plan;
  nombre: string;
  precioMensualCOP: number;
  creditosMes: number;
  campanasGuardadas: number | "ilimitadas";
  paletasAlternativas: number;
  marcas: number | "ilimitadas";
  soporte: string;
  /** La del medio es el ancla visual, sin badge de «Más popular» (§6.2.8). */
  destacado: boolean;
}

export const PLANES: readonly DefinicionPlan[] = [
  {
    id: "semilla",
    nombre: "Semilla",
    precioMensualCOP: 49900,
    creditosMes: 30,
    campanasGuardadas: 5,
    paletasAlternativas: 1,
    marcas: 1,
    soporte: "Correo",
    destacado: false,
  },
  {
    id: "estudio",
    nombre: "Estudio",
    precioMensualCOP: 129900,
    creditosMes: 120,
    campanasGuardadas: "ilimitadas",
    paletasAlternativas: 3,
    marcas: 3,
    soporte: "Correo prioritario",
    destacado: true,
  },
  {
    id: "agencia",
    nombre: "Agencia",
    precioMensualCOP: 349900,
    creditosMes: 400,
    campanasGuardadas: "ilimitadas",
    paletasAlternativas: 3,
    marcas: "ilimitadas",
    soporte: "Canal directo",
    destacado: false,
  },
] as const;

export const PAQUETE_EXTRA = { creditos: 25, precioCOP: 34900 };

/** Créditos de prueba al registrarse, sin tarjeta. */
export const CREDITOS_BIENVENIDA = 5;

export function plan(id: Plan): DefinicionPlan {
  const p = PLANES.find((x) => x.id === id);
  if (!p) throw new Error(`Plan desconocido: ${id}`);
  return p;
}

export function limiteCampanas(id: Plan): number {
  const c = plan(id).campanasGuardadas;
  return c === "ilimitadas" ? Number.POSITIVE_INFINITY : c;
}
