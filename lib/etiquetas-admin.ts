import type {
  AccionAuditoria,
  MovimientoCredito,
  ReglaAdvertencia,
  TipologiaSeccion,
} from "@/lib/datos/tipos";

/**
 * Los nombres que ve una persona.
 *
 * Están en un solo archivo para que la bitácora, la ficha de usuario y el
 * cuadro de calidad no acaben llamando de tres formas distintas a la misma
 * cosa. Todos son `Record` completos sobre uniones cerradas: si mañana se
 * añade una acción o una regla, el compilador exige nombrarla aquí antes de
 * dejar compilar.
 */

export const ETIQUETA_ACCION: Record<AccionAuditoria, string> = {
  "usuario.plan": "Cambio de plan",
  "usuario.creditos": "Ajuste de créditos",
  "usuario.rol": "Cambio de rol",
  "usuario.borrado": "Cuenta borrada",
  "campana.borrada": "Campaña borrada",
};

export const ETIQUETA_MOTIVO: Record<MovimientoCredito["motivo"], string> = {
  generacion: "Generación",
  devolucion: "Devolución",
  "recarga-plan": "Recarga del plan",
  bienvenida: "Créditos de bienvenida",
  "ajuste-admin": "Ajuste del equipo",
};

export const ETIQUETA_REGLA: Record<ReglaAdvertencia, string> = {
  "limite-25-caracteres": "Texto de más de 25 caracteres",
  "palabra-prohibida": "Palabra de la lista negra",
  "sin-bloque-paleta": "Falta el bloque de paleta",
  "sin-bloque-iluminacion": "Falta el bloque de iluminación",
  longitud: "Longitud fuera de rango",
  "estilo-keywords": "Estilo de lista de keywords",
};

/** Versión corta, para cabeceras de columna donde no cabe la larga. */
export const ETIQUETA_REGLA_CORTA: Record<ReglaAdvertencia, string> = {
  "limite-25-caracteres": "25 car.",
  "palabra-prohibida": "Lista negra",
  "sin-bloque-paleta": "Paleta",
  "sin-bloque-iluminacion": "Luz",
  longitud: "Longitud",
  "estilo-keywords": "Keywords",
};

export const ETIQUETA_TIPOLOGIA: Record<TipologiaSeccion, string> = {
  hero: "Hero",
  beneficios: "Beneficios",
  "antes-despues": "Antes y después",
  "paso-a-paso": "Paso a paso",
  testimonios: "Testimonios",
  autoridad: "Autoridad",
  confianza: "Confianza",
  precios: "Precios",
  "estilo-de-vida": "Estilo de vida",
};

export const TIPOLOGIAS: TipologiaSeccion[] = [
  "hero",
  "beneficios",
  "antes-despues",
  "paso-a-paso",
  "testimonios",
  "autoridad",
  "confianza",
  "precios",
  "estilo-de-vida",
];

/**
 * Traduce el detalle JSON de una línea de auditoría a una frase.
 *
 * El detalle se guarda estructurado, no como texto, porque un registro que
 * solo sabe hablar español no se puede consultar ni filtrar. La frase se
 * construye al mostrarlo.
 */
export function describirDetalle(
  accion: AccionAuditoria,
  detalle: Record<string, unknown>,
): string {
  const texto = (clave: string) => {
    const v = detalle[clave];
    return v === undefined || v === null ? "" : String(v);
  };

  switch (accion) {
    case "usuario.plan":
      return `de ${texto("de")} a ${texto("a")}`;
    case "usuario.rol": {
      const origen = texto("origen");
      const base = `de ${texto("de")} a ${texto("a")}`;
      return origen ? `${base} · por ${origen}` : base;
    }
    case "usuario.creditos": {
      const delta = Number(detalle.delta ?? 0);
      return `${delta > 0 ? "+" : ""}${delta} · ${texto("motivo")}`;
    }
    case "usuario.borrado":
      return `plan ${texto("plan")} · ${texto("creditos")} créditos sin usar`;
    case "campana.borrada":
      return `de ${texto("dueno")} · ${texto("prompts")} prompts`;
  }
}
