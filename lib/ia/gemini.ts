import "server-only";

import { GoogleGenAI } from "@google/genai";
import type { EntradaPrompt, Mensaje, Prompt } from "@/lib/datos/tipos";
import { instruccionesParaModelo } from "@/lib/metodologia/constructor";
import { construirPrompt } from "@/lib/metodologia/reglas-prompt";
import { tipologia } from "@/lib/metodologia/tipologias";
import { id } from "@/lib/utils";
import { ErrorGeneracion, type ClienteIA } from "@/lib/ia/cliente";
import { CONFIG_ASISTENTE, PROMPT_ASISTENTE } from "@/lib/ia/prompt-asistente";

/**
 * Implementación real — §9.6.
 *
 * `import "server-only"` hace que el build FALLE si algún componente cliente
 * llega a importar este archivo. Es la defensa que convierte «la clave no debe
 * salir al navegador» en algo que el compilador comprueba, no en una promesa.
 *
 * La clave se lee de GEMINI_API_KEY, sin prefijo NEXT_PUBLIC_: cualquier
 * variable con ese prefijo se inyecta en el bundle del navegador.
 */

const MODELO = process.env.GEMINI_MODELO ?? "gemini-2.5-flash";

export class ClienteGemini implements ClienteIA {
  readonly nombre = "gemini" as const;
  private readonly ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generarPrompt(entrada: EntradaPrompt): Promise<Prompt> {
    const t = tipologia(entrada.tipologia);
    try {
      const respuesta = await this.ai.models.generateContent({
        model: MODELO,
        contents: instruccionesParaModelo(entrada),
        config: {
          temperature: 0.7,
          maxOutputTokens: 1200,
          systemInstruction:
            "Eres el motor de construcción de prompts de LandingForge. Ejecutas una metodología documentada: no improvisas ni añades secciones que no se te piden. Escribes en español de Colombia, en prosa narrativa continua.",
        },
      });

      const texto = respuesta.text?.trim();
      if (!texto) {
        throw new ErrorGeneracion(
          `El modelo devolvió una respuesta vacía para la sección ${t.nombre}.`,
        );
      }

      return construirPrompt(entrada.tipologia, texto, t.requiereImagenReferencia, id("prm"));
    } catch (e) {
      if (e instanceof ErrorGeneracion) throw e;
      throw new ErrorGeneracion(
        `No se pudo construir la sección ${t.nombre}. El crédito se devolvió.`,
      );
    }
  }

  async *chat(mensajes: Mensaje[]): AsyncIterable<string> {
    const flujo = await this.ai.models.generateContentStream({
      model: MODELO,
      contents: mensajes.map((m) => ({
        role: m.rol === "usuario" ? "user" : "model",
        parts: [{ text: m.texto }],
      })),
      config: {
        ...CONFIG_ASISTENTE,
        systemInstruction: PROMPT_ASISTENTE,
      },
    });

    for await (const trozo of flujo) {
      const texto = trozo.text;
      if (texto) yield texto;
    }
  }
}
