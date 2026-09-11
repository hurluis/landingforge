import type { IdMercado, Producto, TipoProducto } from "@/lib/datos/tipos";

/**
 * Los mercados — lo que cambia de un país a otro dentro de la misma landing.
 *
 * La metodología es la misma en todas partes: nueve tipologías, siete
 * componentes, la misma lista negra. Lo que no es igual es el comprador. En
 * Bogotá un precio se escribe $99.900 y en Ciudad de México $99,900; en
 * Medellín la venta se cierra con contraentrega y en Buenos Aires casi nadie
 * la ofrece; un suplemento en Colima enseña su registro COFEPRIS, no el
 * INVIMA. Este archivo es ese conocimiento, país por país, y es lo que el
 * motor inyecta en cada prompt sin que el usuario lo pida.
 *
 * Nació como `mercado-co.ts`, con Colombia como único mercado. Colombia sigue
 * aquí, con el mismo detalle; ahora es uno más.
 */

export interface Mercado {
  id: IdMercado;
  nombre: string;
  /** Para concordar con el género: «mujeres colombianas», «hombres colombianos». */
  gentilicio: { f: string; m: string };
  /** ISO 4217 y la localización que decide separadores y símbolo. */
  moneda: string;
  locale: string;
  /** Céntimos: 2 donde los precios los llevan ($39,99), 0 donde no ($99.900). */
  decimales: 0 | 2;
  /** Un precio típico de la región, para los ejemplos del formulario. En unidades mínimas. */
  ejemplo: number;
  /** El registro sanitario tal como se nombra allí, con su artículo. */
  registro: string;
  /** Cómo se llama el pago al recibir, o `null` donde no es costumbre. */
  contraentrega: string | null;
  /** Orígenes que el prompt reparte entre las personas de una pieza. */
  origenes: readonly string[];
  /** Ciudades reales para atribuir testimonios. Nada de «Ciudad, País». */
  ciudades: readonly string[];
}

export const MERCADOS: Record<IdMercado, Mercado> = {
  CO: {
    id: "CO",
    nombre: "Colombia",
    gentilicio: { f: "colombianas", m: "colombianos" },
    moneda: "COP",
    locale: "es-CO",
    decimales: 0,
    ejemplo: 99900,
    registro: "el registro sanitario INVIMA",
    contraentrega: "pago contraentrega",
    origenes: [
      "paisa de Medellín, piel trigueña clara y cabello castaño",
      "costeña de Barranquilla, piel morena y cabello oscuro ondulado",
      "rola de Bogotá, piel clara y facciones alargadas",
      "afrodescendiente del Pacífico, piel oscura y cabello rizado natural",
      "de rasgos indígenas andinos, piel cobriza y cabello negro liso",
      "santandereana, piel trigueña y contextura fuerte",
    ],
    ciudades: ["Medellín", "Barranquilla", "Bogotá", "Cali", "Bucaramanga", "Pereira"],
  },
  MX: {
    id: "MX",
    nombre: "México",
    gentilicio: { f: "mexicanas", m: "mexicanos" },
    moneda: "MXN",
    locale: "es-MX",
    decimales: 0,
    ejemplo: 899,
    registro: "el registro sanitario COFEPRIS",
    contraentrega: "pago contra entrega",
    origenes: [
      "regiomontana, piel clara y cabello castaño",
      "tapatía de Guadalajara, piel morena clara y cabello oscuro",
      "de la Ciudad de México, piel morena y cabello negro lacio",
      "de rasgos indígenas de Oaxaca, piel cobriza y cabello negro",
      "jarocha de Veracruz, piel morena y cabello rizado",
      "yucateca de Mérida, piel morena y facciones mayas",
    ],
    ciudades: ["Ciudad de México", "Guadalajara", "Monterrey", "Puebla", "Mérida", "Querétaro"],
  },
  PE: {
    id: "PE",
    nombre: "Perú",
    gentilicio: { f: "peruanas", m: "peruanos" },
    moneda: "PEN",
    locale: "es-PE",
    decimales: 2,
    ejemplo: 8990,
    registro: "el registro sanitario DIGESA o DIGEMID",
    contraentrega: "pago contraentrega",
    origenes: [
      "limeña, piel trigueña y cabello oscuro",
      "de rasgos andinos de Cusco, piel cobriza y cabello negro liso",
      "arequipeña, piel clara y cabello castaño",
      "afroperuana de Chincha, piel oscura y cabello rizado",
      "norteña de Trujillo, piel morena y cabello ondulado",
      "amazónica de Iquitos, piel morena y facciones marcadas",
    ],
    ciudades: ["Lima", "Arequipa", "Trujillo", "Cusco", "Chiclayo", "Piura"],
  },
  CL: {
    id: "CL",
    nombre: "Chile",
    gentilicio: { f: "chilenas", m: "chilenos" },
    moneda: "CLP",
    locale: "es-CL",
    decimales: 0,
    ejemplo: 29990,
    registro: "el registro sanitario del ISP",
    contraentrega: null,
    origenes: [
      "santiaguina, piel clara y cabello castaño",
      "de rasgos mapuche, piel morena y cabello negro liso",
      "nortina de Antofagasta, piel morena clara",
      "del sur, de Valdivia, piel muy clara y pecas",
      "porteña de Valparaíso, piel trigueña y cabello ondulado",
      "de rasgos aymara, piel cobriza y cabello negro",
    ],
    ciudades: ["Santiago", "Valparaíso", "Concepción", "Antofagasta", "La Serena", "Temuco"],
  },
  AR: {
    id: "AR",
    nombre: "Argentina",
    gentilicio: { f: "argentinas", m: "argentinos" },
    moneda: "ARS",
    locale: "es-AR",
    decimales: 0,
    ejemplo: 49999,
    registro: "el registro de ANMAT",
    contraentrega: null,
    origenes: [
      "porteña, piel clara y cabello castaño",
      "salteña, piel morena y rasgos andinos",
      "cordobesa, piel trigueña y cabello oscuro",
      "rosarina, piel clara y cabello rubio oscuro",
      "de ascendencia italiana, piel clara y facciones marcadas",
      "correntina, piel morena y cabello negro",
    ],
    ciudades: ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "La Plata", "Salta"],
  },
  EC: {
    id: "EC",
    nombre: "Ecuador",
    gentilicio: { f: "ecuatorianas", m: "ecuatorianos" },
    moneda: "USD",
    /* Economía dolarizada: los precios se escriben como en Estados Unidos. */
    locale: "en-US",
    decimales: 2,
    ejemplo: 2999,
    registro: "la notificación sanitaria ARCSA",
    contraentrega: "pago contra entrega",
    origenes: [
      "quiteña, piel trigueña y cabello oscuro",
      "guayaquileña, piel morena y cabello ondulado",
      "de rasgos indígenas de Otavalo, piel cobriza y cabello negro largo",
      "afroecuatoriana de Esmeraldas, piel oscura y cabello rizado",
      "cuencana, piel clara y cabello castaño",
      "montubia de Manabí, piel morena y facciones marcadas",
    ],
    ciudades: ["Quito", "Guayaquil", "Cuenca", "Ambato", "Manta", "Loja"],
  },
  GT: {
    id: "GT",
    nombre: "Guatemala",
    gentilicio: { f: "guatemaltecas", m: "guatemaltecos" },
    moneda: "GTQ",
    locale: "es-GT",
    decimales: 0,
    ejemplo: 299,
    registro: "el registro sanitario del MSPAS",
    contraentrega: "pago contra entrega",
    origenes: [
      "capitalina, piel morena clara y cabello oscuro",
      "de rasgos mayas k'iche', piel cobriza y cabello negro",
      "de Quetzaltenango, piel trigueña",
      "garífuna de Livingston, piel oscura y cabello rizado",
      "petenera, piel morena y cabello ondulado",
      "de Antigua, piel clara y cabello castaño",
    ],
    ciudades: ["Ciudad de Guatemala", "Quetzaltenango", "Antigua Guatemala", "Cobán", "Escuintla", "Mixco"],
  },
  ES: {
    id: "ES",
    nombre: "España",
    gentilicio: { f: "españolas", m: "españoles" },
    moneda: "EUR",
    locale: "es-ES",
    decimales: 2,
    ejemplo: 3990,
    registro: "la notificación sanitaria ante la AESAN o el CPNP",
    contraentrega: "pago contra reembolso",
    origenes: [
      "madrileña, piel clara y cabello castaño",
      "sevillana, piel morena clara y cabello oscuro",
      "barcelonesa, piel clara y cabello castaño claro",
      "gallega, piel muy clara y pecas",
      "canaria, piel morena y cabello rizado",
      "de origen latinoamericano que vive en Valencia, piel trigueña",
    ],
    ciudades: ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao", "Málaga"],
  },
  US: {
    id: "US",
    nombre: "Estados Unidos",
    gentilicio: { f: "latinas que viven en Estados Unidos", m: "latinos que viven en Estados Unidos" },
    moneda: "USD",
    locale: "en-US",
    decimales: 2,
    ejemplo: 3999,
    registro: "el sello de fabricación en instalaciones registradas ante la FDA",
    contraentrega: null,
    origenes: [
      "mexicoamericana de Los Ángeles, piel morena y cabello oscuro",
      "puertorriqueña de Nueva York, piel trigueña y cabello rizado",
      "cubanoamericana de Miami, piel clara y cabello castaño",
      "dominicana de Nueva Jersey, piel morena oscura y cabello rizado",
      "salvadoreña de Houston, piel morena y cabello negro lacio",
      "colombiana de Orlando, piel trigueña clara",
    ],
    ciudades: ["Miami", "Los Ángeles", "Houston", "Nueva York", "Chicago", "Orlando"],
  },
  INT: {
    id: "INT",
    nombre: "otro país",
    gentilicio: { f: "de distintos orígenes", m: "de distintos orígenes" },
    moneda: "USD",
    locale: "en-US",
    decimales: 2,
    ejemplo: 3999,
    registro: "el registro sanitario vigente en el país de venta",
    contraentrega: null,
    origenes: [
      "de piel clara y cabello castaño",
      "de piel morena y cabello negro lacio",
      "de piel oscura y cabello rizado natural",
      "de rasgos asiáticos y cabello negro liso",
      "de piel trigueña y cabello ondulado",
      "de rasgos indígenas y piel cobriza",
    ],
    ciudades: [],
  },
};

/** En el orden en que se ofrecen en el formulario. */
export const LISTA_MERCADOS: readonly Mercado[] = Object.values(MERCADOS);

/** El mercado de un producto. Las campañas anteriores a los mercados eran de Colombia. */
export function mercadoDe(p: Pick<Producto, "mercado">): Mercado {
  return MERCADOS[p.mercado ?? "CO"] ?? MERCADOS.CO;
}

/** Categorías donde el registro sanitario es señal de confianza obligatoria. */
const REQUIEREN_REGISTRO: readonly TipoProducto[] = [
  "suplemento-deportivo",
  "suplemento-rendimiento",
  "suplemento-natural",
  "cosmetica",
  "skincare-lujo",
  "control-peso",
  "capilar",
  "clinico",
];

export function requiereRegistro(tipo: TipoProducto): boolean {
  return REQUIEREN_REGISTRO.includes(tipo);
}

/**
 * Señales de confianza que el prompt debe incluir para este producto y este
 * mercado. Donde se paga al recibir, la contraentrega va siempre: es la
 * objeción que más ventas cuesta.
 */
export function senalesDeConfianza(tipo: TipoProducto, m: Mercado): string[] {
  const senales: string[] = [];
  if (m.contraentrega) senales.push(`${m.contraentrega} en todo el país`);
  if (requiereRegistro(tipo)) senales.push(`${m.registro}, visible`);
  senales.push("garantía de devolución con plazo en días");
  if (tipo === "electronica") senales.push("garantía del fabricante por meses");
  return senales;
}

/**
 * Las cuatro señales que se inyectan solas, contadas para quien vende. Las
 * lee la página de metodología.
 */
export const BLOQUES_MERCADO = [
  {
    id: "contraentrega",
    titulo: "Contraentrega",
    texto:
      "Donde se paga al recibir, es la señal de confianza que más pesa. Si tu mercado la usa, tu landing la dice sin que la pidas; si no la usa, no la finge.",
  },
  {
    id: "registro",
    titulo: "Registro sanitario",
    texto:
      "INVIMA, COFEPRIS, DIGESA, ANMAT, FDA. En suplementos y cosméticos, el registro no es un trámite: es la diferencia entre parecer un negocio y parecer un riesgo. Cada campaña enseña el de su país.",
  },
  {
    id: "caras",
    titulo: "Caras de tu mercado",
    texto:
      "Cada prompt especifica el origen de las personas según el país que eliges, porque un modelo dejado a su suerte devuelve un latino genérico que ningún comprador reconoce como suyo.",
  },
  {
    id: "formato",
    titulo: "Formato y lenguaje",
    texto:
      "El precio con la moneda y el separador de tu país: $99.900 en Bogotá, $99,900 en Ciudad de México, 39,90 € en Madrid. 3.412 clientes, no +3.000. Reseñas que suenan a alguien real.",
  },
] as const;
