import type { Plan } from "@/lib/datos/tipos";

/**
 * Planes — §8.2 del brief.
 *
 * ⚠️ LO QUE SIGUE ES INTERNO. Los números de costo de este archivo no se
 * publican en ninguna pantalla: al comprador no le interesa lo que nos cuesta
 * un token, y contarle que cobramos por sección «porque a veces hay que
 * repetirla» es regalarle una objeción antes de que la tenga. En la página se
 * habla de lo que recibe —secciones listas para publicar— y el detalle exacto
 * del consumo vive donde tiene que vivir: en la política de créditos.
 *
 * QUÉ SE COBRA. Secciones. Cada sección que la plataforma produce consume un
 * crédito, la pidas dentro de una campaña de nueve o suelta.
 *
 * CUÁNTO NOS CUESTA (tarifas de septiembre de 2026, por sección):
 *
 *   Prompt con Claude Opus 5      ≈ US$0,021   2.000 tokens de entrada a $5/M
 *                                              + 450 de salida a $25/M
 *   Imagen con Gemini Flash Image ≈ US$0,039
 *   ────────────────────────────────────────
 *   Total                         ≈ US$0,06
 *
 * Es el pipeline que se va a desplegar: Opus redacta el prompt —es el que
 * planea y mira el encargo desde todos los ángulos— y el modelo de imagen lo
 * renderiza. Con Nano Banana Pro la imagen sube a ~US$0,13 y la sección a
 * ~US$0,15, así que la calidad alta es una decisión de producto, no un
 * interruptor que el usuario encienda sin que se note en el margen.
 *
 * DÓNDE ESTÁ EL MERCADO: Pebblely US$19/200 imágenes, Flair US$49/500,
 * AdCreative desde US$39. Ellos venden la imagen; aquí va además el prompt
 * construido con la metodología y la campaña entera adaptada al país. El
 * plan de entrada se queda deliberadamente por debajo de lo que cuesta una
 * suscripción corriente de IA: US$17 es una decisión de posicionamiento.
 *
 * MARGEN BRUTO que dejan estos precios, antes de pasarela e impuestos:
 * 86 % en Semilla, 77 % en Estudio, 75 % en Agencia y 88 % en Fundición. La
 * suscripción no vive de cubrir el costo: vive de esa diferencia.
 *
 * FUNDICIÓN, el de pago por uso. Sin cuota y sin cupo: se factura cada
 * sección a US$0,49. Por debajo de unas 35 secciones al mes sale más barato
 * que Semilla y por encima de unas 80 sale más caro que Estudio, que es
 * exactamente lo que promete: pagas lo que usas, para bien y para mal.
 */

export interface DefinicionPlan {
  id: Plan;
  nombre: string;
  /** En centavos de dólar, para no arrastrar decimales flotantes. */
  precioMensualUSD: number;
  /** Secciones incluidas al mes. Cero en el plan por uso. */
  creditosMes: number;
  /** `incluidas`: cupo mensual. `por-uso`: sin cupo, se factura lo consumido. */
  medida: "incluidas" | "por-uso";
  /** Solo en el plan por uso: centavos por sección. */
  precioSeccionUSD?: number;
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
    precioMensualUSD: 1700,
    creditosMes: 40,
    medida: "incluidas",
    campanasGuardadas: 5,
    paletasAlternativas: 1,
    marcas: 1,
    soporte: "Correo",
    destacado: false,
  },
  {
    id: "estudio",
    nombre: "Estudio",
    precioMensualUSD: 3900,
    creditosMes: 150,
    medida: "incluidas",
    campanasGuardadas: "ilimitadas",
    paletasAlternativas: 3,
    marcas: 3,
    soporte: "Correo prioritario",
    destacado: true,
  },
  {
    id: "agencia",
    nombre: "Agencia",
    precioMensualUSD: 10900,
    creditosMes: 450,
    medida: "incluidas",
    campanasGuardadas: "ilimitadas",
    paletasAlternativas: 3,
    marcas: "ilimitadas",
    soporte: "Canal directo",
    destacado: false,
  },
  {
    id: "fundicion",
    nombre: "Fundición",
    precioMensualUSD: 0,
    creditosMes: 0,
    medida: "por-uso",
    precioSeccionUSD: 49,
    campanasGuardadas: "ilimitadas",
    paletasAlternativas: 3,
    marcas: "ilimitadas",
    soporte: "Canal directo",
    destacado: false,
  },
] as const;

/** Secciones sueltas, para el mes que se queda corto. No caducan. */
export const PAQUETE_EXTRA = { creditos: 50, precioUSD: 1700 };

/** Las secciones de una campaña completa. */
export const SECCIONES_POR_CAMPANA = 9;

/** Créditos de prueba al registrarse, sin tarjeta. */
export const CREDITOS_BIENVENIDA = 5;

export function plan(id: Plan): DefinicionPlan {
  const p = PLANES.find((x) => x.id === id);
  if (!p) throw new Error(`Plan desconocido: ${id}`);
  return p;
}

export function esPorUso(id: Plan): boolean {
  return plan(id).medida === "por-uso";
}

export function limiteCampanas(id: Plan): number {
  const c = plan(id).campanasGuardadas;
  return c === "ilimitadas" ? Number.POSITIVE_INFINITY : c;
}

/** Campañas completas que salen con las secciones del plan. */
export function campanasPorMes(id: Plan): number {
  return Math.floor(plan(id).creditosMes / SECCIONES_POR_CAMPANA);
}

/**
 * Lo consumido en el ciclo por una cuenta de pago por uso. Su saldo no es un
 * cupo: arranca en cero y baja, así que el negativo ES el consumo.
 */
export function consumoPorUso(creditosDisponibles: number): number {
  return Math.max(0, -creditosDisponibles);
}

/** Lo que lleva facturado este ciclo una cuenta de pago por uso, en centavos. */
export function facturadoPorUso(id: Plan, creditosDisponibles: number): number {
  const p = plan(id);
  return consumoPorUso(creditosDisponibles) * (p.precioSeccionUSD ?? 0);
}
