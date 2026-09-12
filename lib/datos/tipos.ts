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

/**
 * Los tres planes con secciones incluidas, y el de pago por uso, que trae
 * cuota y secciones pero no tiene tope: pasadas las incluidas se factura el
 * excedente. Ver `lib/planes.ts`.
 */
export type Plan = "semilla" | "estudio" | "agencia" | "fundicion";

/** Rol de plataforma. La fuente de verdad es la BD, nunca el token. */
export type Rol = "usuario" | "admin";

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

/** El país donde se vende. Ver `lib/metodologia/mercados.ts`. */
export type IdMercado = "CO" | "MX" | "PE" | "CL" | "AR" | "EC" | "GT" | "ES" | "US" | "INT";

export interface Producto {
  nombre: string;
  descripcion: string;
  imagenUrl?: string;
  tipo: TipoProducto;
  audiencia: Audiencia;
  beneficioPrincipal: string;
  /** Las campañas anteriores a los mercados no lo tienen: eran de Colombia. */
  mercado?: IdMercado;
  /** En la unidad mínima de la moneda del mercado: pesos, o céntimos donde los hay. */
  precio: number;
  precioTachado?: number;
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
  rol: Rol;
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
  motivo:
    | "generacion"
    | "devolucion"
    | "recarga-plan"
    | "bienvenida"
    | "ajuste-admin";
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

/* ------------------------------------------------------------------
   Administración de plataforma
   ------------------------------------------------------------------ */

/**
 * Acciones que quedan registradas. Es una unión cerrada a propósito: si
 * mañana alguien añade una mutación al panel, el compilador le obliga a
 * declararla aquí y por tanto a auditarla. Una acción no auditada no
 * compila.
 */
export type AccionAuditoria =
  | "usuario.plan"
  | "usuario.creditos"
  | "usuario.rol"
  | "usuario.borrado"
  | "campana.borrada";

export type ObjetivoAuditoria = "usuario" | "campana";

export interface EventoAuditoria {
  id: string;
  /** `null` cuando el actor es el arranque del sistema, no una persona. */
  actorId: string | null;
  actorEmail: string;
  accion: AccionAuditoria;
  objetivoTipo: ObjetivoAuditoria;
  objetivoId: string;
  /** Copia del nombre o correo al momento del hecho: sobrevive al borrado. */
  objetivoEtiqueta: string;
  detalle: Record<string, unknown>;
  ip: string;
  fecha: string;
}

/** Una fila de la lista de usuarios del panel, con sus cifras ya contadas. */
export interface UsuarioConMetricas extends Usuario {
  campanas: number;
  prompts: number;
  creditosConsumidos: number;
  ultimaActividad: string | null;
}

/** Una fila del inspector global de campañas. */
export interface CampanaConDueno {
  id: string;
  usuarioId: string;
  usuarioEmail: string;
  nombre: string;
  productoNombre: string;
  estado: EstadoCampana;
  prompts: number;
  bloqueos: number;
  avisos: number;
  actualizadaEn: string;
}

/** Página de resultados. El total permite dibujar el paginador. */
export interface Pagina<T> {
  filas: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

/** Un punto de las series diarias del tablero. */
export interface PuntoSerie {
  fecha: string;
  valor: number;
}

export interface ResumenPlataforma {
  usuarios: number;
  usuariosNuevos30d: number;
  admins: number;
  campanas: number;
  campanasPorEstado: Record<EstadoCampana, number>;
  prompts: number;
  creditosConsumidos: number;
  creditosDevueltos: number;
  usuariosPorPlan: Record<Plan, number>;
  altasPorDia: PuntoSerie[];
  campanasPorDia: PuntoSerie[];
}

/** Salud del proceso. Se lee, no se configura desde el panel. */
export interface SaludSistema {
  modeloReal: boolean;
  imagenesHabilitadas: boolean;
  nodo: string;
  entorno: string;
  bytesBaseDatos: number;
  rateLimitDistribuido: boolean;
}

/** Cuadro de calidad de la metodología: una fila por regla del validador. */
export interface CalidadRegla {
  regla: ReglaAdvertencia;
  severidad: Advertencia["severidad"];
  ocurrencias: number;
  promptsAfectados: number;
}

export interface CalidadMetodologia {
  promptsTotales: number;
  promptsLimpios: number;
  promptsConBloqueo: number;
  porRegla: CalidadRegla[];
  /** Matriz regla × tipología: `matriz[tipologia][regla]` = nº de prompts. */
  matriz: Record<string, Partial<Record<ReglaAdvertencia, number>>>;
  promptsPorTipologia: Record<string, number>;
  palabrasProhibidas: { palabra: string; veces: number }[];
  bloqueoPorDia: PuntoSerie[];
}
