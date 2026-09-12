import type { Plan } from "@/lib/datos/tipos";

/**
 * Planes — §8.2 del brief.
 *
 * ⚠️ LOS NÚMEROS DE COSTO DE ESTE ARCHIVO SON INTERNOS. No se publican en
 * ninguna pantalla: al comprador no le interesa lo que nos cuesta un token, y
 * contarle que una sección puede necesitar varios intentos es regalarle una
 * objeción antes de que la tenga.
 *
 * QUÉ SE COBRA. Secciones. Cada sección que la plataforma produce consume un
 * crédito.
 *
 * ── EL COSTO, EN EL PEOR CASO ──────────────────────────────────────────
 *
 * El precio no se calcula sobre lo que cuesta un día bueno, sino sobre el
 * techo: si el mes malo también deja margen, el bueno no da sustos.
 *
 *                                   esperado     peor caso
 *   Prompt con Claude Opus 5        US$0,021     US$0,055
 *     (2.000 entrada + 450 salida)  $5 / $25 M   modo rápido, $10 / $50 M
 *   Imagen 9:16                     US$0,039     US$0,039
 *     (Gemini Flash Image)
 *   Reintentos internos             —            +15 %
 *   ──────────────────────────────────────────────────────
 *   Coste por sección               US$0,06      US$0,11
 *
 * Y un tercer escenario que conviene tener a mano: si se enruta la imagen al
 * modelo premium —Nano Banana Pro, ~US$0,13— la sección sube a ~US$0,21. Los
 * planes de abajo NO lo asumen: la calidad alta es una decisión de producto
 * que hay que volver a costear antes de encenderla.
 *
 * ── MARGEN BRUTO QUE DEJAN ESTOS PRECIOS ───────────────────────────────
 *
 *                 por sección   peor caso   esperado
 *   Semilla        US$0,400        72 %       85 %
 *   Estudio        US$0,292        62 %       79 %
 *   Agencia        US$0,248        56 %       76 %
 *   Fundición      US$0,222        50 %       73 %   (en su volumen incluido)
 *     excedente    US$0,180        39 %       67 %
 *
 * Todo antes de pasarela, impuestos e infraestructura. Incluso en el peor
 * caso ningún plan baja del 39 %, que es la holgura que se buscaba.
 *
 * ── POR QUÉ ESTA ESCALERA ──────────────────────────────────────────────
 *
 * La puerta de entrada es barata a propósito: US$12 está por debajo de
 * cualquier suscripción corriente de IA, y quien solo quiere probar el
 * producto entra sin pensarlo aunque se lleve pocas secciones. De ahí para
 * arriba, cada plan baja el precio por sección, que es lo que premia quedarse.
 *
 * FUNDICIÓN lleva cuota base a propósito. Sin ella, un plan «paga lo que
 * uses» se come a los otros tres: cualquiera que consuma poco se pasaría a
 * él. Con US$200 de base solo compensa por encima de unas 800 secciones al
 * mes, que es justo el cliente para el que está pensado —agencias con picos—,
 * y a partir de ahí no tiene techo: la factura puede irse a miles y el
 * excedente sigue siendo el precio por sección más bajo del catálogo.
 */

export interface DefinicionPlan {
  id: Plan;
  nombre: string;
  /** En centavos de dólar, para no arrastrar decimales flotantes. */
  precioMensualUSD: number;
  /** Secciones incluidas al mes. */
  creditosMes: number;
  /** `incluidas`: al agotarlas se para. `por-uso`: se siguen facturando. */
  medida: "incluidas" | "por-uso";
  /** Solo en el plan por uso: centavos por sección pasada la cuota. */
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
    precioMensualUSD: 1200,
    creditosMes: 30,
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
    precioMensualUSD: 3500,
    creditosMes: 120,
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
    precioMensualUSD: 9900,
    creditosMes: 400,
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
    precioMensualUSD: 20000,
    creditosMes: 900,
    medida: "por-uso",
    precioSeccionUSD: 18,
    campanasGuardadas: "ilimitadas",
    paletasAlternativas: 3,
    marcas: "ilimitadas",
    soporte: "Canal directo",
    destacado: false,
  },
] as const;

/** Secciones sueltas, para el mes que se queda corto. No caducan. */
export const PAQUETE_EXTRA = { creditos: 50, precioUSD: 1700 };

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

/**
 * Secciones consumidas en el ciclo. El saldo arranca en las incluidas del
 * plan y baja; en el plan por uso puede pasar de cero, y ahí el negativo es
 * el excedente.
 */
export function consumoPorUso(id: Plan, creditosDisponibles: number): number {
  return Math.max(0, plan(id).creditosMes - creditosDisponibles);
}

/** Secciones por encima de las incluidas: lo que se factura aparte. */
export function excedentePorUso(creditosDisponibles: number): number {
  return Math.max(0, -creditosDisponibles);
}

/** Lo que lleva facturado el ciclo: la cuota base más el excedente, en centavos. */
export function facturadoPorUso(id: Plan, creditosDisponibles: number): number {
  const p = plan(id);
  return p.precioMensualUSD + excedentePorUso(creditosDisponibles) * (p.precioSeccionUSD ?? 0);
}
