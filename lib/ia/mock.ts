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
        `No se pudo construir la sección ${tipologia(entrada.tipologia).nombre}.`,
      );
    }
    return construirPrompt(
      entrada.tipologia,
      construirTexto(entrada),
      tipologia(entrada.tipologia).requiereImagenReferencia,
      id("prm"),
    );
  }

  async *chat(mensajes: Mensaje[], idioma: "es" | "en" = "es"): AsyncIterable<string> {
    await esperar(400);
    const respuesta = responder(mensajes, idioma);
    // Se emite token a token para que el streaming se pueda diseñar de verdad.
    for (const trozo of respuesta.match(/\S+\s*/g) ?? []) {
      await esperar(18 + Math.random() * 30);
      yield trozo;
    }
  }
}

/* ------------------------------------------------------------------ */
/* El asistente sin modelo                                             */
/* ------------------------------------------------------------------ */

/**
 * Esto no es una tabla de respuestas: es una conversación.
 *
 * La versión anterior miraba solo el último mensaje y elegía una frase por
 * palabra clave. Funcionaba para la primera pregunta y fallaba justo después,
 * en el momento que más importa: el asistente ofrecía «¿te cuento X?», la
 * persona contestaba «sí», ese «sí» no casaba con ningún patrón y caía en la
 * respuesta por defecto, que volvía a ofrecer lo mismo. Un bucle.
 *
 * Ahora hay tres reglas que lo arreglan, y las tres leen el historial entero:
 *
 *   1. Si el último mensaje es una aceptación —«sí», «dale», «cuéntame»—, se
 *      busca qué ofreció el asistente en su turno anterior y SE ENTREGA. Sin
 *      volver a preguntar.
 *   2. Un tema ya contado no se repite: si su texto está en el historial, se
 *      pasa al siguiente que encaje.
 *   3. La negativa por tema ajeno cambia de redacción cada vez, porque repetir
 *      la misma frase es lo que hace que un chat parezca roto.
 *
 * El modelo real hace esto mucho mejor; este motor solo tiene que no quedar en
 * ridículo cuando no hay clave configurada.
 */

type Tema = {
  id: string;
  patron: RegExp;
  es: string;
  en: string;
  /** Tema que se ofrece al final. Si la persona acepta, es el que se entrega. */
  ofrece?: string;
};

const TEMAS: Tema[] = [
  {
    id: "planes",
    patron: /(precio|cuesta|cu[aá]nto (cuesta|vale|sale)|plan(es)?\b|tarifa|suscrip|pagar|facturac|price|pricing|cost|how much (does|is) it|subscription|billing|pay)/,
    es: "Cuatro planes, en dólares y por mes: Semilla US$12 con 30 secciones, Estudio US$35 con 120, Agencia US$99 con 400, y Fundición US$200 con 900 incluidas y sin tope, para agencias con picos. Un crédito es una sección con su prompt validado y su imagen 9:16. Empiezas con 5 gratis, sin tarjeta.",
    en: "Four plans, in dollars, per month: Seed at US$12 with 30 sections, Studio at US$35 with 120, Agency at US$99 with 400, and Foundry at US$200 with 900 included and no ceiling, built for agencies with spikes. One credit is one section with its validated prompt and its 9:16 image. You start with 5 free, no card.",
    ofrece: "creditos",
  },
  {
    id: "creditos",
    patron: /(cr[eé]dito|devolu|reembols|falla|credit|refund|fail)/,
    es: "Un crédito es una generación: una sección con su prompt y su imagen. Cada intento consume uno, salga como salga, y no hay devolución automática: una pieza fallida ya se produjo y ya se puede descargar. Por eso el formulario pregunta producto, audiencia, mercado, beneficio y precio, y por eso los planes traen holgura —30 secciones son tres campañas completas—. Si el fallo es nuestro, el equipo ajusta los créditos a mano.",
    en: "A credit is one generation: a section with its prompt and its image. Every attempt uses one, however it turns out, and there is no automatic refund: a failed piece has already been produced and can already be downloaded. That is why the form asks for product, audience, market, benefit and price, and why the plans carry slack — 30 sections is three full campaigns. If the failure is ours, the team adjusts the credits by hand.",
    ofrece: "flujo",
  },
  {
    id: "flujo",
    patron: /(c[oó]mo funciona|flujo|paso|empez|how does it work|flow|get started|steps)/,
    es: "Cuatro pasos. Uno: describes el producto y subes su foto. Dos: eliges el país donde vendes, la audiencia, el beneficio y el precio. Tres: la matriz te propone una paleta y ves sus hex antes de gastar nada. Cuatro: marcas qué secciones quieres de las nueve, y cada una se construye y se valida por separado. Los prompts van apareciendo uno a uno y la campaña se guarda sobre la marcha.",
    en: "Four steps. One: you describe the product and upload its photo. Two: you pick the country you sell in, the audience, the benefit and the price. Three: the matrix proposes a palette and you see its hex values before spending anything. Four: you tick which of the nine sections you want, and each one is built and validated separately. Prompts appear one by one and the campaign saves as it goes.",
    ofrece: "secciones",
  },
  {
    id: "secciones",
    patron: /(secci|nueve|tipolog|section|nine|type)/,
    es: "Nueve: hero, beneficios, antes y después, paso a paso, testimonios, autoridad, confianza y garantía, precios y estilo de vida. Cada una tiene propósito, estructura y una regla crítica. Eliges cuáles quieres: si solo necesitas tres, pagas tres.",
    en: "Nine: hero, benefits, before and after, step by step, testimonials, authority, trust and guarantee, pricing and lifestyle. Each has a purpose, a structure and one critical rule. You choose which ones you want: if you only need three, you pay for three.",
    ofrece: "antes-despues",
  },
  {
    id: "antes-despues",
    patron: /(antes|despu[eé]s|before|after)/,
    es: "Antes y después es la que más convierte, y la que peor sale sin método. La regla crítica es que sea la misma persona en las dos mitades: se bloquean forma de rostro, tono de piel, ojos, nariz y cabello, y la iluminación y el encuadre son idénticos. Dos personas distintas, o una luz más favorecedora en el después, y la pieza se lee como un truco.",
    en: "Before and after converts best, and it is the one that goes worst without a method. The critical rule is that it must be the same person on both halves: face shape, skin tone, eyes, nose and hair are locked, and the lighting and framing are identical. Two different people, or kinder light on the after, and the piece reads as a trick.",
    ofrece: "mercado",
  },
  {
    id: "mercado",
    patron: /(contraentrega|invima|cofepris|digesa|registro|pa[ií]s|mercado|country|market|cash on delivery|regulat)/,
    es: "La campaña se adapta al país que elijas: pago contraentrega donde se usa y solo donde se usa, el registro sanitario que corresponde —INVIMA, COFEPRIS, DIGESA, ANMAT, FDA—, personas y ciudades reales de ahí, y el precio con su moneda y sus separadores. $99.900 en Bogotá y $99,900 en Ciudad de México no son el mismo número escrito distinto: el separador equivocado le dice a tu comprador que la pieza no es de su país.",
    en: "The campaign adapts to whichever country you pick: cash on delivery where it is used and only there, the matching health registration — INVIMA, COFEPRIS, DIGESA, ANMAT, FDA — real people and cities from that country, and the price in its currency and separators. $99.900 in Bogotá and $99,900 in Mexico City are not the same number written differently: the wrong separator tells your buyer the piece is not from their country.",
    ofrece: "metodologia",
  },
  {
    id: "metodologia",
    patron: /(plantilla|diferen|metodolog|por qu[eé]|competen|template|different|method|why)/,
    es: "La diferencia es que hay un sistema debajo, no una plantilla. Nueve tipologías documentadas con sus reglas, una matriz que asigna la paleta cruzando producto, audiencia y registro emocional, prompts en prosa narrativa en vez de listas de keywords, y siete reglas que un validador comprueba antes de guardar cada uno. Está publicada entera en /metodologia.",
    en: "The difference is that there is a system underneath, not a template. Nine documented section types with their rules, a matrix that assigns the palette by crossing product, audience and emotional register, prompts written as narrative prose instead of keyword lists, and seven rules a validator checks before saving each one. It is published in full at /metodologia.",
    ofrece: "paleta",
  },
  {
    id: "paleta",
    patron: /(paleta|color|identidad|palette|colour|brand)/,
    es: "La paleta no se sortea: sale de una matriz que cruza tipo de producto, audiencia y registro emocional. Son doce, hechas a mano, cada una con su argumento —hierro nocturno para suplemento deportivo, porcelana rosa para skincare adulto, quirófano para producto clínico—. Ves los hex y el motivo antes de generar nada, y puedes pedir alternativas.",
    en: "The palette is not drawn at random: it comes from a matrix crossing product type, audience and emotional register. There are twelve, built by hand, each with its own reasoning — night iron for sports supplements, pink porcelain for adult skincare, operating room for clinical products. You see the hex values and the reasoning before generating anything, and you can ask for alternatives.",
    ofrece: "propiedad",
  },
  {
    id: "propiedad",
    patron: /(prompt|m[ií]o|export|propiedad|llev|own|mine|export)/,
    es: "Los prompts son tuyos. Se exportan en .md y .json, los editas, los versionas y los corres en el generador que quieras. Si mañana dejas de pagar LandingForge, tu trabajo sigue siendo tuyo: esa es la diferencia entre llevarte las imágenes y llevarte la receta.",
    en: "The prompts are yours. You export them as .md and .json, edit them, version them and run them in whichever generator you like. If you stop paying for LandingForge tomorrow, your work is still yours: that is the difference between taking the images and taking the recipe.",
    ofrece: "limites",
  },
  {
    id: "limites",
    patron: /(me sirve|mi categor|limitac|qu[eé] no es|hosting|is it for|does it work for|limitation)/,
    es: "Es honesto decir qué no es: no construye el sitio ni da hosting, entrega las piezas. Y la matriz está calibrada para suplementos, cosmética, dispositivos de belleza y electrónica de consumo; fuera de ahí funciona pero pierde precisión. Lo mejor es probarlo con las 5 secciones gratis antes de pagar un plan.",
    en: "It is fair to say what it is not: it does not build the site and it does not host it, it delivers the pieces. And the matrix is calibrated for supplements, cosmetics, beauty devices and consumer electronics; outside that it works but loses precision. The best move is to try it with the 5 free sections before paying for a plan.",
  },
  {
    id: "imagen",
    patron: /(generar imagen|generaci[oó]n de im|nano banana|image generation)/,
    es: "En esta versión LandingForge construye y valida los prompts; la generación de la imagen todavía no está conectada. Lo decimos así de claro porque preferimos eso a prometerlo. El prompt que recibes ya es utilizable en cualquier generador.",
    en: "In this version LandingForge builds and validates the prompts; image generation is not connected yet. We say it plainly because we would rather do that than promise it. The prompt you get is already usable in any generator.",
  },
];

/* Sin `\b`: la frontera de palabra de JavaScript es ASCII, así que detrás de
   la «í» de «sí» no hay ninguna y la aceptación no casaba nunca. El look-ahead
   Unicode dice lo mismo y sí entiende los acentos. */
const FIN = "(?![\\p{L}\\p{N}])";
const ACEPTA = new RegExp(
  `^(s[ií]|sip|claro|dale|ok|okay|vale|por favor|bueno|me interesa|cu[eé]ntame|cuentame|adelante|yes|yeah|sure|please|go ahead|tell me)${FIN}`,
  "iu",
);
const SALUDO = new RegExp(
  `^(hola|buenas|qu[eé] tal|hey|hi|hello|buenos d[ií]as|buenas tardes)${FIN}`,
  "iu",
);

const NEGATIVAS = {
  es: [
    "De eso no te puedo ayudar: aquí solo hablo de LandingForge. ¿Te cuento cómo elige la paleta de tu producto?",
    "Eso se sale de lo mío. Lo que sí sé es cómo se arma cada sección de una landing. ¿Por dónde quieres empezar?",
    "Sigo sin poder con eso, pero pregúntame por los planes, por la metodología o por lo que te llevas.",
  ],
  en: [
    "I can't help with that: here I only talk about LandingForge. Want me to explain how it picks your product's palette?",
    "That's outside what I do. What I do know is how each landing page section gets built. Where would you like to start?",
    "Still can't help with that one, but ask me about the plans, the method, or what you take with you.",
  ],
};

/* Lo que no es de la marca, por muy amable que venga. Se comprueba ANTES que
   los temas: «¿cuánto es 2 por 3?» compartía la palabra «cuánto» con la
   pregunta de precios y se colaba como si preguntara por los planes. */
const AJENO =
  /(\d+\s*[x*+/÷-]\s*\d+|\d+\s+(por|m[aá]s|menos|entre)\s+\d+|clima|tiempo en |receta|traduce|traducir|c[oó]digo en |escr[ií]beme|resuelve|tarea|pol[ií]tica|presidente|noticias|chiste|poema|weather|recipe|translate|write me|solve|homework|politics|joke|poem)/i;

const texto = (t: Tema, idioma: "es" | "en") => (idioma === "en" ? t.en : t.es);

function responder(mensajes: Mensaje[], idioma: "es" | "en"): string {
  const ultimo = mensajes.filter((m) => m.rol === "usuario").at(-1)?.texto ?? "";
  const q = ultimo.toLowerCase();
  const dichos = mensajes.filter((m) => m.rol === "asistente").map((m) => m.texto);
  const yaDicho = (t: Tema) => dichos.some((d) => d.includes(texto(t, idioma).slice(0, 40)));

  /* 1 · Aceptaron lo que se ofreció en el turno anterior: se entrega. */
  if (ACEPTA.test(q.trim())) {
    const anterior = dichos.at(-1) ?? "";
    const ofrecido = TEMAS.find((t) => anterior.includes(texto(t, idioma).slice(0, 40)))?.ofrece;
    const tema = TEMAS.find((t) => t.id === ofrecido);
    if (tema) return texto(tema, idioma);
    /* No había nada pendiente: se ofrece lo primero sin contar. */
    const siguiente = TEMAS.find((t) => !yaDicho(t));
    if (siguiente) return texto(siguiente, idioma);
  }

  if (SALUDO.test(q.trim())) {
    return idioma === "en"
      ? "Hello. Ask me anything about LandingForge: how it works, what it generates, what it costs, or why it isn't a template."
      : "Hola. Pregúntame lo que quieras sobre LandingForge: cómo funciona, qué genera, cuánto cuesta o por qué no es una plantilla.";
  }

  /* 2 · Tema ajeno, antes de mirar los temas propios. */
  if (AJENO.test(q)) return negativa(dichos, idioma);

  /* 3 · El tema que encaje y no se haya contado ya. */
  const encajan = TEMAS.filter((t) => t.patron.test(q));
  const tema = encajan.find((t) => !yaDicho(t)) ?? encajan[0];
  if (tema) return texto(tema, idioma);

  /* 4 · Nada encaja: misma negativa que arriba. */
  return negativa(dichos, idioma);
}

/** La negativa cambia de redacción según cuántas lleve: repetirla suena a robot. */
function negativa(dichos: string[], idioma: "es" | "en"): string {
  const negativas = NEGATIVAS[idioma];
  const previas = dichos.filter((d) => negativas.some((n) => d.includes(n.slice(0, 30)))).length;
  return negativas[Math.min(previas, negativas.length - 1)];
}
