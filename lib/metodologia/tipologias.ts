import type { TipologiaSeccion } from "@/lib/datos/tipos";

/**
 * Las nueve tipologías de sección — §6.2.4 del brief.
 * Este archivo es el activo del producto: no es contenido de marketing, es la
 * metodología que el motor de prompts ejecuta. El texto de `proposito` y
 * `reglaCritica` es definitivo y se muestra tal cual en la tira de contactos.
 */

export interface Tipologia {
  id: TipologiaSeccion;
  numero: number;
  nombre: string;
  /** Su trabajo, en una línea. */
  proposito: string;
  /** La regla que la mayoría se salta. */
  reglaCritica: string;
  /** Estructura que el prompt debe describir, en orden de lectura. */
  estructura: string[];
  /** Errores conocidos que el prompt debe evitar explícitamente. */
  erroresConocidos: string[];
  /** Si la sección necesita que el usuario adjunte la foto del producto. */
  requiereImagenReferencia: boolean;
  /** Peso del bloque de iluminación en la fórmula de siete componentes. */
  pesoIluminacion: "alto" | "medio" | "bajo";
}

export const TIPOLOGIAS: readonly Tipologia[] = [
  {
    id: "hero",
    numero: 1,
    nombre: "Hero",
    proposito: "Detener el scroll y prometer en menos de tres segundos",
    reglaCritica:
      "El titular tiene que ser el elemento de texto más grande. Sin excepción",
    estructura: [
      "Titular de promesa, máximo 25 caracteres",
      "Producto como sujeto físico dominante, tres cuartos de la altura",
      "Badge de garantía o contraentrega en la esquina inferior",
      "Precio con la moneda y el separador de miles del país",
    ],
    erroresConocidos: [
      "Titular más pequeño que el nombre de la marca",
      "Producto flotando sin superficie de apoyo ni sombra de contacto",
      "Fondo tan cargado que compite con el envase",
    ],
    requiereImagenReferencia: true,
    pesoIluminacion: "alto",
  },
  {
    id: "beneficios",
    numero: 2,
    nombre: "Beneficios",
    proposito: "Convencer a quien ya está interesado pero no convencido",
    reglaCritica: "Menos de ocho palabras por beneficio, o el render se rompe",
    estructura: [
      "Tres o cuatro beneficios en columna o rejilla",
      "Un icono lineal por beneficio, mismo grosor de trazo",
      "Producto pequeño como ancla visual, no como protagonista",
    ],
    erroresConocidos: [
      "Beneficios escritos como características técnicas",
      "Iconos de estilos distintos mezclados en el mismo bloque",
      "Texto largo que el modelo deforma al renderizar",
    ],
    requiereImagenReferencia: false,
    pesoIluminacion: "medio",
  },
  {
    id: "antes-despues",
    numero: 3,
    nombre: "Antes / Después",
    proposito: "Probar el resultado. La herramienta de conversión más fuerte",
    reglaCritica:
      "Misma persona en las dos fotos: se bloquean forma de rostro, tono de piel, ojos, nariz y cabello",
    estructura: [
      "Partición vertical exacta al 50 %, sin marco decorativo",
      "Etiquetas ANTES y DESPUÉS en la misma posición de cada mitad",
      "Idéntica iluminación, distancia focal y encuadre en ambas mitades",
      "Bloqueo explícito de rasgos faciales antes de describir el cambio",
    ],
    erroresConocidos: [
      "Dos personas distintas: destruye la credibilidad de la pieza",
      "Iluminación más favorecedora en el después: se lee como truco",
      "Cambio exagerado que promete un resultado imposible",
    ],
    requiereImagenReferencia: true,
    pesoIluminacion: "alto",
  },
  {
    id: "paso-a-paso",
    numero: 4,
    nombre: "Paso a paso",
    proposito: "Quitar fricción y demostrar que es fácil de usar",
    reglaCritica: "Cada paso empieza con un verbo",
    estructura: [
      "Tres pasos en secuencia vertical numerada",
      "Las mismas manos y el mismo tono de piel en los tres",
      "Una acción visible por paso, sin texto explicativo largo",
    ],
    erroresConocidos: [
      "Manos distintas entre pasos: rompe la continuidad narrativa",
      "Pasos que describen resultados en vez de acciones",
      "Más de cuatro pasos: deja de leerse como fácil",
    ],
    requiereImagenReferencia: false,
    pesoIluminacion: "medio",
  },
  {
    id: "testimonios",
    numero: 5,
    nombre: "Testimonios",
    proposito: "Prueba social para el comprador escéptico",
    reglaCritica:
      "Seis personas físicamente distintas, con imperfecciones reales, no modelos",
    estructura: [
      "Rejilla de seis retratos con su reseña corta",
      "Origen especificado por persona, con la diversidad real del país donde se vende",
      "Nombre y ciudad reales del país bajo cada reseña",
      "Cinco estrellas dibujadas, no en emoji",
    ],
    erroresConocidos: [
      "Seis caras de la misma edad, mismo peinado y misma piel perfecta",
      "Reseñas que suenan a copy de marca en vez de a persona",
      "Ciudades genéricas o inventadas",
    ],
    requiereImagenReferencia: false,
    pesoIluminacion: "medio",
  },
  {
    id: "autoridad",
    numero: 6,
    nombre: "Autoridad",
    proposito: "Credibilidad clínica o profesional",
    reglaCritica: "El profesional se ve real: 45–55 años, no un modelo",
    estructura: [
      "Retrato de medio cuerpo en su entorno de trabajo real",
      "Una sola frase de respaldo, atribuida con nombre y especialidad",
      "Señal institucional visible: bata, consultorio, diploma fuera de foco",
    ],
    erroresConocidos: [
      "Un modelo de 30 años con bata impecable de estudio",
      "Frases que prometen resultados médicos",
      "Fondo de laboratorio de banco de imágenes",
    ],
    requiereImagenReferencia: false,
    pesoIluminacion: "alto",
  },
  {
    id: "confianza",
    numero: 7,
    nombre: "Confianza y garantía",
    proposito: "Última objeción antes del checkout",
    reglaCritica:
      "Donde se paga al recibir, la contraentrega va siempre. Es la señal de confianza que más pesa",
    estructura: [
      "Tres o cuatro sellos metálicos alineados",
      "Pago contraentrega como sello principal, en los mercados que lo usan",
      "Registro sanitario del país cuando el producto es suplemento o cosmético",
      "Garantía con plazo concreto en días",
    ],
    erroresConocidos: [
      "Sellos que parecen stickers planos en vez de medallas con relieve",
      "Omitir la contraentrega donde se usa: es la objeción que más ventas cuesta",
      "Garantías vagas sin plazo",
    ],
    requiereImagenReferencia: false,
    pesoIluminacion: "bajo",
  },
  {
    id: "precios",
    numero: 8,
    nombre: "Precios",
    proposito: "Cerrar la venta",
    reglaCritica: "La tarjeta del medio es el ancla visual. El precio, con el formato del país",
    estructura: [
      "Tres opciones de cantidad, la del medio destacada",
      "Precio tachado y precio final con la moneda y los separadores del país",
      "Ahorro expresado en dinero, no solo en porcentaje",
      "Botón de compra con verbo de acción",
    ],
    erroresConocidos: [
      "El separador equivocado —$99,900 en Bogotá, $99.900 en Ciudad de México—: delata que la pieza no es de allí",
      "Tres opciones sin jerarquía: el ojo no sabe cuál tomar",
      "Descuentos redondos poco creíbles",
    ],
    requiereImagenReferencia: true,
    pesoIluminacion: "bajo",
  },
  {
    id: "estilo-de-vida",
    numero: 9,
    nombre: "Estilo de vida",
    proposito: "Que el comprador se vea usándolo",
    reglaCritica: "Mismas manos y mismo tono de piel en todas las fotos del bloque",
    estructura: [
      "El producto dentro de una escena cotidiana que el comprador reconoce como de su país",
      "Persona del rango de edad objetivo, en actitud de uso, no posando",
      "Luz ambiente coherente con la hora del día declarada",
    ],
    erroresConocidos: [
      "Escenas de banco de imágenes que no ubican al comprador en su vida",
      "El producto tan pequeño que se pierde en la escena",
      "Persona mirando a cámara: rompe el efecto de escena real",
    ],
    requiereImagenReferencia: true,
    pesoIluminacion: "alto",
  },
] as const;

/** Las cuatro de mayor impacto — vienen marcadas por defecto en el paso 4. */
export const TIPOLOGIAS_POR_DEFECTO: readonly TipologiaSeccion[] = [
  "hero",
  "antes-despues",
  "testimonios",
  "confianza",
];

const PORID = new Map(TIPOLOGIAS.map((t) => [t.id, t]));

export function tipologia(id: TipologiaSeccion): Tipologia {
  const t = PORID.get(id);
  if (!t) throw new Error(`Tipología desconocida: ${id}`);
  return t;
}

export function nombreTipologia(id: TipologiaSeccion): string {
  return tipologia(id).nombre;
}
