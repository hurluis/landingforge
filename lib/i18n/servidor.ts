import "server-only";

import { cookies } from "next/headers";
import { COOKIE_IDIOMA, IDIOMA_POR_DEFECTO, crearTraductor, esIdioma } from "@/lib/i18n/idioma";
import type { Idioma, Traductor } from "@/lib/i18n/idioma";
import { EN } from "@/lib/i18n/en";

/** El idioma de esta petición. Sin cookie, español. */
export async function idiomaActual(): Promise<Idioma> {
  const valor = (await cookies()).get(COOKIE_IDIOMA)?.value;
  return esIdioma(valor) ? valor : IDIOMA_POR_DEFECTO;
}

/** El traductor de esta petición, para componentes de servidor. */
export async function traductor(): Promise<Traductor> {
  return crearTraductor(await idiomaActual(), EN);
}
