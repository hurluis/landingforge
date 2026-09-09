"use client";

import { useId } from "react";
import { PersonArmsSpread, ArrowCounterClockwise } from "@phosphor-icons/react/dist/ssr";
import { Dialogo, DialogoDisparador, DialogoContenido } from "@/components/ui/dialogo";
import { Boton } from "@/components/ui/boton";
import { usePreferencias, type Preferencias } from "@/lib/a11y/preferencias";
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
 * La guía va en <details> nativos: se abren con teclado, el buscador del
 * navegador encuentra su texto aunque estén cerrados, y no cuestan una línea
 * de JavaScript.
 */

const TEMAS: { valor: Preferencias["tema"]; etiqueta: string; pista: string }[] = [
  { valor: "oscuro", etiqueta: "Estudio", pista: "Oscuro. Como se miran las imágenes." },
  { valor: "claro", etiqueta: "Papel", pista: "Claro. Como se entrega el trabajo." },
  { valor: "sistema", etiqueta: "Del sistema", pista: "Sigue el ajuste de tu equipo." },
];

const TEXTOS: { valor: Preferencias["texto"]; etiqueta: string; pista: string }[] = [
  { valor: "normal", etiqueta: "Normal", pista: "16 px" },
  { valor: "grande", etiqueta: "Grande", pista: "18 px" },
  { valor: "enorme", etiqueta: "Enorme", pista: "20 px" },
];

const MOVIMIENTOS: { valor: Preferencias["movimiento"]; etiqueta: string; pista: string }[] = [
  { valor: "sistema", etiqueta: "Como el sistema", pista: "Respeta tu ajuste de movimiento." },
  { valor: "reducido", etiqueta: "Reducido", pista: "Sin scroll coreografiado ni fondos animados." },
];

const PASOS = [
  {
    titulo: "1 · Crea tu cuenta",
    texto:
      "Correo y contraseña, sin tarjeta. Entras con 5 créditos de bienvenida, suficientes para una campaña de prueba completa.",
    donde: "/entrar",
  },
  {
    titulo: "2 · Describe tu producto",
    texto:
      "Cuatro preguntas: qué es, para quién, cuál es el beneficio principal y cuánto cuesta. Puedes subir la foto del producto.",
    donde: "/app/nueva",
  },
  {
    titulo: "3 · Revisa la paleta antes de gastar nada",
    texto:
      "La matriz cruza tipo de producto, audiencia y registro emocional, y te propone una paleta con sus hex y el motivo. Si no te convence, la cambias.",
    donde: "/metodologia",
  },
  {
    titulo: "4 · Recibe las nueve secciones",
    texto:
      "Los prompts se construyen en prosa narrativa y pasan por el validador: límite de caracteres, palabras prohibidas, bloque de paleta e iluminación.",
    donde: "/app",
  },
  {
    titulo: "5 · Edita, versiona y llévatelo",
    texto:
      "Cada prompt se puede reescribir y volver a correr. Si dejas de usar LandingForge, los prompts siguen siendo tuyos.",
    donde: "/app",
  },
];

const ATAJOS = [
  ["Tab", "Avanza por los controles. El foco siempre se ve: contorno azul de temple."],
  ["Esc", "Cierra este panel, el asistente y cualquier diálogo."],
  ["← →", "En la tira de las nueve secciones, salta de sección."],
  ["Inicio / Fin", "En esa misma tira, va a la primera o a la última."],
];

export function PanelAccesibilidad() {
  const { preferencias, cambiar, restablecer } = usePreferencias();

  return (
    <Dialogo>
      <DialogoDisparador asChild>
        <button
          type="button"
          aria-label="Accesibilidad y guía de uso"
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
        titulo="Accesibilidad y guía"
        descripcion="Ajusta cómo se ve y cómo se mueve la página. Se guarda en este navegador."
        className="max-w-xl max-h-[85dvh] overflow-y-auto"
      >
        <div className="flex flex-col gap-7">
          <Grupo
            leyenda="Superficie"
            opciones={TEMAS}
            valor={preferencias.tema}
            alCambiar={(tema) => cambiar({ tema })}
          />
          <Grupo
            leyenda="Tamaño del texto"
            opciones={TEXTOS}
            valor={preferencias.texto}
            alCambiar={(texto) => cambiar({ texto })}
          />
          <Grupo
            leyenda="Movimiento"
            opciones={MOVIMIENTOS}
            valor={preferencias.movimiento}
            alCambiar={(movimiento) => cambiar({ movimiento })}
          />

          <fieldset className="border-0 p-0">
            <legend className="etiqueta text-slag">Lectura y contraste</legend>
            <div className="mt-3 flex flex-col gap-2">
              <Casilla
                marcada={preferencias.lectura}
                alCambiar={(lectura) => cambiar({ lectura })}
                etiqueta="Modo lectura"
                pista="Tipografía sin remates, más interlínea, medida más corta y fondos decorativos fuera. Implica movimiento reducido."
              />
              <Casilla
                marcada={preferencias.contraste}
                alCambiar={(contraste) => cambiar({ contraste })}
                etiqueta="Alto contraste"
                pista="Sube la tinta y los filetes por encima del mínimo AA."
              />
              <Casilla
                marcada={preferencias.enlaces}
                alCambiar={(enlaces) => cambiar({ enlaces })}
                etiqueta="Subrayar los enlaces"
                pista="Para no distinguirlos solo por el color."
              />
            </div>
          </fieldset>

          <div>
            <Boton variante="fantasma" tamano="sm" onClick={restablecer} className="-ml-3.5">
              <ArrowCounterClockwise aria-hidden />
              Restablecer todo
            </Boton>
          </div>

          <hr className="border-0 border-t border-scale" />

          <details className="group">
            <summary className="titulo cursor-pointer text-ash marker:text-slag">
              Paso a paso: cómo se usa LandingForge
            </summary>
            <ol className="mt-4 flex flex-col gap-4">
              {PASOS.map((p) => (
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
              Atajos de teclado
            </summary>
            <dl className="mt-4 flex flex-col gap-3">
              {ATAJOS.map(([tecla, que]) => (
                <div key={tecla} className="grid gap-1 sm:grid-cols-[7rem_1fr] sm:gap-4">
                  <dt className="mono-sm text-ash">{tecla}</dt>
                  <dd className="cuerpo text-smoke">{que}</dd>
                </div>
              ))}
            </dl>
          </details>

          <details>
            <summary className="titulo cursor-pointer text-ash marker:text-slag">
              Qué cumple la página
            </summary>
            <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 cuerpo text-smoke">
              <li>Contraste AA comprobado por script en cada build, en las dos superficies.</li>
              <li>Todo se puede recorrer y accionar con teclado, con el foco siempre visible.</li>
              <li>Enlace «Saltar al contenido» como primera parada del tabulador.</li>
              <li>
                Respeta <span className="mono-sm text-ash">prefers-reduced-motion</span> del
                sistema, y aquí se puede forzar aunque el sistema no lo pida.
              </li>
              <li>Las imágenes decorativas se ocultan al lector de pantalla; las que informan, no.</li>
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
