import type { EntradaPrompt, Mensaje, Prompt } from "@/lib/datos/tipos";

/**
 * El contrato — §9.3. Ambas implementaciones lo cumplen: la falsa y la real.
 *
 * Consecuencia práctica: conectar el backend no toca un solo componente, solo
 * cambia qué implementación se inyecta. Si hay un `fetch` a Google dentro de
 * un componente, está mal hecho.
 */
export interface ClienteIA {
  /** Nombre de la implementación activa. Se muestra en la pantalla de cuenta. */
  readonly nombre: "gemini" | "mock";
  generarPrompt(entrada: EntradaPrompt): Promise<Prompt>;
  chat(mensajes: Mensaje[], idioma?: "es" | "en"): AsyncIterable<string>;
}

/** Error de dominio: distingue el fallo del modelo de un error real del código. */
export class ErrorGeneracion extends Error {
  constructor(
    message: string,
    readonly reintentable = true,
  ) {
    super(message);
    this.name = "ErrorGeneracion";
  }
}
