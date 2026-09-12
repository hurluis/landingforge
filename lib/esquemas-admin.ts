import { z } from "zod";
import { esquemaTipologia } from "@/lib/esquemas";

/**
 * Esquemas del panel de administración — el borde del servidor.
 *
 * Se valida aquí aunque el formulario ya haya validado: estas rutas cambian
 * saldos y roles, así que son justo las que nadie debe poder llamar a mano
 * con un cuerpo arbitrario.
 *
 * Los filtros también se validan, y no solo las mutaciones: llegan de la
 * barra de direcciones, donde cualquiera puede escribir lo que quiera.
 */

export const esquemaRol = z.enum(["usuario", "admin"]);
export const esquemaPlanAdmin = z.enum(["semilla", "estudio", "agencia", "fundicion"]);
export const esquemaEstadoCampana = z.enum(["borrador", "generando", "lista", "error"]);

export const esquemaAccionAuditoria = z.enum([
  "usuario.plan",
  "usuario.creditos",
  "usuario.rol",
  "usuario.borrado",
  "campana.borrada",
]);

/* ------------------------------ Filtros ------------------------------ */

const pagina = z.coerce.number().int().min(1).max(10_000).optional();
const porPagina = z.coerce.number().int().min(5).max(100).optional();

export const esquemaFiltroUsuarios = z.object({
  busqueda: z.string().trim().max(120).optional(),
  plan: esquemaPlanAdmin.optional(),
  rol: esquemaRol.optional(),
  orden: z.enum(["reciente", "antiguo", "creditos", "campanas"]).optional(),
  pagina,
  porPagina,
});

export const esquemaFiltroCampanas = z.object({
  busqueda: z.string().trim().max(120).optional(),
  estado: esquemaEstadoCampana.optional(),
  tipologia: esquemaTipologia.optional(),
  usuarioId: z.string().trim().max(64).optional(),
  soloConBloqueo: z
    .union([z.boolean(), z.literal("true"), z.literal("false")])
    .transform((v) => v === true || v === "true")
    .optional(),
  pagina,
  porPagina,
});

export const esquemaFiltroAuditoria = z.object({
  actorId: z.string().trim().max(64).optional(),
  accion: esquemaAccionAuditoria.optional(),
  desde: z.string().trim().max(40).optional(),
  hasta: z.string().trim().max(40).optional(),
  pagina,
  porPagina,
});

/* ---------------------------- Mutaciones ---------------------------- */

/**
 * Ajuste de créditos. El motivo es obligatorio y se guarda tanto en la
 * auditoría como en el historial que ve el propio usuario, así que tiene que
 * ser una frase legible por una persona, no un código interno.
 */
export const esquemaAjusteCreditos = z.object({
  delta: z
    .number()
    .int("Los créditos son enteros")
    .refine((n) => n !== 0, "El ajuste no puede ser de cero créditos")
    .refine((n) => Math.abs(n) <= 10_000, "Un solo ajuste no puede pasar de 10.000 créditos"),
  motivo: z
    .string()
    .trim()
    .min(4, "Escribe por qué haces este ajuste")
    .max(140, "El motivo cabe en 140 caracteres"),
});

export const esquemaCambioRol = z.object({ rol: esquemaRol });

export const esquemaCambioPlanAdmin = z.object({ plan: esquemaPlanAdmin });

/**
 * El borrado exige repetir el correo exacto de la cuenta. Es la única
 * confirmación que no se puede pulsar por accidente.
 */
export const esquemaBorradoUsuario = z.object({
  confirmacion: z.string().trim().min(1, "Escribe el correo para confirmar"),
});

export type FiltroUsuariosEntrada = z.infer<typeof esquemaFiltroUsuarios>;
export type FiltroCampanasEntrada = z.infer<typeof esquemaFiltroCampanas>;
export type FiltroAuditoriaEntrada = z.infer<typeof esquemaFiltroAuditoria>;
