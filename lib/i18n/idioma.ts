/**
 * Idioma — la cuarta preferencia de accesibilidad.
 *
 * Leer en tu lengua es una condición de acceso tan real como el tamaño del
 * texto: quien no lee español no puede usar esta página por mucho contraste
 * que tenga. Por eso el interruptor vive en el panel de accesibilidad y no en
 * una banderita de la barra.
 *
 * POR QUÉ COOKIE Y NO localStorage. Las otras preferencias son puramente
 * visuales: el CSS reacciona a un `data-` en el <html> y el servidor nunca se
 * entera. El idioma no puede funcionar así, porque casi toda la página se
 * renderiza en el servidor y el servidor no ve `localStorage`. Una cookie la
 * leen los dos lados, así que el HTML llega ya traducido y no hay un parpadeo
 * en español antes de que hidrate React.
 *
 * POR QUÉ LA CLAVE ES LA FRASE EN ESPAÑOL. El diccionario se indexa por el
 * texto original en vez de por claves inventadas (`home.hero.titulo`). Dos
 * razones: el componente sigue leyéndose en español, que es como está escrita
 * toda esta base de código, y una traducción que falta degrada a español en
 * vez de enseñar un identificador roto al visitante.
 */

export const IDIOMAS = ["es", "en"] as const;
export type Idioma = (typeof IDIOMAS)[number];

export const IDIOMA_POR_DEFECTO: Idioma = "es";

/** La lee el servidor con `cookies()` y la escribe el panel con `document.cookie`. */
export const COOKIE_IDIOMA = "lf_idioma";

export function esIdioma(valor: unknown): valor is Idioma {
  return typeof valor === "string" && (IDIOMAS as readonly string[]).includes(valor);
}

/**
 * El traductor lleva encima su idioma. Las fechas y los números no se traducen
 * con el diccionario sino con `Intl`, y necesitan el locale: colgarlo aquí
 * evita pasar un segundo parámetro por las veinticinco llamadas que lo piden.
 */
export type Traductor = ((es: string, vars?: Record<string, string | number>) => string) & {
  idioma: Idioma;
};

/**
 * Construye el traductor de un idioma.
 *
 * Los huecos van como `{nombre}` para que la frase se traduzca entera y el
 * orden de las piezas pueda cambiar: en inglés el adjetivo se adelanta, en
 * español la cifra a veces se pospone, y una frase partida en trozos
 * concatenados no deja hacer ninguna de las dos cosas.
 */
export function crearTraductor(idioma: Idioma, diccionario: Record<string, string>): Traductor {
  const t = (es: string, vars?: Record<string, string | number>) => {
    const base = idioma === "es" ? es : (diccionario[es] ?? es);
    if (!vars) return base;
    return base.replace(/\{(\w+)\}/g, (coincidencia, clave: string) =>
      clave in vars ? String(vars[clave]) : coincidencia,
    );
  };
  return Object.assign(t, { idioma });
}
