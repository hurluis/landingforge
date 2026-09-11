import type { Plan } from "@/lib/datos/tipos";

/**
 * Planes — §8.2 del brief, recalculados sobre el costo real de una generación.
 *
 * QUÉ SE COBRA. No landings ni campañas: GENERACIONES. Una generación es una
 * sección construida y renderizada. Quien pide nueve secciones y se queda con
 * las primeras gasta nueve; quien repite la misma sección cuatro veces hasta
 * que le gusta, gasta cuatro. Es lo único que tiene costo variable para
 * nosotros, así que es lo único que se mide.
 *
 * CUÁNTO NOS CUESTA (tarifas de septiembre de 2026, por generación):
 *
 *   Prompt con Claude Opus 5     ≈ US$0,021   2.000 tokens de entrada a $5/M
 *                                             + 450 de salida a $25/M
 *   Imagen con Gemini Flash Image ≈ US$0,039   («nano banana»)
 *   ───────────────────────────────────────
 *   Total                        ≈ US$0,06
 *
 * Es el pipeline que se va a desplegar: Opus redacta el prompt —es el que
 * planea y mira el encargo desde todos los ángulos— y el modelo de imagen lo
 * renderiza. Con Nano Banana Pro en vez de Flash la imagen sube a ~US$0,13 y
 * la generación a ~US$0,15: por eso la calidad alta es una decisión de
 * producto, no un ajuste que el usuario pueda encender sin que se note en el
 * margen.
 *
 * DÓNDE ESTÁ EL MERCADO (mismas fechas):
 *
 *   Pebblely      US$19 / 200 imágenes   → US$0,095 por imagen
 *   Flair         US$49 / 500 imágenes   → US$0,098
 *   AdCreative    desde US$39 con 10 descargas
 *
 * Ellos venden una imagen; aquí se vende la imagen MÁS el prompt construido
 * con la metodología, validado y editable, y la campaña completa de nueve
 * secciones adaptada al país. Por eso el precio por generación queda por
 * encima de Pebblely y Flair, y el del plan por debajo de AdCreative.
 *
 * MARGEN QUE DEJAN ESTOS PRECIOS: 80 % en Semilla, 69 % en Estudio y 66 % en
 * Agencia, antes de pasarela e impuestos. Si la tarifa de la API cambia, lo
 * que se mueve es el número de generaciones incluidas, no el precio.
 */

export interface DefinicionPlan {
  id: Plan;
  nombre: string;
  /** En centavos de dólar, para no arrastrar decimales flotantes. */
  precioMensualUSD: number;
  /** Generaciones incluidas al mes. Un crédito = una generación. */
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
    precioMensualUSD: 1200,
    creditosMes: 40,
    campanasGuardadas: 5,
    paletasAlternativas: 1,
    marcas: 1,
    soporte: "Correo",
    destacado: false,
  },
  {
    id: "estudio",
    nombre: "Estudio",
    precioMensualUSD: 2900,
    creditosMes: 150,
    campanasGuardadas: "ilimitadas",
    paletasAlternativas: 3,
    marcas: 3,
    soporte: "Correo prioritario",
    destacado: true,
  },
  {
    id: "agencia",
    nombre: "Agencia",
    precioMensualUSD: 7900,
    creditosMes: 450,
    campanasGuardadas: "ilimitadas",
    paletasAlternativas: 3,
    marcas: "ilimitadas",
    soporte: "Canal directo",
    destacado: false,
  },
] as const;

/** Generaciones sueltas, para el mes que se queda corto. No caducan. */
export const PAQUETE_EXTRA = { creditos: 50, precioUSD: 1200 };

/**
 * Lo que gasta una campaña completa, para traducir generaciones a trabajo:
 * nueve secciones y unas cuatro repeticiones de las que no quedan a gusto a
 * la primera.
 */
export const GENERACIONES_POR_CAMPANA = 13;

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

/** Campañas completas que salen con las generaciones del plan. */
export function campanasPorMes(id: Plan): number {
  return Math.floor(plan(id).creditosMes / GENERACIONES_POR_CAMPANA);
}
