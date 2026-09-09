/**
 * EL FILM · el motor de la portada.
 *
 * Sustituye al vuelo de cámara en WebGL. La idea es la misma —el scroll
 * conduce la imagen, no el reloj— pero el sujeto ya no es geometría
 * construida en tiempo real sino un film de producto rodado aparte y servido
 * como secuencia de fotogramas.
 *
 * Por qué fotogramas sueltos y no un `<video>` con `currentTime`:
 * buscar dentro de un H.264 salta al fotograma clave más cercano, y con
 * claves cada uno o dos segundos arrastrar el scroll produce tirones y una
 * imagen que se queda atrás. Una imagen por posición siempre tiene
 * exactamente el fotograma que toca. Los genera
 * `scripts/extraer-fotogramas.mjs`.
 *
 * Tres cosas que este motor mantiene del anterior, porque no eran del motor
 * sino de la página:
 *
 *   · El bucle NO toca React ni una vez por frame. Lee `window.scrollY`,
 *     dibuja, y escribe opacidades directo en el estilo de los nodos.
 *   · Con la sección fuera de pantalla el bucle se apaga del todo.
 *   · La copia de cada escena entra, se sostiene y sale con el mismo umbral
 *     único para ratón, teclado y lector de pantalla.
 */

import { ESCENAS, TRAMOS } from "@/lib/mundo/escenas";
import { RITMO } from "@/components/mundo/ritmo";

/**
 * Cuántos fotogramas tiene la secuencia.
 *
 * Es la fuente de verdad: `scripts/extraer-fotogramas.mjs` lee ESTE número
 * para saber cuántos generar, así que no pueden desincronizarse.
 *
 * 240 sobre 10,6 pantallas de recorrido son unos 36px de scroll por
 * fotograma. Con 120 eran 72 y se veía a saltos incluso con fundido.
 */
export const TOTAL_FOTOGRAMAS = 240;
const RUTA = (i: number) => `/film/${String(i).padStart(3, "0")}.jpg`;

/** Fracción del tramo que la escena pasa en reposo antes de dar paso. */
const REPOSO = 0.56;

const limitar = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
const suave = (k: number) => k * k * (3 - 2 * k);
const rampa = (v: number, a: number, b: number) => suave(limitar((v - a) / (b - a)));

/**
 * Carga progresiva.
 *
 * Primero el fotograma 0 —hasta que esté, no hay nada que enseñar—, después
 * uno de cada ocho para que arrastrar rápido ya tenga imagen aunque sea
 * salteada, y por último el resto. Así la portada es utilizable con el 12% de
 * los bytes descargados en vez de esperar a los 2,4 MB completos.
 */
function cargar(
  alLlegarUno: () => void,
): { imagenes: (HTMLImageElement | null)[]; cancelar: () => void } {
  const imagenes: (HTMLImageElement | null)[] = new Array(TOTAL_FOTOGRAMAS).fill(null);
  let vivo = true;

  const pedir = (i: number) =>
    new Promise<void>((resolver) => {
      if (!vivo || imagenes[i]) return resolver();
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (vivo) {
          imagenes[i] = img;
          alLlegarUno();
        }
        resolver();
      };
      /* Un fotograma que no llega no puede romper la secuencia: se queda a
         null y `dibujar` usa el anterior disponible. */
      img.onerror = () => resolver();
      img.src = RUTA(i);
    });

  (async () => {
    await pedir(0);
    const salteados = [];
    for (let i = 8; i < TOTAL_FOTOGRAMAS; i += 8) salteados.push(i);
    await Promise.all(salteados.map(pedir));
    for (let i = 1; i < TOTAL_FOTOGRAMAS && vivo; i++) {
      if (!imagenes[i]) await pedir(i);
    }
  })();

  return {
    imagenes,
    cancelar: () => {
      vivo = false;
    },
  };
}

/**
 * De progreso de scroll a posición en el film.
 *
 * No es una regla de tres. `RITMO` reparte el recorrido por CAMBIO VISUAL:
 * donde el film se mueve mucho le toca mucho scroll, y donde está quieto se
 * pasa rápido. Repartir a partes iguales por fotograma era exactamente lo que
 * hacía que no se viera fluido —la ráfaga del primer 10% pasaba en trescientos
 * píxeles y los tramos quietos se arrastraban miles—, porque el ojo no lee
 * fluidez como «tiempo constante» sino como «velocidad constante».
 *
 * Búsqueda binaria sobre la curva y luego interpolación dentro del intervalo,
 * así que devuelve una posición fraccionaria y el fundido sigue siendo
 * continuo.
 */
function fotogramaEn(g: number): number {
  if (RITMO.length < 2) return g * (TOTAL_FOTOGRAMAS - 1);

  let lo = 0;
  let hi = RITMO.length - 1;
  while (hi - lo > 1) {
    const medio = (lo + hi) >> 1;
    if (RITMO[medio] <= g) lo = medio;
    else hi = medio;
  }
  const tramo = RITMO[hi] - RITMO[lo];
  const dentro = tramo > 0 ? (g - RITMO[lo]) / tramo : 0;
  return Math.min(TOTAL_FOTOGRAMAS - 1, lo + limitar(dentro));
}

export function montarFilm(
  canvas: HTMLCanvasElement,
  host: HTMLElement,
  copias: (HTMLDivElement | null)[],
  marcas: (HTMLLIElement | null)[],
): () => void {
  const ctx2d = canvas.getContext("2d", { alpha: false });
  if (!ctx2d) return () => {};
  /* Constante local: el early-return ya lo descarta como null, pero TypeScript
     no propaga esa garantía dentro de las clausuras del bucle. */
  const ctx = ctx2d;

  const { imagenes, cancelar } = cargar(() => {
    /* Cada fotograma que llega puede ser el que toca ahora mismo. */
    pendiente = true;
  });

  let cima = 0;
  let alto = 1;
  let visible = true;
  let pendiente = true;
  let ultimo = -1;
  let raf = 0;
  let anterior = -1;
  let dpr = 1;

  function medir() {
    const caja = host.getBoundingClientRect();
    cima = caja.top + window.scrollY;
    alto = Math.max(1, host.offsetHeight - window.innerHeight);

    /* Se topa en 2: por encima no se distingue y se cuadruplican los píxeles
       que hay que pintar en cada frame. */
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    pendiente = true;
  }

  /** El fotograma más cercano que ya esté cargado, hacia atrás y luego hacia delante. */
  function disponible(i: number): HTMLImageElement | null {
    if (imagenes[i]) return imagenes[i];
    for (let d = 1; d < TOTAL_FOTOGRAMAS; d++) {
      if (i - d >= 0 && imagenes[i - d]) return imagenes[i - d];
      if (i + d < TOTAL_FOTOGRAMAS && imagenes[i + d]) return imagenes[i + d];
    }
    return null;
  }

  /** Coloca un fotograma a sangre en el lienzo, con el sujeto a la derecha. */
  function encuadrar(img: HTMLImageElement) {
    const cw = canvas.width;
    const ch = canvas.height;
    const anchoCss = canvas.clientWidth;

    const escala = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const w = img.naturalWidth * escala;
    const h = img.naturalHeight * escala;

    /* El sesgo horizontal lo hereda del motor de geometría, que ya movía la
       cámara con `encuadre = 0.2` en pantallas anchas por la misma razón: la
       copia ocupa la mitad izquierda, así que el sujeto tiene que caer en la
       derecha. En vertical no hay mitad que respetar y se queda centrado. */
    const sesgo = anchoCss >= 1024 ? 0.16 : anchoCss >= 700 ? 0.34 : 0.5;
    ctx.drawImage(img, (cw - w) * sesgo, (ch - h) / 2, w, h);
  }

  /**
   * Dibuja una posición CONTINUA del film, no un índice entero.
   *
   * Es la corrección que hacía falta. El recorrido son 10,6 pantallas: unos
   * 8.600px de scroll para 120 fotogramas, o sea **72px por fotograma**. Con
   * saltos secos eso no se lee como película sino como pase de diapositivas:
   * arrastras un dedo entero y la imagen cambia una vez.
   *
   * Aquí se dibuja el fotograma entero y encima el siguiente con la opacidad
   * de la parte fraccionaria, así que entre uno y otro hay un fundido continuo
   * en vez de un escalón. No cuesta ni un byte más de descarga —son las
   * mismas imágenes— y son dos `drawImage` por frame, que a esta resolución
   * no se nota.
   *
   * Efecto secundario deseado: el film son cuatro tomas con CORTES DUROS
   * entre ellas. Sin mezcla, un corte a mitad de scroll se lee como fallo.
   * Con mezcla se convierte en un encadenado, que es una transición de cine.
   */
  function dibujar(posicion: number) {
    const base = Math.floor(posicion);
    const mezcla = posicion - base;

    const a = disponible(base);
    if (!a) return;

    ctx.fillStyle = "#0A0B0D";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalAlpha = 1;
    encuadrar(a);

    if (mezcla > 0.001 && base + 1 < TOTAL_FOTOGRAMAS) {
      const b = imagenes[base + 1];
      /* Solo se mezcla con el siguiente si YA está cargado. Con el vecino
         aproximado de `disponible` se mezclarían dos fotogramas lejanos y
         saldría un fantasma. */
      if (b) {
        ctx.globalAlpha = mezcla;
        encuadrar(b);
        ctx.globalAlpha = 1;
      }
    }
  }

  function pintar() {
    raf = requestAnimationFrame(pintar);
    if (!visible) return;

    const g = limitar((window.scrollY - cima) / alto);
    const posicion = fotogramaEn(g);

    /* Se redibuja cuando la posición se mueve más de una centésima de
       fotograma: suficiente para que el fundido se vea continuo y suficiente
       para no repintar cuando el scroll está quieto. */
    if (Math.abs(posicion - ultimo) > 0.01 || pendiente) {
      dibujar(posicion);
      ultimo = posicion;
      pendiente = false;
    }

    /* Qué escena manda. Idéntico al motor anterior: la copia es de la página,
       no del motor, y por eso sobrevive al cambio. */
    let activa = 0;
    while (activa < TRAMOS.length - 1 && g > TRAMOS[activa][1]) activa++;

    for (let i = 0; i < copias.length; i++) {
      const nodo = copias[i];
      if (!nodo) continue;
      const [ini, fin] = TRAMOS[i];
      const local = (g - ini) / (fin - ini);
      const ultima = i === ESCENAS.length - 1;
      const primera = i === 0;

      /* La primera no entra con rampa: ya se está en ella. Con rampa, en
         scroll 0 su opacidad sería exactamente 0 y la portada abriría sin una
         sola palabra. */
      const entrada = primera ? 1 : rampa(local, 0.02, 0.2);
      const op = ultima ? entrada : entrada * (1 - rampa(local, REPOSO - 0.06, REPOSO + 0.1));
      nodo.style.opacity = String(op);
      nodo.style.transform = `translateY(${(1 - op) * 18}px)`;

      /* Un solo umbral para ratón, teclado y lector de pantalla: si no se
         puede clicar, tampoco se puede tabular ni anunciar. */
      const interactiva = op > 0.55;
      nodo.style.pointerEvents = interactiva ? "auto" : "none";
      nodo.setAttribute("aria-hidden", interactiva ? "false" : "true");
      if (interactiva) nodo.removeAttribute("inert");
      else nodo.setAttribute("inert", "");
    }

    if (activa !== anterior) {
      for (let i = 0; i < marcas.length; i++) {
        const m = marcas[i];
        if (m) m.style.opacity = i === activa ? "1" : "0.32";
      }
      anterior = activa;
    }
  }

  medir();

  /* El lienzo se revela cuando hay primer fotograma, no antes: si no, se ve
     un rectángulo negro aparecer sobre el fondo y luego llenarse. */
  const revelar = () => {
    if (imagenes[0]) {
      dibujar(0);
      canvas.style.opacity = "1";
    } else {
      window.setTimeout(revelar, 60);
    }
  };
  revelar();

  const observador = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
    },
    { rootMargin: "120px" },
  );
  observador.observe(host);

  let remedir = 0;
  const alRedimensionar = () => {
    window.clearTimeout(remedir);
    remedir = window.setTimeout(medir, 120);
  };
  window.addEventListener("resize", alRedimensionar);
  window.addEventListener("orientationchange", alRedimensionar);

  raf = requestAnimationFrame(pintar);

  return () => {
    cancelAnimationFrame(raf);
    cancelar();
    observador.disconnect();
    window.removeEventListener("resize", alRedimensionar);
    window.removeEventListener("orientationchange", alRedimensionar);
    window.clearTimeout(remedir);
  };
}
