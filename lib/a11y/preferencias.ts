"use client";

import { useCallback, useSyncExternalStore } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Preferencias de accesibilidad — la capa que el visitante controla.
 *
 * El sistema de diseño ya cumple los pisos de contraste, foco visible y
 * `prefers-reduced-motion`. Eso es el suelo, no el techo: hay gente que
 * necesita el texto más grande sin hacer zoom a toda la página, gente a la que
 * el didone de alto contraste le cuesta leer, gente que quiere la página
 * quieta sin cambiar un ajuste del sistema operativo, y gente que solo
 * distingue un enlace si está subrayado. Nada de eso lo puede adivinar el CSS.
 *
 * Cómo se aplica: cada preferencia se escribe como `data-<clave>` en el <html>
 * y el CSS reacciona. Por eso el bucle de `aplicar` es genérico y el script
 * que corre antes de pintar (en `app/layout.tsx`) es el mismo bucle en una
 * línea: si mañana se añade una preferencia, los dos lados se enteran solos y
 * no hay forma de que se desincronicen. Y por eso lo visual no parpadea:
 * cuando React hidrata, los atributos ya estaban puestos.
 *
 * No hay proveedor ni efecto de montaje. `localStorage` ya ES el estado, así
 * que se lee con `useSyncExternalStore` —igual que `medios.ts` hace con
 * matchMedia—: sin setState dentro de un efecto, sin renders en cascada, y con
 * sincronía entre pestañas de regalo por el evento `storage`.
 */

export interface Preferencias {
  /** El estudio oscuro es la identidad; el papel claro y el sistema son opciones. */
  tema: "oscuro" | "claro" | "sistema";
  texto: "normal" | "grande" | "enorme";
  movimiento: "sistema" | "reducido";
  /** Sans en vez de didone, más interlínea, medida más corta, fondos fuera. */
  lectura: boolean;
  contraste: boolean;
  /** Subrayar todos los enlaces: WCAG 1.4.1, no confiar solo en el color. */
  enlaces: boolean;
}

export const POR_DEFECTO: Preferencias = {
  tema: "oscuro",
  texto: "normal",
  movimiento: "sistema",
  lectura: false,
  contraste: false,
  enlaces: false,
};

export const CLAVE_ALMACEN = "lf_a11y";

/** El mismo bucle que corre inline antes del primer pintado. */
export function aplicar(p: Preferencias): void {
  const raiz = document.documentElement;
  for (const [clave, valor] of Object.entries(p)) {
    raiz.setAttribute(`data-${clave}`, String(valor));
  }
}

/* `getSnapshot` tiene que devolver SIEMPRE la misma referencia mientras nada
   cambie: si parsease el JSON en cada llamada, React vería un objeto nuevo cada
   vez y entraría en un bucle de renders. De ahí esta caché de un solo hueco. */
let cache: Preferencias | null = null;
const oyentes = new Set<() => void>();

function instantanea(): Preferencias {
  if (cache) return cache;
  try {
    const bruto = localStorage.getItem(CLAVE_ALMACEN);
    /* Se fusiona contra los valores por defecto en vez de confiar en lo
       guardado: una versión anterior pudo guardar menos claves, y un objeto a
       medias dejaría preferencias sin definir. */
    cache = bruto
      ? { ...POR_DEFECTO, ...(JSON.parse(bruto) as Partial<Preferencias>) }
      : POR_DEFECTO;
  } catch {
    cache = POR_DEFECTO;
  }
  return cache;
}

const instantaneaServidor = (): Preferencias => POR_DEFECTO;

function suscribir(avisar: () => void): () => void {
  oyentes.add(avisar);
  /* Otra pestaña del mismo sitio cambió las preferencias: esta se entera y se
     pone al día sin recargar. */
  const alAlmacenar = (e: StorageEvent) => {
    if (e.key !== CLAVE_ALMACEN) return;
    cache = null;
    const p = instantanea();
    aplicar(p);
    oyentes.forEach((o) => o());
  };
  window.addEventListener("storage", alAlmacenar);
  return () => {
    oyentes.delete(avisar);
    window.removeEventListener("storage", alAlmacenar);
  };
}

export function usePreferencias() {
  const preferencias = useSyncExternalStore(suscribir, instantanea, instantaneaServidor);

  const cambiar = useCallback((parcial: Partial<Preferencias>) => {
    const siguientes = { ...instantanea(), ...parcial };
    cache = siguientes;
    try {
      localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(siguientes));
    } catch {
      /* Navegación privada con almacenamiento bloqueado: la preferencia vale
         para esta sesión y no se guarda. Mejor eso que romper. */
    }
    aplicar(siguientes);
    oyentes.forEach((o) => o());
  }, []);

  const restablecer = useCallback(() => cambiar(POR_DEFECTO), [cambiar]);

  return { preferencias, cambiar, restablecer };
}

/**
 * El interruptor de movimiento del producto.
 *
 * `useReducedMotion` de Motion lee EXCLUSIVAMENTE el media query del sistema:
 * ni `MotionConfig` ni un ajuste propio lo alcanzan. Así que todo componente
 * con coreografía llama a esto en su lugar, y aquí se unen las tres fuentes.
 * Ramificar solo en un componente dejaría el resto de la página en movimiento,
 * que es exactamente el fallo que el ajuste pretende evitar.
 *
 * El modo lectura implica movimiento reducido: quien viene a leer no quiere
 * que el texto se le mueva mientras lo hace.
 */
export function useMovimientoReducido(): boolean {
  const sistema = useReducedMotion();
  const { preferencias } = usePreferencias();
  return (
    preferencias.movimiento === "reducido" || preferencias.lectura || Boolean(sistema)
  );
}
