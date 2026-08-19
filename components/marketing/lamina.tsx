import Image from "next/image";
import type { Paleta, TipologiaSeccion } from "@/lib/datos/tipos";
import { cn } from "@/lib/utils";

/**
 * Lámina — la composición de una sección dentro de un fotograma 9:16.
 *
 * Se usa en dos sitios: la tira de contactos de la home y el paso 4 del
 * wizard. Es la misma pieza porque es la misma información.
 *
 * Nota honesta: F4 (generación de imágenes) está fuera de alcance en esta
 * entrega, así que la lámina dibuja la ESTRUCTURA real de cada tipología con
 * la paleta asignada, no una fotografía generada. Es lo que el brief pide
 * explícitamente para el paso 4, y es preferible a un mockup con una imagen
 * de banco que fingiría una funcionalidad que todavía no está conectada.
 */

export function Lamina({
  tipologia,
  paleta,
  className,
}: {
  tipologia: TipologiaSeccion;
  paleta: Paleta;
  className?: string;
}) {
  const estilo = {
    background: paleta.fondo,
    color: paleta.texto,
  } as React.CSSProperties;

  return (
    <div
      aria-hidden
      style={estilo}
      className={cn("size-full overflow-hidden text-[0.5rem] leading-tight", className)}
    >
      {CONTENIDO[tipologia](paleta)}
    </div>
  );
}

/* Piezas compartidas ------------------------------------------------- */

function Titular({ children, p }: { children: React.ReactNode; p: Paleta }) {
  return (
    <p
      style={{ color: p.texto }}
      className="font-[family-name:var(--font-display-serif)] text-[0.9rem] font-[350] leading-[1.05] tracking-[-0.02em]"
    >
      {children}
    </p>
  );
}

function Pastilla({ children, p }: { children: React.ReactNode; p: Paleta }) {
  return (
    <span
      style={{ borderColor: p.acento, color: p.energia }}
      className="mono-sm rounded-full border px-1.5 py-[1px] text-[0.4rem] leading-none"
    >
      {children}
    </span>
  );
}

function Frasco({ className }: { className?: string }) {
  return (
    <Image
      src="/pieza/frasco.png"
      alt=""
      width={540}
      height={960}
      sizes="200px"
      className={cn("object-contain", className)}
    />
  );
}

function Barra({ ancho, color, alto = 3 }: { ancho: string; color: string; alto?: number }) {
  return (
    <span
      style={{ width: ancho, background: color, height: alto }}
      className="block rounded-full opacity-70"
    />
  );
}

/* Las nueve composiciones -------------------------------------------- */

const CONTENIDO: Record<TipologiaSeccion, (p: Paleta) => React.ReactNode> = {
  hero: (p) => (
    <div className="relative flex size-full flex-col justify-between p-3">
      <div
        style={{
          background: `radial-gradient(120% 70% at 75% 12%, ${p.acento}44, transparent 70%)`,
        }}
        className="absolute inset-0"
      />
      <Titular p={p}>Piel firme en 8 semanas</Titular>
      <Frasco className="absolute inset-x-0 bottom-6 mx-auto h-[58%] w-auto" />
      <div className="relative flex items-end justify-between">
        <span style={{ color: p.energia }} className="mono-sm text-[0.55rem]">
          $129.900
        </span>
        <Pastilla p={p}>contraentrega</Pastilla>
      </div>
    </div>
  ),

  beneficios: (p) => (
    <div className="flex size-full flex-col gap-2.5 p-3">
      <Titular p={p}>Lo que cambia</Titular>
      {["Absorción en 20 min", "Sin sabor a pescado", "60 tomas por frasco"].map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            style={{ borderColor: p.acento }}
            className="grid size-4 shrink-0 place-items-center rounded-[4px] border"
          >
            <span style={{ background: p.acento }} className="size-1.5 rounded-[1px]" />
          </span>
          <span style={{ color: p.texto }} className="text-[0.5rem] opacity-85">
            {t}
          </span>
        </div>
      ))}
      <div className="mt-auto flex justify-center">
        <Frasco className="h-16 w-auto" />
      </div>
    </div>
  ),

  "antes-despues": (p) => (
    <div className="grid size-full grid-cols-2">
      {["ANTES", "DESPUÉS"].map((etiqueta, i) => (
        <div
          key={etiqueta}
          style={{
            background:
              i === 0
                ? p.secundario
                : `linear-gradient(180deg, ${p.secundario}, ${p.acento}33)`,
          }}
          className="relative flex flex-col justify-between p-2"
        >
          <span
            style={{ color: p.texto }}
            className="mono-sm text-[0.4rem] tracking-[0.08em] opacity-70"
          >
            {etiqueta}
          </span>
          <span
            style={{ background: p.texto, opacity: i === 0 ? 0.14 : 0.26 }}
            className="absolute left-1/2 top-1/2 h-[46%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-[40%_40%_35%_35%]"
          />
          <Barra ancho={i === 0 ? "40%" : "72%"} color={i === 0 ? p.texto : p.acento} />
        </div>
      ))}
    </div>
  ),

  "paso-a-paso": (p) => (
    <div className="flex size-full flex-col gap-2 p-3">
      <Titular p={p}>Tres pasos</Titular>
      {["Agita el frasco", "Sirve una medida", "Toma en ayunas"].map((t, i) => (
        <div key={i} className="flex items-start gap-2">
          <span
            style={{ color: p.acento }}
            className="font-[family-name:var(--font-display-serif)] text-[0.7rem] leading-none"
          >
            {i + 1}
          </span>
          <div className="flex flex-1 flex-col gap-1 pt-0.5">
            <span style={{ color: p.texto }} className="text-[0.48rem] opacity-85">
              {t}
            </span>
            <span
              style={{ background: p.secundario }}
              className="block h-8 w-full rounded-[3px]"
            />
          </div>
        </div>
      ))}
    </div>
  ),

  testimonios: (p) => (
    <div className="flex size-full flex-col gap-2 p-3">
      <Titular p={p}>Quién ya lo usa</Titular>
      <div className="grid flex-1 grid-cols-2 gap-1.5">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            style={{ background: p.secundario }}
            className="flex flex-col gap-1 rounded-[3px] p-1.5"
          >
            <span
              style={{ background: p.texto, opacity: 0.2 + (i % 3) * 0.08 }}
              className="size-3.5 rounded-full"
            />
            <div className="flex gap-[1px]">
              {[0, 1, 2, 3, 4].map((s) => (
                <span key={s} style={{ background: p.energia }} className="size-[3px] rounded-[1px]" />
              ))}
            </div>
            <Barra ancho="90%" color={p.texto} alto={2} />
            <Barra ancho="60%" color={p.texto} alto={2} />
          </div>
        ))}
      </div>
    </div>
  ),

  autoridad: (p) => (
    <div className="flex size-full flex-col p-3">
      <div
        style={{ background: p.secundario }}
        className="relative flex-1 overflow-hidden rounded-[4px]"
      >
        <span
          style={{ background: p.texto, opacity: 0.22 }}
          className="absolute bottom-0 left-1/2 h-[70%] w-[52%] -translate-x-1/2 rounded-t-[40%]"
        />
        <span
          style={{ background: p.texto, opacity: 0.3 }}
          className="absolute left-1/2 top-[14%] size-8 -translate-x-1/2 rounded-full"
        />
      </div>
      <div className="mt-2 flex flex-col gap-1">
        <span style={{ color: p.texto }} className="text-[0.48rem] italic opacity-85">
          «El colágeno tipo I con vitamina C sí tiene evidencia.»
        </span>
        <span style={{ color: p.energia }} className="mono-sm text-[0.42rem]">
          Dra. Elena Restrepo · dermatóloga
        </span>
      </div>
    </div>
  ),

  confianza: (p) => (
    <div className="flex size-full flex-col items-center justify-center gap-3 p-3">
      <Titular p={p}>Compra sin riesgo</Titular>
      <div className="flex gap-2">
        {["COD", "INVIMA", "30d"].map((t) => (
          <div key={t} className="flex flex-col items-center gap-1">
            <span
              style={{
                background: `linear-gradient(135deg, ${p.energia}, ${p.acento} 46%, ${p.secundario})`,
              }}
              className="grid size-7 place-items-center rounded-full shadow-[0_3px_8px_-3px_rgba(0,0,0,0.7)]"
            >
              <span
                style={{ borderColor: "rgba(0,0,0,0.25)" }}
                className="size-5 rounded-full border"
              />
            </span>
            <span style={{ color: p.texto }} className="mono-sm text-[0.4rem] opacity-75">
              {t}
            </span>
          </div>
        ))}
      </div>
      <span style={{ color: p.energia }} className="mono-sm text-[0.42rem]">
        Pagas cuando lo recibes
      </span>
    </div>
  ),

  precios: (p) => (
    <div className="flex size-full flex-col gap-2 p-3">
      <Titular p={p}>Elige tu tratamiento</Titular>
      <div className="flex flex-1 items-center gap-1.5">
        {[
          { n: "1", precio: "$129.900", alto: "68%" },
          { n: "3", precio: "$299.900", alto: "88%" },
          { n: "6", precio: "$519.900", alto: "68%" },
        ].map((o, i) => (
          <div
            key={o.n}
            style={{
              background: p.secundario,
              height: o.alto,
              borderColor: i === 1 ? p.acento : "transparent",
            }}
            className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[4px] border"
          >
            <span style={{ color: p.texto }} className="text-[0.55rem] opacity-90">
              {o.n}
            </span>
            <span style={{ color: i === 1 ? p.energia : p.texto }} className="mono-sm text-[0.4rem]">
              {o.precio}
            </span>
          </div>
        ))}
      </div>
      <span
        style={{ background: p.acento, color: p.fondo }}
        className="rounded-[3px] py-1 text-center text-[0.45rem] font-medium"
      >
        Pedir ahora
      </span>
    </div>
  ),

  "estilo-de-vida": (p) => (
    <div className="relative size-full">
      <div
        style={{
          background: `linear-gradient(160deg, ${p.secundario}, ${p.fondo} 60%), radial-gradient(80% 50% at 30% 20%, ${p.energia}33, transparent)`,
        }}
        className="absolute inset-0"
      />
      <span
        style={{ background: p.texto, opacity: 0.16 }}
        className="absolute bottom-[18%] left-[12%] h-[42%] w-[34%] rounded-t-[45%]"
      />
      <Frasco className="absolute bottom-[16%] right-[14%] h-[30%] w-auto" />
      <div className="absolute inset-x-3 bottom-3">
        <span style={{ color: p.texto }} className="text-[0.5rem] opacity-90">
          Cada mañana, antes del café
        </span>
      </div>
    </div>
  ),
};
