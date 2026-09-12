"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { PersonArmsSpread, ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { Dialogo, DialogoDisparador, DialogoContenido } from "@/components/ui/dialogo";
import { Boton } from "@/components/ui/boton";
import { usePreferencias, type Preferencias } from "@/lib/a11y/preferencias";
import { guardarIdioma, useIdioma, useT } from "@/lib/i18n/cliente";
import type { Idioma, Traductor } from "@/lib/i18n/idioma";
import { cn } from "@/lib/utils";

/**
 * Panel de accesibilidad y guía.
 *
 * Dos decisiones que sostienen todo lo demás:
 *
 *   Los controles son radios y casillas NATIVOS, no botones con `role`, y se
 *   dejan además con su ASPECTO nativo teñido por `accent-color`. Un grupo de
 *   radios trae de fábrica lo que reimplementar cuesta y casi nadie termina de
 *   hacer bien: navegación con flechas, salto de grupo con Tab, anuncio de
 *   «opción 2 de 3» en el lector de pantalla, y el estado marcado correcto en
 *   el modo de alto contraste del sistema operativo. La primera versión sí los
 *   dibujaba a mano y costó exactamente eso: `cn` descartaba el color de
 *   relleno por chocar con la imagen de la palomita, la palomita no llegaba a
 *   generarse, y la casilla marcada acabó indistinguible de la vacía salvo por
 *   un borde de un píxel. Un control de accesibilidad cuyo estado no se ve es
 *   peor que no tenerlo.
 *
 *   El disparador va abajo a la IZQUIERDA. El asistente ya ocupa la derecha, y
 *   dos burbujas flotantes solapadas en móvil convierten una ayuda en un
 *   estorbo.
 *
 * El idioma va ARRIBA DEL TODO y sus dos opciones se nombran cada una en su
 * propia lengua —«Español», «English»—, nunca traducidas. Quien no entiende la
 * página tiene que poder reconocer su idioma en la lista sin leer el resto, y
 * es además la convención de cualquier selector de idioma serio.
 *
 * La guía va en <details> nativos: se abren con teclado, el buscador del
 * navegador encuentra su texto aunque estén cerrados, y no cuestan una línea
 * de JavaScript.
 */

/* Las etiquetas se construyen con el traductor en mano, así que son funciones
   y no constantes de módulo: una constante se evaluaría una sola vez, en el
   idioma que tocara entonces. */
const idiomas = (): { valor: Idioma; etiqueta: string; pista: string }[] => [
  { valor: "es", etiqueta: "Español", pista: "La página en español." },
  { valor: "en", etiqueta: "English", pista: "The site in English." },
];

const temas = (t: Traductor): { valor: Preferencias["tema"]; etiqueta: string; pista: string }[] => [
  { valor: "oscuro", etiqueta: t("Estudio"), pista: t("Oscuro. Como se miran las imágenes.") },
  { valor: "claro", etiqueta: t("Papel"), pista: t("Claro. Como se entrega el trabajo.") },
  { valor: "sistema", etiqueta: t("Del sistema"), pista: t("Sigue el ajuste de tu equipo.") },
];

const textos = (t: Traductor): { valor: Preferencias["texto"]; etiqueta: string; pista: string }[] => [
  { valor: "normal", etiqueta: t("Normal"), pista: "16 px" },
  { valor: "grande", etiqueta: t("Grande"), pista: "18 px" },
  { valor: "enorme", etiqueta: t("Enorme"), pista: "20 px" },
];

const movimientos = (
  t: Traductor,
): { valor: Preferencias["movimiento"]; etiqueta: string; pista: string }[] => [
  { valor: "sistema", etiqueta: t("Como el sistema"), pista: t("Respeta tu ajuste de movimiento.") },
  {
    valor: "reducido",
    etiqueta: t("Reducido"),
    pista: t("Sin scroll coreografiado ni fondos animados."),
  },
];

const pasos = (t: Traductor) => [
  {
    titulo: t("1 · Crea tu cuenta"),
    texto: t(
      "Correo y contraseña, sin tarjeta. Entras con 5 créditos de bienvenida, suficientes para una campaña de prueba completa.",
    ),
    donde: "/entrar",
  },
  {
    titulo: t("2 · Describe tu producto"),
    texto: t(
      "Cuatro preguntas: qué es, para quién, cuál es el beneficio principal y cuánto cuesta. Puedes subir la foto del producto.",
    ),
    donde: "/app/nueva",
  },
  {
    titulo: t("3 · Revisa la paleta antes de gastar nada"),
    texto: t(
      "La matriz cruza tipo de producto, audiencia y registro emocional, y te propone una paleta con sus hex y el motivo. Si no te convence, la cambias.",
    ),
    donde: "/metodologia",
  },
  {
    titulo: t("4 · Recibe las nueve secciones"),
    texto: t(
      "Los prompts se construyen en prosa narrativa y pasan por el validador: límite de caracteres, palabras prohibidas, bloque de paleta e iluminación.",
    ),
    donde: "/app",
  },
  {
    titulo: t("5 · Edita, versiona y llévatelo"),
    texto: t(
      "Cada prompt se puede reescribir y volver a correr. Si dejas de usar LandingForge, los prompts siguen siendo tuyos.",
    ),
    donde: "/app",
  },
];

const atajos = (t: Traductor) => [
  ["Tab", t("Avanza por los controles. El foco siempre se ve: contorno azul de temple.")],
  ["Esc", t("Cierra este panel, el asistente y cualquier diálogo.")],
  ["← →", t("En la tira de las nueve secciones, salta de sección.")],
  ["Inicio / Fin", t("En esa misma tira, va a la primera o a la última.")],
];

export function PanelAccesibilidad() {
  const { preferencias, cambiar, restablecer } = usePreferencias();
  const idioma = useIdioma();
  const t = useT();
  const router = useRouter();

  /* El idioma no vive en localStorage como el resto: lo lee el servidor de una
     cookie. Por eso hay que pedirle la página otra vez, ya traducida, en vez
     de confiar en que React repinte. */
  function cambiarIdioma(nuevo: Idioma) {
    guardarIdioma(nuevo);
    router.refresh();
  }

  return (
    <Dialogo>
      <DialogoDisparador asChild>
        <button
          type="button"
          aria-label={t("Accesibilidad y guía de uso")}
          className={cn(
            "fixed bottom-6 left-6 z-40 grid size-12 place-items-center rounded-full",
            "border border-scale bg-[var(--anvil-hi)] text-ash shadow-elev-1",
            "transition-[transform,border-color] duration-[var(--dur-hover)] ease-[var(--ease-out)]",
            "hf:border-[var(--quench)] hf:-translate-y-px active:scale-[0.97]",
          )}
        >
          <PersonArmsSpread className="size-6" weight="bold" aria-hidden />
        </button>
      </DialogoDisparador>

      <DialogoContenido
        titulo={t("Accesibilidad y guía")}
        descripcion={t("Ajusta cómo se ve y cómo se mueve la página. Se guarda en este navegador.")}
        className="max-w-xl max-h-[85dvh] overflow-y-auto"
      >
        <div className="flex flex-col gap-7">
          <Grupo
            leyenda={t("Idioma")}
            opciones={idiomas()}
            valor={idioma}
            alCambiar={cambiarIdioma}
          />
          <Grupo
            leyenda={t("Superficie")}
            opciones={temas(t)}
            valor={preferencias.tema}
            alCambiar={(tema) => cambiar({ tema })}
          />
          <Grupo
            leyenda={t("Tamaño del texto")}
            opciones={textos(t)}
            valor={preferencias.texto}
            alCambiar={(texto) => cambiar({ texto })}
          />
          <Grupo
            leyenda={t("Movimiento")}
            opciones={movimientos(t)}
            valor={preferencias.movimiento}
            alCambiar={(movimiento) => cambiar({ movimiento })}
          />

          <fieldset className="border-0 p-0">
            <legend className="etiqueta text-slag">{t("Lectura y contraste")}</legend>
            <div className="mt-3 flex flex-col gap-2">
              <Casilla
                marcada={preferencias.lectura}
                alCambiar={(lectura) => cambiar({ lectura })}
                etiqueta={t("Modo lectura")}
                pista={t(
                  "Tipografía sin remates, más interlínea, medida más corta y fondos decorativos fuera. Implica movimiento reducido.",
                )}
              />
              <Casilla
                marcada={preferencias.contraste}
                alCambiar={(contraste) => cambiar({ contraste })}
                etiqueta={t("Alto contraste")}
                pista={t("Sube la tinta y los filetes por encima del mínimo AA.")}
              />
              <Casilla
                marcada={preferencias.enlaces}
                alCambiar={(enlaces) => cambiar({ enlaces })}
                etiqueta={t("Subrayar los enlaces")}
                pista={t("Para no distinguirlos solo por el color.")}
              />
            </div>
          </fieldset>

          <div>
            <Boton variante="fantasma" tamano="sm" onClick={restablecer} className="-ml-3.5">
              <ArrowCounterClockwise aria-hidden />
              {t("Restablecer todo")}
            </Boton>
          </div>

          <hr className="border-0 border-t border-scale" />

          <details className="group">
            <summary className="titulo cursor-pointer text-ash marker:text-slag">
              {t("Paso a paso: cómo se usa LandingForge")}
            </summary>
            <ol className="mt-4 flex flex-col gap-4">
              {pasos(t).map((p) => (
                <li key={p.titulo} className="border-l border-scale pl-4">
                  <p className="etiqueta text-ash">{p.titulo}</p>
                  <p className="mt-1 cuerpo text-smoke">{p.texto}</p>
                  <p className="mt-1 mono-sm text-slag">{p.donde}</p>
                </li>
              ))}
            </ol>
          </details>

          <details>
            <summary className="titulo cursor-pointer text-ash marker:text-slag">
              {t("Atajos de teclado")}
            </summary>
            <dl className="mt-4 flex flex-col gap-3">
              {atajos(t).map(([tecla, que]) => (
                <div key={tecla} className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
                  <dt className="mono-sm text-ash">{tecla}</dt>
                  <dd className="cuerpo text-smoke">{que}</dd>
                </div>
              ))}
            </dl>
          </details>

          <details>
            <summary className="titulo cursor-pointer text-ash marker:text-slag">
              {t("Qué cumple la página")}
            </summary>
            <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 cuerpo text-smoke">
              <li>{t("Contraste AA comprobado por script en cada build, en las dos superficies.")}</li>
              <li>{t("Todo se puede recorrer y accionar con teclado, con el foco siempre visible.")}</li>
              <li>{t("Enlace «Saltar al contenido» como primera parada del tabulador.")}</li>
              <li>{t("La página se puede leer entera en español o en inglés.")}</li>
              <li>
                {t("Respeta el")} <span className="mono-sm text-ash">prefers-reduced-motion</span>{" "}
                {t("del sistema, y aquí se puede forzar aunque el sistema no lo pida.")}
              </li>
              <li>
                {t("Las imágenes decorativas se ocultan al lector de pantalla; las que informan, no.")}
              </li>
            </ul>
          </details>
        </div>
      </DialogoContenido>
    </Dialogo>
  );
}

/* ---------------------------------------------------------------- */

function Grupo<T extends string>({
  leyenda,
  opciones,
  valor,
  alCambiar,
}: {
  leyenda: string;
  opciones: { valor: T; etiqueta: string; pista: string }[];
  valor: T;
  alCambiar: (v: T) => void;
}) {
  /* Un `name` único por grupo y por instancia: dos grupos con el mismo nombre
     se comportarían como uno solo. */
  const nombre = useId();

  return (
    <fieldset className="border-0 p-0">
      <legend className="etiqueta text-slag">{leyenda}</legend>
      <div className="mt-3 flex flex-col gap-2">
        {opciones.map((o) => (
          <label
            key={o.valor}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-[10px] border p-3",
              "transition-[background-color,border-color] duration-[var(--dur-hover)] ease-[var(--ease-out)]",
              "has-[:focus-visible]:outline has-[:focus-visible]:outline-2",
              "has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--quench)]",
              valor === o.valor
                ? "border-[var(--heat)] bg-[color-mix(in_oklab,var(--heat)_10%,transparent)]"
                : "border-scale hf:border-scale-hi",
            )}
          >
            {/* Sin `appearance-none`: el control nativo ya se tiñe con el
                `accent-color` del sistema de diseño, y dibujarlo a mano solo
                sirve para perder el estado marcado en el modo de alto
                contraste del sistema operativo. */}
            <input
              type="radio"
              name={nombre}
              value={o.valor}
              checked={valor === o.valor}
              onChange={() => alCambiar(o.valor)}
              className="mt-1 size-4 shrink-0 accent-[var(--heat)]"
            />
            <span className="min-w-0">
              <span className="block etiqueta text-ash">{o.etiqueta}</span>
              <span className="block cuerpo text-smoke">{o.pista}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Casilla({
  marcada,
  alCambiar,
  etiqueta,
  pista,
}: {
  marcada: boolean;
  alCambiar: (v: boolean) => void;
  etiqueta: string;
  pista: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-[10px] border p-3",
        "transition-[background-color,border-color] duration-[var(--dur-hover)] ease-[var(--ease-out)]",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2",
        "has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--quench)]",
        marcada
          ? "border-[var(--heat)] bg-[color-mix(in_oklab,var(--heat)_10%,transparent)]"
          : "border-scale hf:border-scale-hi",
      )}
    >
      {/* Igual que los radios: casilla nativa. La versión dibujada a mano
          perdía la palomita —`cn` descartaba el color de fondo por chocar con
          la imagen, y el data-URI no llegaba a generarse— y dejaba el estado
          marcado a merced de un borde naranja de un píxel. */}
      <input
        type="checkbox"
        checked={marcada}
        onChange={(e) => alCambiar(e.target.checked)}
        className="mt-1 size-4 shrink-0 accent-[var(--heat)]"
      />
      <span className="min-w-0">
        <span className="block etiqueta text-ash">{etiqueta}</span>
        <span className="block cuerpo text-smoke">{pista}</span>
      </span>
    </label>
  );
}
