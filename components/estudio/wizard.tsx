"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import type { TipologiaSeccion, Usuario } from "@/lib/datos/tipos";
import { nombreTipologia } from "@/lib/metodologia/tipologias";
import { Boton } from "@/components/ui/boton";
import { cn } from "@/lib/utils";
import { PasoProducto } from "./paso-producto";
import { PasoMercado } from "./paso-mercado";
import { PasoIdentidad } from "./paso-identidad";
import { PasoSecciones } from "./paso-secciones";
import {
  CLAVE_ALMACEN,
  ESTADO_INICIAL,
  enumerar,
  pasoCompleto,
  queFalta,
  type EstadoEstudio,
} from "./estado";

/**
 * F1 — Estudio de prompts (§7.1).
 *
 * Un paso por pantalla, barra de progreso superior de 2px en --heat. El paso
 * vive en la URL (?paso=2) y el resto del estado en sessionStorage, así que
 * recargar no borra nada y volver atrás no pierde datos.
 *
 * La generación es en streaming: cada prompt aparece en cuanto está listo, no
 * se espera a los nueve.
 */

const TITULOS = [
  { titulo: "El producto", sub: "Qué vas a vender y cómo se ve." },
  { titulo: "El mercado", sub: "Para quién es, qué promete y cuánto cuesta." },
  { titulo: "La identidad", sub: "La paleta que la matriz asigna a este producto." },
  { titulo: "Las secciones", sub: "Qué piezas quieres de esta campaña." },
];

type Progreso = {
  hechas: TipologiaSeccion[];
  fallidas: TipologiaSeccion[];
  actual: TipologiaSeccion | null;
};

/** El estado de hidratación no cambia después del montaje: no hay a qué
 *  suscribirse, solo hace falta distinguir servidor de cliente. */
const suscripcionVacia = () => () => {};

/** Lectura única del borrador guardado. En el servidor no hay sessionStorage. */
function leerBorrador(): EstadoEstudio {
  if (typeof window === "undefined") return ESTADO_INICIAL;
  try {
    const guardado = window.sessionStorage.getItem(CLAVE_ALMACEN);
    return guardado ? { ...ESTADO_INICIAL, ...JSON.parse(guardado) } : ESTADO_INICIAL;
  } catch {
    return ESTADO_INICIAL;
  }
}

export function Wizard({ usuario }: { usuario: Usuario }) {
  const router = useRouter();
  const parametros = useSearchParams();
  const paso = Math.min(4, Math.max(1, Number(parametros.get("paso") ?? 1)));

  /* La rehidratación del borrador tiene dos mitades.
     · `hidratado` sale de useSyncExternalStore: false en el servidor, true en
       el cliente. Es lo que hace que el HTML del servidor y el de la
       hidratación coincidan aunque el borrador guardado sea distinto.
     · El estado se lee en el inicializador perezoso, que solo corre una vez.
     Así no hace falta un setState dentro de un efecto, que es justo lo que
     provoca los renders en cascada. */
  const hidratado = React.useSyncExternalStore(
    suscripcionVacia,
    () => true,
    () => false,
  );

  const [estado, setEstado] = React.useState<EstadoEstudio>(leerBorrador);
  const [generando, setGenerando] = React.useState(false);
  const [progreso, setProgreso] = React.useState<Progreso>({
    hechas: [],
    fallidas: [],
    actual: null,
  });

  React.useEffect(() => {
    if (!hidratado) return;
    try {
      sessionStorage.setItem(CLAVE_ALMACEN, JSON.stringify(estado));
    } catch {
      /* cuota llena: no es motivo para romper el flujo */
    }
  }, [estado, hidratado]);

  const cambiar = React.useCallback(
    (parcial: Partial<EstadoEstudio>) => setEstado((e) => ({ ...e, ...parcial })),
    [],
  );

  const irA = React.useCallback(
    (n: number) => {
      router.push(`/app/nueva?paso=${n}`, { scroll: false });
    },
    [router],
  );

  const completo = pasoCompleto(paso, estado);
  const pendiente = queFalta(paso, estado);
  const costo = estado.secciones.length;
  const faltan = costo - usuario.creditosDisponibles;

  /* Hasta dónde puede saltar el usuario: el primer paso incompleto es el
     techo. Permite volver a cualquier paso ya resuelto sin pulsar «Atrás»
     cuatro veces —memorabilidad y sensación de control (Norman)— sin dejar
     saltar por encima de lo que aún no está. */
  const alcanzable = React.useMemo(() => {
    let n = 1;
    while (n < 4 && pasoCompleto(n, estado)) n += 1;
    return n;
  }, [estado]);

  async function generar() {
    if (!estado.paleta || generando) return;
    setGenerando(true);
    setProgreso({ hechas: [], fallidas: [], actual: null });

    try {
      const respuesta = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto: {
            nombre: estado.nombre,
            descripcion: estado.descripcion,
            imagenUrl: estado.imagenUrl,
            tipo: estado.tipo,
            audiencia: estado.audiencia,
            beneficioPrincipal: estado.beneficioPrincipal,
            precioCOP: estado.precioCOP,
            precioTachadoCOP: estado.precioTachadoCOP,
          },
          paleta: estado.paleta,
          tipologias: estado.secciones,
        }),
      });

      if (!respuesta.ok || !respuesta.body) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error ?? "No se pudo iniciar la generación.");
      }

      const lector = respuesta.body.getReader();
      const decodificador = new TextDecoder();
      let resto = "";
      let destino: string | null = null;

      for (;;) {
        const { done, value } = await lector.read();
        if (done) break;
        resto += decodificador.decode(value, { stream: true });
        const lineas = resto.split("\n");
        resto = lineas.pop() ?? "";
        for (const linea of lineas) {
          if (linea.trim() === "") continue;
          const evento = JSON.parse(linea);
          if (evento.tipo === "construyendo") {
            setProgreso((p) => ({ ...p, actual: evento.tipologia }));
          } else if (evento.tipo === "seccion") {
            setProgreso((p) => ({
              ...p,
              hechas: [...p.hechas, evento.prompt.tipologia],
              actual: null,
            }));
          } else if (evento.tipo === "fallo") {
            setProgreso((p) => ({
              ...p,
              fallidas: [...p.fallidas, evento.tipologia],
              actual: null,
            }));
          } else if (evento.tipo === "fin") {
            destino = evento.campanaId;
          }
        }
      }

      if (destino) {
        sessionStorage.removeItem(CLAVE_ALMACEN);
        router.push(`/app/c/${destino}`);
        router.refresh();
      }
    } catch (e) {
      setGenerando(false);
      toast.error("No se pudo generar", {
        description: e instanceof Error ? e.message : "Vuelve a intentarlo.",
      });
    }
  }

  if (!hidratado) {
    return <EsqueletoWizard />;
  }

  if (generando) {
    return (
      <PantallaGenerando
        secciones={estado.secciones}
        progreso={progreso}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Barra de progreso de 2px en --heat. El valor es semántico: un lector
          de pantalla lo anuncia sin depender de que el usuario alcance el
          «paso N de 4» que hay más abajo. */}
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={4}
        aria-valuenow={paso}
        aria-valuetext={`Paso ${paso} de 4: ${TITULOS[paso - 1].titulo}`}
        className="sticky top-0 z-10 h-0.5 w-full bg-[var(--scale)]"
      >
        <span
          style={{ width: `${(paso / 4) * 100}%` }}
          className="block h-full bg-[var(--heat)] transition-[width] duration-[300ms] ease-[var(--ease-out)]"
        />
      </div>

      <div className="mx-auto w-full max-w-[900px] flex-1 px-4 py-8 pt-20 sm:px-8 lg:pt-10">
        <header className="mb-10">
          <Pasos actual={paso} alcanzable={alcanzable} irA={irA} />
          <h1 className="display-md mt-4">{TITULOS[paso - 1].titulo}</h1>
          <p className="mt-2 cuerpo text-smoke">{TITULOS[paso - 1].sub}</p>
        </header>

        {paso === 1 && <PasoProducto estado={estado} cambiar={cambiar} />}
        {paso === 2 && <PasoMercado estado={estado} cambiar={cambiar} />}
        {paso === 3 && <PasoIdentidad estado={estado} cambiar={cambiar} />}
        {paso === 4 && <PasoSecciones estado={estado} cambiar={cambiar} />}
      </div>

      {/* En móvil los botones de avance quedan fijos abajo (§13). */}
      <div
        className={cn(
          "sticky bottom-0 border-t border-[var(--scale)] bg-[var(--void)]",
          "lg:static lg:border-0 lg:bg-transparent",
        )}
      >
        <div className="mx-auto flex w-full max-w-[900px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
          {paso > 1 ? (
            <Boton variante="fantasma" onClick={() => irA(paso - 1)}>
              <ArrowLeft /> Atrás
            </Boton>
          ) : (
            <span />
          )}

          {paso < 4 ? (
            <div className="flex min-w-0 items-center justify-end gap-4">
              {/* El motivo del bloqueo, no solo el bloqueo. Se anuncia con
                  aria-live porque aparece y desaparece mientras el usuario
                  escribe, sin que nada mueva el foco. */}
              <p
                id="wizard-falta"
                aria-live="polite"
                className="min-w-0 text-right text-[0.8125rem] text-slag"
              >
                {pendiente.length > 0 && `Falta ${enumerar(pendiente)}.`}
              </p>
              {/* Un solo nodo para las dos rutas: `aria-live` lo anuncia
                  cuando cambia mientras se escribe, y `aria-describedby` lo
                  lee al enfocar el botón. Duplicarlo en un `sr-only` aparte
                  hacía que se oyera dos veces. */}
              <Boton
                variante="heat"
                disabled={!completo}
                aria-describedby={pendiente.length > 0 ? "wizard-falta" : undefined}
                onClick={() => irA(paso + 1)}
              >
                Continuar
              </Boton>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <span className="mono-sm text-slag">
                {costo} {costo === 1 ? "sección" : "secciones"} · {costo}{" "}
                {costo === 1 ? "crédito" : "créditos"}
              </span>
              <Boton
                variante="heat"
                disabled={costo === 0 || faltan > 0}
                onClick={generar}
              >
                {faltan > 0
                  ? `Te ${faltan === 1 ? "falta" : "faltan"} ${faltan} ${faltan === 1 ? "crédito" : "créditos"}`
                  : "Generar los prompts"}
              </Boton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Los cuatro pasos, nombrados y navegables hacia atrás.
 *
 * Antes solo existía «paso 3 de 4»: el usuario sabía dónde estaba pero no qué
 * venía ni qué había resuelto, y volver dos pasos costaba dos clics ciegos en
 * «Atrás». Nombrar las etapas convierte el wizard en un mapa —ley de Gestalt
 * de proximidad y continuidad: cuatro elementos alineados se leen como una
 * secuencia— y deja ver el progreso sin tener que recordarlo.
 *
 * Solo se puede saltar a lo ya completado. Un paso futuro no es un enlace
 * roto: no es un enlace, porque no existe todavía.
 */
function Pasos({
  actual,
  alcanzable,
  irA,
}: {
  actual: number;
  alcanzable: number;
  irA: (n: number) => void;
}) {
  return (
    <nav aria-label="Pasos del estudio">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {TITULOS.map((t, i) => {
          const n = i + 1;
          const esActual = n === actual;
          const navegable = n < actual || n <= alcanzable;
          return (
            <li key={t.titulo} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden className="text-slag">
                  ·
                </span>
              )}
              {navegable && !esActual ? (
                <button
                  type="button"
                  onClick={() => irA(n)}
                  className={cn(
                    "mono-sm rounded-[6px] px-1 text-slag underline-offset-4",
                    "transition-colors duration-[140ms] ease-[var(--ease-out)]",
                    "hf:text-ash hf:underline",
                  )}
                >
                  {n}. {t.titulo}
                </button>
              ) : (
                <span
                  aria-current={esActual ? "step" : undefined}
                  className={cn("mono-sm px-1", esActual ? "text-[var(--heat)]" : "text-slag/50")}
                >
                  {n}. {t.titulo}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Estado de carga con la forma real del contenido, no un spinner (§11). */
function EsqueletoWizard() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-8 pt-20 sm:px-8 lg:pt-10">
      <div className="h-4 w-24 rounded-full bg-[var(--anvil)]" />
      <div className="mt-4 h-8 w-56 rounded-[8px] bg-[var(--anvil)]" />
      <div className="mt-10 grid gap-8 md:grid-cols-[280px_1fr]">
        <div className="aspect-[9/16] rounded-[12px] bg-[var(--anvil)]" />
        <div className="flex flex-col gap-5">
          <div className="h-10 rounded-[10px] bg-[var(--anvil)]" />
          <div className="h-24 rounded-[10px] bg-[var(--anvil)]" />
        </div>
      </div>
    </div>
  );
}

/** Progreso por sección, con el nombre de lo que se está construyendo (§11). */
function PantallaGenerando({
  secciones,
  progreso,
}: {
  secciones: TipologiaSeccion[];
  progreso: Progreso;
}) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-24 sm:px-8">
      <h1 className="display-md">Construyendo la campaña</h1>
      <p className="mt-2 cuerpo text-smoke">
        Cada sección se valida contra las siete reglas antes de guardarse.
      </p>

      <ol className="mt-10 flex flex-col gap-2" aria-live="polite">
        {secciones.map((s) => {
          const hecha = progreso.hechas.includes(s);
          const fallida = progreso.fallidas.includes(s);
          const activa = progreso.actual === s;
          return (
            <li
              key={s}
              className={cn(
                "flex items-center justify-between gap-4 rounded-[10px] px-4 h-12",
                "border border-[var(--scale)]",
                activa && "barrido-calor",
              )}
            >
              <span className={cn("cuerpo", hecha || activa ? "text-ash" : "text-slag")}>
                {activa ? `Construyendo ${nombreTipologia(s)}…` : nombreTipologia(s)}
              </span>
              <span className="mono-sm">
                {hecha && <span className="text-[var(--ok)]">lista</span>}
                {fallida && <span className="text-[var(--danger)]">falló · crédito devuelto</span>}
                {!hecha && !fallida && !activa && <span className="text-slag">en cola</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
