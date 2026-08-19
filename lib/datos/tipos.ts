/**
 * Contratos de dominio — §9.4 del brief maestro.
 * Es el único lugar donde se define la forma de los datos. Tanto el mock como
 * el repositorio real cumplen estos tipos, así que cambiar de persistencia no
 * toca ningún componente.
 */

export type TipoProducto =
  | "suplemento-deportivo"
  | "suplemento-rendimiento"
  | "dispositivo-belleza"
  | "cosmetica"
  | "suplemento-natural"
  | "electronica"
  | "clinico"
  | "skincare-lujo"
  | "control-peso"
  | "capilar"
  | "otro";

export type TipologiaSeccion =
  | "hero"
  | "beneficios"
  | "antes-despues"
  | "paso-a-paso"
  | "testimonios"
  | "autoridad"
  | "confianza"
  | "precios"
  | "estilo-de-vida";

export type Plan = "semilla" | "estudio" | "agencia";

export interface Paleta {
  id: string;
  nombre: string;
  /** Por qué esta paleta para este producto. Se muestra al usuario. */
  razon: string;
  fondo: string;
  acento: string;
  texto: string;
  secundario: string;
  energia: string;
}

export interface Audiencia {
  genero: "f" | "m" | "mixto";
  edadMin: number;
  edadMax: number;
}

export interface Producto {
  nombre: string;
  descripcion: string;
  imagenUrl?: string;
  tipo: TipoProducto;
  audiencia: Audiencia;
  beneficioPrincipal: string;
  precioCOP: number;
  precioTachadoCOP?: number;
}

export type ReglaAdvertencia =
  | "limite-25-caracteres"
  | "palabra-prohibida"
  | "sin-bloque-paleta"
  | "sin-bloque-iluminacion"
  | "longitud"
  | "estilo-keywords";

export interface Advertencia {
  regla: ReglaAdvertencia;
  severidad: "aviso" | "bloqueo";
  detalle: string;
  fragmento?: string;
  sugerencia?: string;
}

export interface Prompt {
  id: string;
  tipologia: TipologiaSeccion;
  texto: string;
  palabras: number;
  advertencias: Advertencia[];
  requiereImagenReferencia: boolean;
  creadoEn: string;
}

export type EstadoCampana = "borrador" | "generando" | "lista" | "error";

export interface Campana {
  id: string;
  usuarioId: string;
  nombre: string;
  producto: Producto;
  paleta: Paleta;
  prompts: Prompt[];
  /** Secciones que se pidieron pero fallaron. Habilita el estado parcial (§11). */
  seccionesFallidas: TipologiaSeccion[];
  estado: EstadoCampana;
  creadaEn: string;
  actualizadaEn: string;
}

export interface Usuario {
  id: string;
  email: string;
  plan: Plan;
  creditosDisponibles: number;
  renuevaEn: string;
  creadoEn: string;
}

/** Una línea del historial de consumo que se muestra en /app/cuenta. */
export interface MovimientoCredito {
  id: string;
  usuarioId: string;
  campanaId: string | null;
  campanaNombre: string;
  /** Negativo consume, positivo devuelve o recarga. */
  delta: number;
  motivo: "generacion" | "devolucion" | "recarga-plan" | "bienvenida";
  fecha: string;
}

export interface Mensaje {
  rol: "usuario" | "asistente";
  texto: string;
}

/** Lo que el wizard reúne antes de llamar al motor de prompts. */
export interface EntradaPrompt {
  producto: Producto;
  paleta: Paleta;
  tipologia: TipologiaSeccion;
}
