import type { Advertencia, Prompt, TipologiaSeccion } from "@/lib/datos/tipos";
import { contarCaracteres, contarPalabras } from "@/lib/formato";

/**
 * Reglas de ingeniería de prompt — §2.4 punto 3 y §7.1 del brief.
 *
 * Esto es el foso del producto: no es una llamada a una API, es un sistema de
 * construcción y validación. El validador de abajo es lo que se muestra en la
 * pantalla de campaña y lo que demuestra que hay ingeniería debajo.
 */

/* ------------------------------------------------------------------
   Convenciones del formato de prompt
   ------------------------------------------------------------------ */

/** Los elementos de texto que el modelo debe RENDERIZAR van en comillas angulares. */
export const MARCA_TEXTO_ABRE = "«";
export const MARCA_TEXTO_CIERRA = "»";

export const LIMITE_CARACTERES_TEXTO = 25;
export const MIN_PALABRAS = 150;
export const MAX_PALABRAS = 350;

export const ETIQUETA_PALETA = "PALETA:";
export const ETIQUETA_ILUMINACION = "ILUMINACIÓN:";
export const LINEA_CIERRE =
  "FORMATO: vertical 9:16, 2K, calidad máxima, sin marca de agua, sin logotipos inventados.";

/**
 * La fórmula de siete componentes. El orden importa: el modelo pondera más lo
 * que aparece primero, así que formato y paleta van al inicio y la
 * configuración técnica al final.
 */
export const COMPONENTES = [
  { id: "formato-paleta", nombre: "Formato y paleta", peso: 1.0 },
  { id: "titular", nombre: "Titular y texto renderizado", peso: 0.9 },
  { id: "visual", nombre: "Visual principal", peso: 1.0 },
  { id: "composicion", nombre: "Composición de la sección", peso: 0.8 },
  { id: "iluminacion", nombre: "Bloque de iluminación", peso: 0.9 },
  { id: "mercado", nombre: "Señales del mercado", peso: 0.7 },
  { id: "cierre", nombre: "Cierre de configuración", peso: 0.4 },
] as const;

/**
 * Lista negra — §7.1. Cada palabra degrada la salida de Gemini: son términos
 * que el modelo asocia a bancos de imágenes y arte de concurso, no a
 * fotografía de producto. Cada una lleva su reemplazo específico: un
 * validador que solo dice «está mal» no sirve de nada.
 */
export const LISTA_NEGRA: Record<string, string> = {
  "4k": "resolución 2K declarada en el cierre",
  "8k": "resolución 2K declarada en el cierre",
  masterpiece: "descripción concreta de la composición",
  "highly detailed": "el detalle que importa, nombrado: textura del envase, poros de la piel",
  "ultra detailed": "el detalle que importa, nombrado",
  "trending on artstation": "referencia fotográfica real: luz de estudio de producto",
  hyperrealistic: "fotografía de producto con lente de 85 mm",
  photorealistic: "fotografía de producto con lente de 85 mm",
  "best quality": "el cierre de configuración ya declara la calidad",
  "award-winning": "descripción del resultado buscado",
  perfect: "la cualidad concreta: uniforme, alineado, limpio",
  flawless: "la cualidad concreta: piel uniforme, sin brillos",
  stunning: "el efecto concreto que debe producir la imagen",
  breathtaking: "el efecto concreto que debe producir la imagen",
  incredible: "el efecto concreto que debe producir la imagen",
  amazing: "el efecto concreto que debe producir la imagen",
};

const PALABRAS_NEGRAS = Object.keys(LISTA_NEGRA).sort((a, b) => b.length - a.length);

/* ------------------------------------------------------------------
   Validador — las siete reglas de §7.1
   ------------------------------------------------------------------ */

/** Devuelve los elementos de texto declarados entre «». */
export function elementosDeTexto(prompt: string): string[] {
  const encontrados: string[] = [];
  const re = /«([^»]*)»/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(prompt)) !== null) encontrados.push(m[1]);
  return encontrados;
}

/**
 * Densidad de comas. Una lista de keywords ("producto, estudio, luz suave,
 * fondo limpio, 85mm") tiene una coma cada 3–4 palabras. La prosa narrativa
 * ronda una cada 12–20. Por encima del umbral, el prompt dejó de ser prosa.
 */
export function densidadDeComas(prompt: string): number {
  const palabras = contarPalabras(prompt);
  if (palabras === 0) return 0;
  const comas = (prompt.match(/,/g) ?? []).length;
  return comas / palabras;
}

const UMBRAL_COMAS = 0.14; // una coma cada ~7 palabras o más denso

export function validarPrompt(texto: string): Advertencia[] {
  const advertencias: Advertencia[] = [];

  /* 1 · Ningún elemento de texto supera 25 caracteres. */
  for (const elemento of elementosDeTexto(texto)) {
    const largo = contarCaracteres(elemento);
    if (largo > LIMITE_CARACTERES_TEXTO) {
      advertencias.push({
        regla: "limite-25-caracteres",
        severidad: "aviso",
        detalle: `«${elemento}» tiene ${largo} caracteres. El límite es ${LIMITE_CARACTERES_TEXTO}: por encima, el render deforma las letras.`,
        fragmento: elemento,
        sugerencia: `Recorta ${largo - LIMITE_CARACTERES_TEXTO} caracteres.`,
      });
    }
  }

  /* 2 · Ninguna palabra de la lista negra. */
  const enMinusculas = texto.toLowerCase();
  for (const palabra of PALABRAS_NEGRAS) {
    const re = new RegExp(`(?<![\\p{L}])${escapar(palabra)}(?![\\p{L}])`, "iu");
    if (re.test(enMinusculas)) {
      advertencias.push({
        regla: "palabra-prohibida",
        severidad: "aviso",
        detalle: `«${palabra}» degrada la salida: el modelo la asocia a arte de concurso, no a fotografía de producto.`,
        fragmento: palabra,
        sugerencia: `Reemplázala por ${LISTA_NEGRA[palabra]}.`,
      });
    }
  }

  /* 3 · Prosa narrativa, no lista de keywords. */
  const densidad = densidadDeComas(texto);
  if (densidad > UMBRAL_COMAS) {
    advertencias.push({
      regla: "estilo-keywords",
      severidad: "aviso",
      detalle: `Densidad de comas ${densidad.toFixed(2)} por palabra: el prompt se está leyendo como una lista de keywords.`,
      sugerencia: "Únelo en frases completas. La prosa narrativa rinde mejor en Gemini.",
    });
  }

  /* 4 · Bloque de paleta con hex al inicio. Bloquea si falta. */
  const tieneEtiquetaPaleta = texto.includes(ETIQUETA_PALETA);
  const tieneHex = /#[0-9a-f]{6}\b/i.test(texto);
  if (!tieneEtiquetaPaleta || !tieneHex) {
    advertencias.push({
      regla: "sin-bloque-paleta",
      severidad: "bloqueo",
      detalle:
        "Falta el bloque de paleta con los hex al inicio. Sin él, el modelo inventa el color y la campaña pierde identidad.",
      sugerencia: `Empieza el prompt con una línea ${ETIQUETA_PALETA} y los cinco hex.`,
    });
  }

  /* 5 · Bloque de iluminación presente. Advierte si falta. */
  if (!texto.includes(ETIQUETA_ILUMINACION)) {
    advertencias.push({
      regla: "sin-bloque-iluminacion",
      severidad: "aviso",
      detalle:
        "Falta el bloque de iluminación. Sin él la pieza sale con luz plana de catálogo.",
      sugerencia: `Añade una línea ${ETIQUETA_ILUMINACION} con luz clave, relleno y contorno.`,
    });
  }

  /* 6 · Longitud entre 150 y 350 palabras. */
  const palabras = contarPalabras(texto);
  if (palabras < MIN_PALABRAS || palabras > MAX_PALABRAS) {
    advertencias.push({
      regla: "longitud",
      severidad: "aviso",
      detalle:
        palabras < MIN_PALABRAS
          ? `${palabras} palabras: por debajo de ${MIN_PALABRAS} el modelo rellena los huecos por su cuenta.`
          : `${palabras} palabras: por encima de ${MAX_PALABRAS} el modelo empieza a descartar instrucciones del final.`,
      sugerencia: `Rango objetivo: ${MIN_PALABRAS}–${MAX_PALABRAS} palabras.`,
    });
  }

  return advertencias;
}

function escapar(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 7 · Cierre con la línea de configuración: se añade automáticamente. */
export function asegurarCierre(texto: string): string {
  const limpio = texto.trimEnd();
  if (limpio.includes("FORMATO:")) return limpio;
  return `${limpio}\n\n${LINEA_CIERRE}`;
}

/** Empaqueta un texto crudo en un Prompt validado y listo para guardar. */
export function construirPrompt(
  tipologia: TipologiaSeccion,
  textoCrudo: string,
  requiereImagenReferencia: boolean,
  id: string,
): Prompt {
  const texto = asegurarCierre(textoCrudo);
  return {
    id,
    tipologia,
    texto,
    palabras: contarPalabras(texto),
    advertencias: validarPrompt(texto),
    requiereImagenReferencia,
    creadoEn: new Date().toISOString(),
  };
}

/** Recalcula palabras y advertencias tras una edición manual del usuario. */
export function revalidar(prompt: Prompt, textoNuevo: string): Prompt {
  return {
    ...prompt,
    texto: textoNuevo,
    palabras: contarPalabras(textoNuevo),
    advertencias: validarPrompt(textoNuevo),
  };
}

export function tieneBloqueo(prompt: Prompt): boolean {
  return prompt.advertencias.some((a) => a.severidad === "bloqueo");
}
