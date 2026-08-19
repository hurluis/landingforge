import type { TipoProducto } from "@/lib/datos/tipos";

/**
 * Conocimiento del mercado colombiano codificado — §2.4 punto 2 y §6.2.5.
 * Esto es lo que ninguna plataforma internacional trae de fábrica, y es lo
 * que el motor de prompts inyecta en cada pieza sin que el usuario lo pida.
 */

export interface BloqueMercado {
  id: "contraentrega" | "invima" | "caras" | "formato";
  titulo: string;
  texto: string;
}

export const BLOQUES_MERCADO: readonly BloqueMercado[] = [
  {
    id: "contraentrega",
    titulo: "Contraentrega",
    texto:
      "La señal de confianza número uno del país. Tu comprador paga cuando el producto está en su mano. Si tu landing no lo dice, estás dejando ventas sobre la mesa.",
  },
  {
    id: "invima",
    titulo: "INVIMA",
    texto:
      "Para suplementos y cosméticos, el registro sanitario no es un trámite: es la diferencia entre parecer un negocio y parecer un riesgo.",
  },
  {
    id: "caras",
    titulo: "Caras de aquí",
    texto:
      "Paisa, costeña, rola, afrodescendiente, rasgos indígenas. LandingForge especifica el origen regional en cada prompt, porque un modelo dejado a su suerte devuelve un latino genérico que ningún colombiano reconoce.",
  },
  {
    id: "formato",
    titulo: "Formato y lenguaje",
    texto:
      "$99.900 con punto de miles. 3.412 clientes, no +3.000. Reseñas que suenan a alguien real: «a mis 42 años», «vale cada peso».",
  },
] as const;

/** Orígenes regionales que el prompt reparte entre las personas de una pieza. */
export const ORIGENES_REGIONALES = [
  "paisa de Medellín, piel trigueña clara y cabello castaño",
  "costeña de Barranquilla, piel morena y cabello oscuro ondulado",
  "rola de Bogotá, piel clara y facciones alargadas",
  "afrodescendiente del Pacífico, piel oscura y cabello rizado natural",
  "de rasgos indígenas andinos, piel cobriza y cabello negro liso",
  "santandereana, piel trigueña y contextura fuerte",
] as const;

/** Ciudades reales para atribuir testimonios. Nada de «Ciudad, Colombia». */
export const CIUDADES = [
  "Medellín",
  "Barranquilla",
  "Bogotá",
  "Cali",
  "Bucaramanga",
  "Pereira",
  "Cartagena",
  "Villavicencio",
] as const;

/** Categorías donde el registro sanitario INVIMA es señal de confianza obligatoria. */
const REQUIEREN_INVIMA: readonly TipoProducto[] = [
  "suplemento-deportivo",
  "suplemento-rendimiento",
  "suplemento-natural",
  "cosmetica",
  "skincare-lujo",
  "control-peso",
  "capilar",
  "clinico",
];

export function requiereInvima(tipo: TipoProducto): boolean {
  return REQUIEREN_INVIMA.includes(tipo);
}

/**
 * Señales de confianza que el prompt debe incluir para este tipo de producto.
 * Contraentrega va siempre: no es opcional en Colombia.
 */
export function senalesDeConfianza(tipo: TipoProducto): string[] {
  const senales = ["pago contraentrega en todo el país"];
  if (requiereInvima(tipo)) senales.push("registro sanitario INVIMA visible");
  senales.push("garantía de devolución con plazo en días");
  if (tipo === "electronica") senales.push("garantía del fabricante por meses");
  return senales;
}
