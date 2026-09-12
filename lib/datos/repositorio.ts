import type {
  Campana,
  MovimientoCredito,
  Plan,
  Prompt,
  Usuario,
} from "@/lib/datos/tipos";

/**
 * La interfaz de persistencia — §9.2.
 *
 * Toda la aplicación habla con esto, nunca con SQL. Cambiar SQLite por
 * Postgres o Supabase es escribir otra clase que la cumpla; ni una pantalla
 * se entera.
 */
export interface Repositorio {
  /* --- Usuarios --- */
  crearUsuario(email: string, hash: string): Promise<Usuario>;
  usuarioPorEmail(email: string): Promise<(Usuario & { hash: string }) | null>;
  usuarioPorId(id: string): Promise<Usuario | null>;
  cambiarPlan(usuarioId: string, plan: Plan): Promise<Usuario>;

  /* --- Créditos. El descuento es transaccional y no se revierte: ver la
         nota de `app/api/prompts/route.ts`. Para compensar a un usuario está
         el ajuste del panel, que queda registrado en la auditoría. --- */
  descontarCreditos(
    usuarioId: string,
    cantidad: number,
    campanaId: string | null,
    campanaNombre: string,
  ): Promise<Usuario>;
  movimientos(usuarioId: string, limite?: number): Promise<MovimientoCredito[]>;

  /* --- Campañas: CRUD completo --- */
  crearCampana(campana: Campana): Promise<Campana>;
  campanasDe(usuarioId: string): Promise<Campana[]>;
  campana(id: string, usuarioId: string): Promise<Campana | null>;
  actualizarCampana(
    id: string,
    usuarioId: string,
    cambios: Partial<Pick<Campana, "nombre" | "prompts" | "estado" | "paleta" | "seccionesFallidas">>,
  ): Promise<Campana | null>;
  reemplazarPrompt(id: string, usuarioId: string, prompt: Prompt): Promise<Campana | null>;
  borrarCampana(id: string, usuarioId: string): Promise<boolean>;
  duplicarCampana(id: string, usuarioId: string): Promise<Campana | null>;
}
