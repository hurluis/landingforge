import type {
  AccionAuditoria,
  CalidadMetodologia,
  Campana,
  CampanaConDueno,
  EstadoCampana,
  EventoAuditoria,
  MovimientoCredito,
  ObjetivoAuditoria,
  Pagina,
  Plan,
  ResumenPlataforma,
  Rol,
  SaludSistema,
  TipologiaSeccion,
  Usuario,
  UsuarioConMetricas,
} from "@/lib/datos/tipos";

/**
 * La interfaz de persistencia del panel de administración.
 *
 * Va SEPARADA de `Repositorio` a propósito. Todo método de `Repositorio`
 * recibe un `usuarioId` y filtra por él: esa es la garantía que impide que un
 * usuario lea la campaña de otro adivinando el id. Las consultas de este
 * archivo son globales por naturaleza, y mezclarlas en la misma interfaz
 * volvería esa garantía imposible de afirmar sin leer método por método.
 *
 * Con dos interfaces la promesa de aislamiento de `Repositorio` sigue siendo
 * cierta, y el simple hecho de importar `RepositorioAdmin` es la señal de que
 * ese código exige rol de administrador.
 */

export interface FiltroUsuarios {
  busqueda?: string;
  plan?: Plan;
  rol?: Rol;
  orden?: "reciente" | "antiguo" | "creditos" | "campanas";
  pagina?: number;
  porPagina?: number;
}

export interface FiltroCampanas {
  busqueda?: string;
  estado?: EstadoCampana;
  tipologia?: TipologiaSeccion;
  usuarioId?: string;
  soloConBloqueo?: boolean;
  pagina?: number;
  porPagina?: number;
}

export interface FiltroAuditoria {
  actorId?: string;
  accion?: AccionAuditoria;
  desde?: string;
  hasta?: string;
  pagina?: number;
  porPagina?: number;
}

/** Lo que hace falta para escribir una línea de auditoría. */
export interface EntradaAuditoria {
  actorId: string | null;
  actorEmail: string;
  accion: AccionAuditoria;
  objetivoTipo: ObjetivoAuditoria;
  objetivoId: string;
  objetivoEtiqueta: string;
  detalle?: Record<string, unknown>;
  ip?: string;
}

/** El detalle de un usuario reúne en una sola lectura todo lo suyo. */
export interface FichaUsuario {
  usuario: UsuarioConMetricas;
  campanas: Campana[];
  movimientos: MovimientoCredito[];
  auditoria: EventoAuditoria[];
}

export interface RepositorioAdmin {
  /* --- Tablero --- */
  resumen(): Promise<ResumenPlataforma>;
  salud(): Promise<SaludSistema>;

  /* --- Usuarios --- */
  listarUsuarios(filtro: FiltroUsuarios): Promise<Pagina<UsuarioConMetricas>>;
  fichaUsuario(usuarioId: string): Promise<FichaUsuario | null>;
  contarAdmins(): Promise<number>;
  cambiarRol(usuarioId: string, rol: Rol): Promise<Usuario | null>;
  /** Suma o resta créditos sin pasar por el flujo de planes. Deja movimiento. */
  ajustarCreditos(usuarioId: string, delta: number, nota: string): Promise<Usuario | null>;
  borrarUsuario(usuarioId: string): Promise<boolean>;
  /**
   * Promueve por correo. Devuelve `null` si ese correo todavía no tiene
   * cuenta, y `promovido: false` si ya era administrador — así el llamador
   * sabe si debe escribir una línea de auditoría o si no ha pasado nada.
   */
  promoverPorEmail(email: string): Promise<{ usuario: Usuario; promovido: boolean } | null>;

  /* --- Campañas --- */
  listarCampanas(filtro: FiltroCampanas): Promise<Pagina<CampanaConDueno>>;
  campanaCompleta(campanaId: string): Promise<{ campana: Campana; email: string } | null>;
  borrarCampanaComoAdmin(campanaId: string): Promise<boolean>;

  /* --- Calidad de la metodología --- */
  calidad(): Promise<CalidadMetodologia>;

  /* --- Auditoría. Solo se escribe y se lee: nunca se corrige. --- */
  anotarAuditoria(entrada: EntradaAuditoria): Promise<EventoAuditoria>;
  listarAuditoria(filtro: FiltroAuditoria): Promise<Pagina<EventoAuditoria>>;
  /** Todas las líneas que casan con el filtro, para el CSV. Sin paginar. */
  auditoriaCompleta(filtro: FiltroAuditoria): Promise<EventoAuditoria[]>;
}
