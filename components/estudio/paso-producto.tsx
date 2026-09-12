"use client";

import * as React from "react";
import Image from "next/image";
import { ImageSquare, X } from "@phosphor-icons/react/dist/ssr";
import { toast } from "sonner";
import { Campo, AreaTexto } from "@/components/ui/campo";
import { cn } from "@/lib/utils";
import type { EstadoEstudio } from "./estado";
import { useT } from "@/lib/i18n/cliente";

/**
 * Paso 1 — El producto (§7.1).
 * Se requiere imagen O descripción, no ambas. La imagen se reescala en el
 * navegador antes de subirla: 8MB de JPEG original se convierten en ~200KB,
 * y así la campaña cabe holgadamente en la base de datos.
 */

const MAX_BYTES = 8 * 1024 * 1024;
const TIPOS = ["image/jpeg", "image/png", "image/webp"];
const LADO_MAXIMO = 1024;

async function reescalar(archivo: File): Promise<string> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  const ancho = Math.round(bitmap.width * escala);
  const alto = Math.round(bitmap.height * escala);
  const lienzo = document.createElement("canvas");
  lienzo.width = ancho;
  lienzo.height = alto;
  const ctx = lienzo.getContext("2d");
  if (!ctx) throw new Error("No se pudo procesar la imagen.");
  ctx.drawImage(bitmap, 0, 0, ancho, alto);
  bitmap.close();
  return lienzo.toDataURL("image/jpeg", 0.82);
}

export function PasoProducto({
  estado,
  cambiar,
}: {
  estado: EstadoEstudio;
  cambiar: (parcial: Partial<EstadoEstudio>) => void;
}) {
  const t = useT();
  const [arrastrando, setArrastrando] = React.useState(false);
  const [procesando, setProcesando] = React.useState(false);
  const entrada = React.useRef<HTMLInputElement>(null);

  const recibir = React.useCallback(
    async (archivo: File | undefined) => {
      if (!archivo) return;
      if (!TIPOS.includes(archivo.type)) {
        toast.error(t("Formato no admitido"), { description: t("Acepta JPG, PNG o WebP.") });
        return;
      }
      if (archivo.size > MAX_BYTES) {
        toast.error(t("La imagen pesa demasiado"), {
          description: `El límite es 8MB y esta pesa ${(archivo.size / 1024 / 1024).toFixed(1)}MB.`,
        });
        return;
      }
      setProcesando(true);
      try {
        cambiar({ imagenUrl: await reescalar(archivo) });
      } catch {
        toast.error(t("No se pudo leer la imagen"), { description: t("Prueba con otro archivo.") });
      } finally {
        setProcesando(false);
      }
    },
    [cambiar, t],
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        {/* Zona de carga */}
        <div className="flex flex-col gap-2">
          <span className="etiqueta text-smoke">{t("Foto del producto")}</span>
          {estado.imagenUrl ? (
            <div className="relative aspect-[9/16] overflow-hidden rounded-[12px] border border-[var(--scale)] bg-[var(--sunk)]">
              <Image
                src={estado.imagenUrl}
                alt={t("Vista previa de la foto de tu producto")}
                fill
                unoptimized
                sizes="280px"
                className="object-contain"
              />
              <button
                type="button"
                onClick={() => cambiar({ imagenUrl: undefined })}
                aria-label={t("Quitar la foto")}
                className={cn(
                  "absolute right-2 top-2 grid size-8 place-items-center rounded-[8px]",
                  "bg-[var(--anvil-hi)] text-smoke border border-[var(--scale)]",
                  "transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-ash active:scale-[0.97]",
                )}
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => entrada.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                void recibir(e.dataTransfer.files[0]);
              }}
              className={cn(
                "flex aspect-[9/16] flex-col items-center justify-center gap-3 rounded-[12px] p-6 text-center",
                "border border-dashed bg-[var(--anvil)]",
                "transition-[border-color,background-color] duration-[140ms] ease-[var(--ease-out)]",
                arrastrando
                  ? "border-[var(--heat)] bg-[var(--anvil-hi)]"
                  : "border-[var(--scale-hi)] hf:border-[var(--heat)]",
                procesando && "barrido-calor",
              )}
            >
              <ImageSquare  className="size-6 text-slag" />
              <span className="cuerpo text-smoke">
                {procesando ? t("Procesando la imagen…") : t("Arrastra la foto o haz clic")}
              </span>
              <span className="mono-sm text-slag">{t("JPG · PNG · WebP · hasta 8MB")}</span>
            </button>
          )}
          <input
            ref={entrada}
            type="file"
            accept={TIPOS.join(",")}
            className="sr-only"
            onChange={(e) => void recibir(e.target.files?.[0])}
          />
        </div>

        <div className="flex flex-col gap-5">
          <Campo
            id="nombre"
            etiqueta={t("Nombre del producto")}
            value={estado.nombre}
            onChange={(e) => cambiar({ nombre: e.target.value })}
            placeholder={t("Colágeno Verisol 60 cápsulas")}
            maxLength={80}
            required
          />
          <AreaTexto
            id="descripcion"
            etiqueta={t("Descripción")}
            value={estado.descripcion}
            onChange={(e) => cambiar({ descripcion: e.target.value })}
            placeholder={t("Colágeno hidrolizado tipo I con vitamina C, en cápsulas, para firmeza de la piel.")}
            limite={400}
            ayuda={t("Una o dos líneas. Se usa para describir el sujeto en cada prompt.")}
            opcional={Boolean(estado.imagenUrl)}
          />
          <p className="mono-sm text-slag">
            {t("Se requiere la foto o la descripción. Con las dos, las piezas salen más fieles.")}
          </p>
        </div>
      </div>
    </div>
  );
}
