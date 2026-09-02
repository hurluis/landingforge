/**
 * Formato — el detalle pequeño que demuestra conocimiento del mercado.
 * $99.900 con punto de miles, nunca $99,900 con coma (§6.2.5, punto 4).
 */

const FORMATO_COP = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/** 99900 → "$99.900" */
export function formatoCOP(valor: number): string {
  return FORMATO_COP.format(Math.round(valor)).replace(/\s/g, "");
}

/** Máscara en vivo del campo de precio: deja solo dígitos y formatea. */
export function mascaraCOP(entrada: string): { texto: string; valor: number } {
  const digitos = entrada.replace(/\D/g, "").slice(0, 12);
  if (digitos === "") return { texto: "", valor: 0 };
  const valor = Number(digitos);
  return { texto: formatoCOP(valor), valor };
}

export function contarCaracteres(texto: string): number {
  return [...texto.trim()].length;
}

export function contarPalabras(texto: string): number {
  const limpio = texto.trim();
  if (limpio === "") return 0;
  return limpio.split(/\s+/).length;
}

const FORMATO_FECHA = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function fechaLarga(iso: string): string {
  return FORMATO_FECHA.format(new Date(iso));
}

const FORMATO_FECHA_CORTA = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function fechaCorta(iso: string): string {
  return FORMATO_FECHA_CORTA.format(new Date(iso));
}

/** "3.412 campañas", con punto de miles. Números creíbles, no redondeados (§3.3). */
export function numero(valor: number): string {
  return new Intl.NumberFormat("es-CO").format(valor);
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
export function fechaRelativa(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutos = Math.round(ms / 60000);
  if (minutos < 1) return "hace un momento";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias < 30) return `hace ${dias} ${plural(dias, "día", "días")}`;
  return fechaCorta(iso);
}
