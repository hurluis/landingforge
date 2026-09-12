"use client";

import { createContext, useContext, useMemo } from "react";
import { COOKIE_IDIOMA, IDIOMA_POR_DEFECTO, crearTraductor } from "@/lib/i18n/idioma";
import type { Idioma, Traductor } from "@/lib/i18n/idioma";
import { EN } from "@/lib/i18n/en";

/**
 * El idioma para los componentes de cliente.
 *
 * Lo decide el servidor al leer la cookie y baja por contexto, así que cliente
 * y servidor pintan siempre la misma lengua y no hay desajuste de hidratación.
 */
const Contexto = createContext<Idioma>(IDIOMA_POR_DEFECTO);

export function ProveedorIdioma({
  idioma,
  children,
}: {
  idioma: Idioma;
  children: React.ReactNode;
}) {
  return <Contexto.Provider value={idioma}>{children}</Contexto.Provider>;
}

export function useIdioma(): Idioma {
  return useContext(Contexto);
}

export function useT(): Traductor {
  const idioma = useIdioma();
  return useMemo(() => crearTraductor(idioma, EN), [idioma]);
}

/**
 * Cambia el idioma. Escribe la cookie —que es lo que lee el servidor— y deja
 * que quien llama refresque: el HTML se vuelve a pedir ya traducido.
 *
 * `max-age` de un año y `path=/` para que valga en toda la página; `SameSite=Lax`
 * porque no hay ningún motivo para mandarla en peticiones de terceros.
 */
export function guardarIdioma(idioma: Idioma): void {
  document.cookie = `${COOKIE_IDIOMA}=${idioma}; path=/; max-age=31536000; SameSite=Lax`;
}
