import { COMUN } from "@/lib/i18n/en/comun";
import { PUBLICO } from "@/lib/i18n/en/publico";
import { PRODUCTO } from "@/lib/i18n/en/producto";
import { ADMIN } from "@/lib/i18n/en/admin";
import { METODOLOGIA } from "@/lib/i18n/en/metodologia";
import { LEGAL } from "@/lib/i18n/en/legal";

/**
 * El inglés de la página, en un solo objeto indexado por la frase española.
 *
 * Está partido por superficie para que cada archivo se pueda leer entero y
 * revisar de una sentada, no porque el programa necesite la división.
 *
 * NO ES UNA TRADUCCIÓN LITERAL. La página vende en inglés a un público que no
 * es el mismo, así que las frases se reescriben para que suenen nativas: se
 * cambian las metáforas que no viajan, se acortan las que en inglés sonarían
 * pomposas y se respetan las convenciones de puntuación y mayúsculas del
 * idioma. Lo que se conserva intacto es el argumento de venta y el tono.
 */
export const EN: Record<string, string> = {
  ...COMUN,
  ...PUBLICO,
  ...PRODUCTO,
  ...ADMIN,
  ...METODOLOGIA,
  ...LEGAL,
};
