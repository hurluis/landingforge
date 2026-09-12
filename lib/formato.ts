import type { Mercado } from "@/lib/metodologia/mercados";

/**
 * Formato — el detalle pequeño que demuestra conocimiento del mercado.
 * Cada país escribe su precio a su manera: $99.900 en Bogotá, $99,900 en
 * Ciudad de México, 39,90 € en Madrid. El error de separador delata que la
 * pieza no es de allí.
 */

/**
 * Los planes se cobran en dólares, que es la moneda de las APIs que hay
 * debajo y la que entiende un comprador de cualquier país. `centavos` evita
 * arrastrar decimales flotantes: 2900 → «US$29».
 */
const FORMATO_USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatoUSD(centavos: number): string {
  return `US${FORMATO_USD.format(Math.round(centavos) / 100)}`;
}

const formatos = new Map<string, Intl.NumberFormat>();

/**
 * Precio de un producto en su mercado. `valor` va en la unidad mínima de la
 * moneda: 99900 pesos, o 3999 céntimos para $39.99.
 */
export function formatoPrecio(valor: number, m: Mercado): string {
  let f = formatos.get(m.id);
  if (!f) {
    f = new Intl.NumberFormat(m.locale, {
      style: "currency",
      currency: m.moneda,
      minimumFractionDigits: m.decimales,
      maximumFractionDigits: m.decimales,
    });
    formatos.set(m.id, f);
  }
  /* «$ 99.900» → «$99.900». Solo el dólar pegado: «S/ 89.90» y «39,90 €»
     llevan el espacio por convención. */
  return f.format(Math.round(valor) / 10 ** m.decimales).replace(/\$\s/, "$");
}

/** Máscara en vivo del campo de precio: deja solo dígitos y formatea. */
export function mascaraPrecio(entrada: string, m: Mercado): { texto: string; valor: number } {
  const digitos = entrada.replace(/\D/g, "").slice(0, 12);
  if (digitos === "") return { texto: "", valor: 0 };
  const valor = Number(digitos);
  return { texto: formatoPrecio(valor, m), valor };
}

export function contarCaracteres(texto: string): number {
  return [...texto.trim()].length;
}

export function contarPalabras(texto: string): number {
  const limpio = texto.trim();
  if (limpio === "") return 0;
  return limpio.split(/\s+/).length;
}

/**
 * Las fechas y los números de la interfaz siguen al idioma elegido, no al
 * mercado del producto: «12 de octubre de 2026» junto a un texto en inglés se
 * lee como un descuido. El precio del producto es otra cosa y sigue mandando
 * su mercado —eso es `formatoPrecio`, más abajo—.
 *
 * Se cachean por locale: construir un `Intl.DateTimeFormat` no es gratis y
 * estas funciones se llaman una vez por fila de tabla.
 */
const LOCALES: Record<string, string> = { es: "es-CO", en: "en-US" };
const cacheFechas = new Map<string, Intl.DateTimeFormat>();

function formateador(locale: string, opciones: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const clave = locale + JSON.stringify(opciones);
  let f = cacheFechas.get(clave);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, opciones);
    cacheFechas.set(clave, f);
  }
  return f;
}

export function fechaLarga(iso: string, idioma = "es"): string {
  return formateador(LOCALES[idioma] ?? LOCALES.es, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function fechaCorta(iso: string, idioma = "es"): string {
  return formateador(LOCALES[idioma] ?? LOCALES.es, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** "3.412 campañas", con separador de miles. Números creíbles, no redondeados (§3.3). */
export function numero(valor: number, idioma = "es"): string {
  return new Intl.NumberFormat(LOCALES[idioma] ?? LOCALES.es).format(valor);
}

export function plural(n: number, singular: string, pluralForma: string): string {
  return n === 1 ? singular : pluralForma;
}

/** 1536 → "1,5 KB". Para el peso de la base de datos en el panel. */
export function pesoArchivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const unidades = ["KB", "MB", "GB"];
  let valor = bytes / 1024;
  let i = 0;
  while (valor >= 1024 && i < unidades.length - 1) {
    valor /= 1024;
    i++;
  }
  return `${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 1 }).format(valor)} ${unidades[i]}`;
}

/** "hace 3 días" — para la última actividad, donde la fecha exacta estorba. */
export function fechaRelativa(iso: string, idioma = "es"): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutos = Math.round(ms / 60000);
  const en = idioma === "en";
  if (minutos < 1) return en ? "just now" : "hace un momento";
  if (minutos < 60) return en ? `${minutos} min ago` : `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return en ? `${horas} h ago` : `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias < 30) {
    return en
      ? `${dias} ${plural(dias, "day", "days")} ago`
      : `hace ${dias} ${plural(dias, "día", "días")}`;
  }
  return fechaCorta(iso, idioma);
}
