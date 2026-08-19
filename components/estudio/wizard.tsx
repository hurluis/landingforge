"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { TipologiaSeccion, Usuario } from "@/lib/datos/tipos";
import { nombreTipologia } from "@/lib/metodologia/tipologias";
import { Boton } from "@/components/ui/boton";
import { cn } from "@/lib/utils";
import { PasoProducto } from "./paso-producto";
import { PasoMercado } from "./paso-mercado";
import { PasoIdentidad } from "./paso-identidad";
import { PasoSecciones } from "./paso-secciones";
import { CLAVE_ALMACEN, ESTADO_INICIAL, pasoCompleto, type EstadoEstudio } from "./estado";

/**
 * F1 — Estudio de prompts (§7.1).
 *
 * Un paso por pantalla, barra de progreso superior de 2px en --key. El paso
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
      {/* Barra de progreso de 2px en --key. */}
      <div
        aria-hidden
        className="sticky top-0 z-10 h-0.5 w-full bg-[var(--line)]"
      >
        <span
          style={{ width: `${(paso / 4) * 100}%` }}
          className="block h-full bg-[var(--key)] transition-[width] duration-[300ms] ease-[var(--ease-out)]"
        />
      </div>

      <div className="mx-auto w-full max-w-[900px] flex-1 px-4 py-8 pt-20 sm:px-8 lg:pt-10">
        <header className="mb-10">
          <p className="mono-sm text-lo">paso {paso} de 4</p>
          <h1 className="display-md mt-2">{TITULOS[paso - 1].titulo}</h1>
          <p className="mt-2 cuerpo text-mid">{TITULOS[paso - 1].sub}</p>
        </header>

        {paso === 1 && <PasoProducto estado={estado} cambiar={cambiar} />}
        {paso === 2 && <PasoMercado estado={estado} cambiar={cambiar} />}
        {paso === 3 && <PasoIdentidad estado={estado} cambiar={cambiar} />}
        {paso === 4 && <PasoSecciones estado={estado} cambiar={cambiar} />}
      </div>

      {/* En móvil los botones de avance quedan fijos abajo (§13). */}
      <div
        className={cn(
          "sticky bottom-0 border-t border-[var(--line)] bg-[var(--canvas)]",
          "lg:static lg:border-0 lg:bg-transparent",
        )}
      >
        <div className="mx-auto flex w-full max-w-[900px] items-center justify-between gap-4 px-4 py-4 sm:px-8">
          {paso > 1 ? (
            <Boton variante="fantasma" onClick={() => irA(paso - 1)}>
              <ArrowLeft strokeWidth={1.5} /> Atrás
            </Boton>
          ) : (
            <span />
          )}

          {paso < 4 ? (
            <Boton variante="primario" disabled={!completo} onClick={() => irA(paso + 1)}>
              Continuar
            </Boton>
          ) : (
            <div className="flex items-center gap-4">
              <span className="mono-sm text-lo">
                {costo} {costo === 1 ? "sección" : "secciones"} · {costo}{" "}
                {costo === 1 ? "crédito" : "créditos"}
              </span>
              <Boton
                variante="primario"
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

/** Estado de carga con la forma real del contenido, no un spinner (§11). */
function EsqueletoWizard() {
  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-8 pt-20 sm:px-8 lg:pt-10">
      <div className="h-4 w-24 rounded-full bg-[var(--surface-1)]" />
      <div className="mt-4 h-8 w-56 rounded-[8px] bg-[var(--surface-1)]" />
      <div className="mt-10 grid gap-8 md:grid-cols-[280px_1fr]">
        <div className="aspect-[9/16] rounded-[12px] bg-[var(--surface-1)]" />
        <div className="flex flex-col gap-5">
          <div className="h-10 rounded-[10px] bg-[var(--surface-1)]" />
          <div className="h-24 rounded-[10px] bg-[var(--surface-1)]" />
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
      <p className="mt-2 cuerpo text-mid">
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
                "border border-[var(--line)]",
                activa && "barrido-rim",
              )}
            >
              <span className={cn("cuerpo", hecha || activa ? "text-hi" : "text-lo")}>
                {activa ? `Construyendo ${nombreTipologia(s)}…` : nombreTipologia(s)}
              </span>
              <span className="mono-sm">
                {hecha && <span className="text-[var(--ok)]">lista</span>}
                {fallida && <span className="text-[var(--danger)]">falló · crédito devuelto</span>}
                {!hecha && !fallida && !activa && <span className="text-lo">en cola</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
