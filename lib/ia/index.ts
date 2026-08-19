import "server-only";

import type { ClienteIA } from "@/lib/ia/cliente";
import { ClienteMock } from "@/lib/ia/mock";

/**
 * El punto de inyección — §9.3.
 *
 * Conectar el modelo real no toca ningún componente: solo cambia lo que
 * devuelve esta función. Sin GEMINI_API_KEY el producto sigue funcionando
 * entero contra el mock, que ejecuta la misma metodología.
 */

let instancia: ClienteIA | null = null;

export async function clienteIA(): Promise<ClienteIA> {
  if (instancia) return instancia;

  const clave = process.env.GEMINI_API_KEY;
  if (clave && clave.trim() !== "") {
    // Import dinámico: sin clave, el SDK ni siquiera se carga.
    const { ClienteGemini } = await import("@/lib/ia/gemini");
    instancia = new ClienteGemini(clave);
  } else {
    instancia = new ClienteMock();
  }
  return instancia;
}

/** Para la pantalla de cuenta: decir con honestidad qué está corriendo. */
export function hayModeloReal(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/** F4 queda tras bandera de entorno, con la interfaz construida (§7). */
export function generacionDeImagenesActiva(): boolean {
  return process.env.FEATURE_GENERACION_IMAGENES === "true";
}
