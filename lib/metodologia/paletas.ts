import type { Audiencia, Paleta, TipoProducto } from "@/lib/datos/tipos";

/**
 * Matriz de selección de paleta — §2.4 punto 4 del brief.
 *
 * La paleta no se elige al azar ni la propone el modelo: sale de cruzar
 * tipo de producto × audiencia × registro emocional. Eso es lo que garantiza
 * que dos clientes distintos nunca reciban la misma identidad, y es lo que
 * se le muestra al usuario como razón escrita en el paso 3 del wizard.
 *
 * Estas son las paletas DEL CLIENTE: se muestran a plena saturación, y son
 * las únicas manchas de color libre dentro de la interfaz (§4.2).
 */

export type RegistroEmocional =
  | "clinico"
  | "energetico"
  | "premium"
  | "natural"
  | "tecnico"
  | "calido";

interface DefinicionPaleta extends Omit<Paleta, "razon"> {
  registro: RegistroEmocional;
  /** Cómo se justifica esta paleta cuando la matriz la elige. */
  argumento: string;
}

export const PALETAS: readonly DefinicionPaleta[] = [
  {
    id: "hierro-nocturno",
    nombre: "Hierro nocturno",
    registro: "energetico",
    fondo: "#0E1116",
    acento: "#FF5A1F",
    texto: "#F5F7FA",
    secundario: "#1D2531",
    energia: "#FFD166",
    argumento:
      "Naranja de esfuerzo sobre gris hierro: lee como gimnasio a las cinco de la mañana, no como tienda de vitaminas",
  },
  {
    id: "cal-y-cobre",
    nombre: "Cal y cobre",
    registro: "premium",
    fondo: "#1A1512",
    acento: "#C87941",
    texto: "#F6EFE7",
    secundario: "#2A2119",
    energia: "#E8C39E",
    argumento:
      "Cobre sobre marrón profundo: material caro sin caer en el dorado de joyería",
  },
  {
    id: "quirofano",
    nombre: "Quirófano",
    registro: "clinico",
    fondo: "#F7FAFC",
    acento: "#0F6FC5",
    texto: "#0C1620",
    secundario: "#E1EAF2",
    energia: "#22B8A6",
    argumento:
      "Azul institucional sobre blanco frío: la señal visual que el comprador asocia con criterio médico",
  },
  {
    id: "seda-nocturna",
    nombre: "Seda nocturna",
    registro: "premium",
    fondo: "#120F17",
    acento: "#C9A7E8",
    texto: "#F4F0F7",
    secundario: "#1E1926",
    energia: "#EFD9A0",
    argumento:
      "Lila desaturado sobre violeta casi negro: cosmética de gama alta sin recurrir al rosa de catálogo",
  },
  {
    id: "monte-humedo",
    nombre: "Monte húmedo",
    registro: "natural",
    fondo: "#0F1611",
    acento: "#4E9F5C",
    texto: "#EDF3EC",
    secundario: "#1B2A1D",
    energia: "#D3E05A",
    argumento:
      "Verde de hoja sobre fondo de sotobosque: producto natural que no se ve de herbolario genérico",
  },
  {
    id: "arena-costeña",
    nombre: "Arena costeña",
    registro: "calido",
    fondo: "#FBF6EF",
    acento: "#E0662B",
    texto: "#231A12",
    secundario: "#F0E3D2",
    energia: "#2FA6A0",
    argumento:
      "Arena y naranja de sol de mediodía con turquesa de contraste: el mundo cromático del Caribe colombiano",
  },
  {
    id: "grafito-electrico",
    nombre: "Grafito eléctrico",
    registro: "tecnico",
    fondo: "#0B0D10",
    acento: "#3DDC97",
    texto: "#EDF1F5",
    secundario: "#161A20",
    energia: "#7AA2FF",
    argumento:
      "Verde de señal sobre grafito: la paleta de un instrumento, apropiada cuando el producto es un aparato",
  },
  {
    id: "porcelana-rosa",
    nombre: "Porcelana rosa",
    registro: "premium",
    fondo: "#FDF7F5",
    acento: "#B4566B",
    texto: "#2A1A1D",
    secundario: "#F3E4E1",
    energia: "#C9A227",
    argumento:
      "Rosa terroso sobre porcelana: skincare femenino adulto, lejos del rosa chicle de producto adolescente",
  },
  {
    id: "acero-limpio",
    nombre: "Acero limpio",
    registro: "clinico",
    fondo: "#F2F5F7",
    acento: "#1E4E79",
    texto: "#101820",
    secundario: "#DCE4EA",
    energia: "#E07A3F",
    argumento:
      "Azul marino sobre gris claro con un naranja de acción: seriedad clínica que aún permite un botón que se ve",
  },
  {
    id: "brasa",
    nombre: "Brasa",
    registro: "energetico",
    fondo: "#150B0B",
    acento: "#E63946",
    texto: "#F7EDEA",
    secundario: "#25100F",
    energia: "#F4A259",
    argumento:
      "Rojo de brasa sobre negro cálido: urgencia y calor, para categorías donde la decisión es impulsiva",
  },
  {
    id: "sal-de-mar",
    nombre: "Sal de mar",
    registro: "natural",
    fondo: "#F4F8F8",
    acento: "#2C7A7B",
    texto: "#122020",
    secundario: "#DDEAEA",
    energia: "#E9B44C",
    argumento:
      "Verde azulado sobre blanco salino: frescura de producto de cuidado sin recurrir al azul de detergente",
  },
  {
    id: "tabaco",
    nombre: "Tabaco",
    registro: "calido",
    fondo: "#171310",
    acento: "#B07D4F",
    texto: "#F2EAE0",
    secundario: "#241C16",
    energia: "#8FA37E",
    argumento:
      "Marrón tabaco con un verde apagado: registro masculino adulto que no cae en el negro y azul de siempre",
  },
] as const;

/** Registro emocional que la matriz asigna a cada tipo de producto. */
const REGISTRO_POR_TIPO: Record<TipoProducto, RegistroEmocional[]> = {
  "suplemento-deportivo": ["energetico", "tecnico"],
  "suplemento-rendimiento": ["energetico", "clinico"],
  "dispositivo-belleza": ["premium", "tecnico"],
  cosmetica: ["premium", "calido"],
  "suplemento-natural": ["natural", "calido"],
  electronica: ["tecnico", "premium"],
  clinico: ["clinico", "tecnico"],
  "skincare-lujo": ["premium", "natural"],
  "control-peso": ["clinico", "energetico"],
  capilar: ["natural", "premium"],
  otro: ["calido", "tecnico"],
};

/** Etiqueta legible del registro, para la línea de razón. */
const NOMBRE_REGISTRO: Record<RegistroEmocional, string> = {
  clinico: "clínico y sobrio",
  energetico: "enérgico y directo",
  premium: "elegante y premium",
  natural: "natural y sereno",
  tecnico: "técnico y preciso",
  calido: "cálido y cercano",
};

const NOMBRE_TIPO: Record<TipoProducto, string> = {
  "suplemento-deportivo": "Suplemento deportivo",
  "suplemento-rendimiento": "Suplemento de rendimiento",
  "dispositivo-belleza": "Dispositivo de belleza",
  cosmetica: "Cosmética",
  "suplemento-natural": "Suplemento natural",
  electronica: "Electrónica",
  clinico: "Producto clínico",
  "skincare-lujo": "Skincare de lujo",
  "control-peso": "Control de peso",
  capilar: "Cuidado capilar",
  otro: "Producto",
};

export function nombreTipoProducto(tipo: TipoProducto): string {
  return NOMBRE_TIPO[tipo];
}

function describirAudiencia(a: Audiencia): string {
  const genero =
    a.genero === "f" ? "mujeres" : a.genero === "m" ? "hombres" : "público mixto";
  return `${genero} ${a.edadMin}–${a.edadMax}`;
}

/**
 * Aplica la matriz. `alternativa` desplaza la selección dentro del mismo
 * registro: 0 es la propuesta principal, 1 y 2 son las dos alternativas que
 * el brief permite (§7.1, paso 3). No es un selector infinito de color.
 */
export function asignarPaleta(
  tipo: TipoProducto,
  audiencia: Audiencia,
  alternativa = 0,
): Paleta {
  const registros = REGISTRO_POR_TIPO[tipo];

  /* Audiencia joven empuja al registro más enérgico del par; audiencia
     madura, al más sobrio. Es la segunda dimensión real de la matriz. */
  const edadMedia = (audiencia.edadMin + audiencia.edadMax) / 2;
  const registroPrincipal = edadMedia <= 34 ? registros[0] : (registros[1] ?? registros[0]);

  const candidatas = PALETAS.filter((p) => p.registro === registroPrincipal);
  const pool = candidatas.length > 0 ? candidatas : PALETAS;

  /* La tercera dimensión: el género desplaza dentro del pool, para que dos
     productos del mismo tipo y edad pero distinta audiencia no coincidan. */
  const desplazamiento = audiencia.genero === "f" ? 0 : audiencia.genero === "m" ? 1 : 2;
  const elegida = pool[(desplazamiento + alternativa) % pool.length];

  return {
    id: elegida.id,
    nombre: elegida.nombre,
    razon: `${NOMBRE_TIPO[tipo]}, ${describirAudiencia(audiencia)}, registro ${NOMBRE_REGISTRO[registroPrincipal]}. ${elegida.argumento}.`,
    fondo: elegida.fondo,
    acento: elegida.acento,
    texto: elegida.texto,
    secundario: elegida.secundario,
    energia: elegida.energia,
  };
}

/** Los cinco hex de una paleta, en el orden en que se muestran los swatches. */
export function swatches(p: Paleta): { hex: string; rol: string }[] {
  return [
    { hex: p.fondo, rol: "fondo" },
    { hex: p.acento, rol: "acento" },
    { hex: p.texto, rol: "texto" },
    { hex: p.secundario, rol: "secundario" },
    { hex: p.energia, rol: "energía" },
  ];
}
