"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Check } from "@phosphor-icons/react/dist/ssr";
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
  mercadoDelNavegador,
  pasoCompleto,
  type EstadoEstudio,
} from "./estado";
import { useT } from "@/lib/i18n/cliente";
import type { Traductor } from "@/lib/i18n/idioma";

/**
 * F1 — Estudio de prompts (§7.1).
 *
 * Un paso por pantalla, con los cuatro pasos en un raíl arriba. El paso
 * vive en la URL (?paso=2) y el resto del estado en sessionStorage, así que
 * recargar no borra nada y volver atrás no pierde datos.
 *
 * La generación es en streaming: cada prompt aparece en cuanto está listo, no
 * se espera a los nueve.
 */

const titulos = (t: Traductor) => [
  { titulo: t("El producto"), sub: t("Qué vas a vender y cómo se ve.") },
  { titulo: t("El mercado"), sub: t("Dónde lo vendes, para quién es, qué promete y cuánto cuesta.") },
  { titulo: t("La identidad"), sub: t("La paleta que la matriz asigna a este producto.") },
  { titulo: t("Las secciones"), sub: t("Qué piezas quieres de esta campaña.") },
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
    /* Sin borrador, el país de partida es el del navegador. Un borrador de
       antes de los mercados no trae país ni `precio`: se descarta su precio
       viejo en vez de reinterpretarlo en otra moneda. */
    const inicial = { ...ESTADO_INICIAL, mercado: mercadoDelNavegador() };
    return guardado ? { ...inicial, ...JSON.parse(guardado) } : inicial;
  } catch {
    return ESTADO_INICIAL;
  }
}

export function Wizard({ usuario }: { usuario: Usuario }) {
  const t = useT();
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
  const costo = estado.secciones.length;
  const faltan = costo - usuario.creditosDisponibles;

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
            mercado: estado.mercado,
            precio: estado.precio,
            precioTachado: estado.precioTachado,
          },
          paleta: estado.paleta,
          tipologias: estado.secciones,
        }),
      });

      if (!respuesta.ok || !respuesta.body) {
        const datos = await respuesta.json().catch(() => null);
        throw new Error(datos?.error ?? t("No se pudo iniciar la generación."));
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
      toast.error(t("No se pudo generar"), {
        description: e instanceof Error ? e.message : t("Vuelve a intentarlo."),
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
    <div className="flex flex-1 flex-col">
      <div className="mx-auto w-full max-w-[1100px] flex-1 px-5 pb-10 pt-10 sm:px-8">
        {/* Los cuatro pasos como raíl, no como barra de 2px: se ve dónde se
            está, qué queda y a qué paso hecho se puede volver. */}
        <ol className="flex flex-wrap gap-x-8 gap-y-2 border-b border-[var(--scale)]">
          {titulos(t).map((t, i) => {
            const n = i + 1;
            const hecho = n < paso;
            const actual = n === paso;
            return (
              <li key={t.titulo}>
                <button
                  type="button"
                  disabled={n > paso}
                  onClick={() => irA(n)}
                  aria-current={actual ? "step" : undefined}
                  className={cn(
                    "relative flex items-center gap-2 pb-4 etiqueta transition-colors duration-[140ms]",
                    actual ? "text-ash" : hecho ? "text-smoke hf:text-ash" : "text-slag",
                  )}
                >
                  <span className="mono-sm tabular-nums">
                    {hecho ? <Check className="size-3.5" weight="bold" /> : String(n).padStart(2, "0")}
                  </span>
                  {t.titulo}
                  {actual && (
                    <span aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--heat)]" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>

        <header className="mb-12 mt-10">
          <p className="flex items-center gap-3 etiqueta text-smoke">
            <span aria-hidden className="h-px w-8 bg-current" />
            Nueva campaña · paso {paso} de 4
          </p>
          <h1 className="mt-4 display-lg">{titulos(t)[paso - 1].titulo}</h1>
          <p className="mt-3 cuerpo-lg text-smoke">{titulos(t)[paso - 1].sub}</p>
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
        {/* En móvil, sitio a la izquierda para el botón de accesibilidad, que
            vive en esa esquina y tapaba el «Atrás». */}
        <div className="mx-auto flex w-full max-w-[1100px] items-center justify-between gap-4 py-4 pl-20 pr-5 sm:pr-8 lg:px-8">
          {paso > 1 ? (
            <Boton variante="fantasma" onClick={() => irA(paso - 1)}>
              <ArrowLeft /> {t("Atrás")}
            </Boton>
          ) : (
            <span />
          )}

          {paso < 4 ? (
            <Boton variante="heat" disabled={!completo} onClick={() => irA(paso + 1)}>
              Continuar
            </Boton>
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
                  : t("Generar los prompts")}
              </Boton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Estado de carga con la forma real del contenido, no un spinner (§11). */
function EsqueletoWizard() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 pb-8 pt-10 sm:px-8">
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
  const t = useT();
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-24 sm:px-8">
      <p className="flex items-center gap-3 etiqueta text-smoke">
        <span aria-hidden className="h-px w-8 bg-current" />
        {t("Nueva campaña")}
      </p>
      <h1 className="mt-4 display-lg">{t("Construyendo la campaña")}</h1>
      <p className="mt-2 cuerpo text-smoke">
        {t("Cada sección se valida contra las siete reglas antes de guardarse.")}
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
                {fallida && <span className="text-[var(--danger)]">{t("no se generó")}</span>}
                {!hecha && !fallida && !activa && <span className="text-slag">{t("en cola")}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
