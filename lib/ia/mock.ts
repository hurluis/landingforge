import type { EntradaPrompt, Mensaje, Prompt } from "@/lib/datos/tipos";
import { construirTexto } from "@/lib/metodologia/constructor";
import { construirPrompt } from "@/lib/metodologia/reglas-prompt";
import { tipologia } from "@/lib/metodologia/tipologias";
import { id } from "@/lib/utils";
import { ErrorGeneracion, type ClienteIA } from "@/lib/ia/cliente";

/**
 * Implementación falsa — §9.3.
 *
 * No es un stub que devuelve texto de relleno: ejecuta el constructor real de
 * la metodología, así que el prompt que produce es un prompt válido. Lo único
 * que falta es la redacción del modelo.
 *
 * Incluye latencia artificial de 600–1200 ms y un fallo cada N llamadas, para
 * que los estados de carga y de error se diseñen contra comportamiento
 * realista y no contra respuestas instantáneas.
 */

const FALLO_CADA = 9;
let llamadas = 0;

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const latencia = () => 600 + Math.random() * 600;

export class ClienteMock implements ClienteIA {
  readonly nombre = "mock" as const;

  constructor(private readonly fallar = true) {}

  async generarPrompt(entrada: EntradaPrompt): Promise<Prompt> {
    await esperar(latencia());
    llamadas += 1;
    if (this.fallar && llamadas % FALLO_CADA === 0) {
      throw new ErrorGeneracion(
        `No se pudo construir la sección ${tipologia(entrada.tipologia).nombre}. El crédito se devolvió.`,
      );
    }
    return construirPrompt(
      entrada.tipologia,
      construirTexto(entrada),
      tipologia(entrada.tipologia).requiereImagenReferencia,
      id("prm"),
    );
  }

  async *chat(mensajes: Mensaje[]): AsyncIterable<string> {
    await esperar(400);
    const ultimo = mensajes.filter((m) => m.rol === "usuario").at(-1)?.texto ?? "";
    const respuesta = respuestaLocal(ultimo);
    // Se emite token a token para que el streaming se pueda diseñar de verdad.
    for (const trozo of respuesta.match(/\S+\s*/g) ?? []) {
      await esperar(18 + Math.random() * 30);
      yield trozo;
    }
  }
}

/**
 * Respuestas del asistente sin modelo. Cubren las preguntas frecuentes reales
 * y respetan los mismos guardarraíles de §10: nada inventado, redirección en
 * una frase cuando el tema es ajeno.
 */
function respuestaLocal(pregunta: string): string {
  const q = pregunta.toLowerCase();

  if (/(precio|cuesta|plan|cu[aá]nto|vale)/.test(q)) {
    return "Tres planes: Semilla $49.900 con 30 créditos, Estudio $129.900 con 120 y Agencia $349.900 con 400. Un crédito es una imagen 9:16 en calidad máxima. Empieza con los 5 créditos gratis, sin tarjeta.";
  }
  if (/(secci|nueve|tipolog)/.test(q)) {
    return "Nueve: hero, beneficios, antes y después, paso a paso, testimonios, autoridad, confianza y garantía, precios y estilo de vida. Cada una tiene su estructura y su regla crítica documentadas. ¿Quieres que te cuente la de antes y después?";
  }
  if (/(contraentrega|invima|colomb)/.test(q)) {
    return "Contraentrega va en todas las campañas: es la señal de confianza número uno del país. Para suplementos y cosméticos también se incluye el registro INVIMA, y los precios salen con punto de miles. Eso viene de fábrica, no hay que pedirlo.";
  }
  if (/(prompt|m[ií]o|export|propiedad|llev)/.test(q)) {
    return "Los prompts son tuyos. Se exportan en .md y .json, los puedes editar y correr donde quieras. Si dejas de usar LandingForge, tu trabajo sigue siendo tuyo.";
  }
  if (/(plantilla|diferen|por qu[eé]|competen)/.test(q)) {
    return "La diferencia es que aquí hay una metodología, no una plantilla: nueve tipologías con reglas, una matriz que asigna la paleta según producto y audiencia, y validación de cada prompt antes de generar. Ninguna estructura se repite entre clientes.";
  }
  if (/(imagen|generar imagen|foto|nano banana)/.test(q)) {
    return "En esta versión LandingForge construye y valida los prompts; la generación de imágenes todavía no está conectada. Lo decimos así de claro porque preferimos eso a prometerlo.";
  }
  if (/(hola|buenas|qué tal|que tal)/.test(q)) {
    return "Hola. Pregúntame lo que quieras sobre LandingForge: cómo funciona, qué genera, cuánto cuesta o por qué no usamos plantillas.";
  }
  return "De eso no te puedo ayudar, pero sí de cómo LandingForge arma cada sección de tu landing. ¿Te cuento cómo asigna la paleta según tu producto?";
}
