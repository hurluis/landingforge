import type { Metadata } from "next";
import { Sparkle, Trash } from "@phosphor-icons/react/dist/ssr";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Badge, Chip, Dato, Fotograma, Hairline, Sello } from "@/components/ui/piezas";
import { Acordeon } from "@/components/ui/acordeon";
import { Validador } from "@/components/campana/validador";
import { Lamina } from "@/components/marketing/lamina";
import { asignarPaleta, swatches } from "@/lib/metodologia/paletas";
import { validarPrompt } from "@/lib/metodologia/reglas-prompt";
import { contarPalabras } from "@/lib/formato";
import { KitInteractivo } from "./interactivo";

export const metadata: Metadata = { title: "Kit", robots: { index: false } };

/**
 * Página interna del sistema de diseño — entregable de la fase 1 (§15).
 * Todas las primitivas en todos sus estados, para poder verlas juntas y
 * detectar una inconsistencia antes de que se propague a diez pantallas.
 */

const PALETA = asignarPaleta("skincare-lujo", { genero: "f", edadMin: 28, edadMax: 50 });

const PROMPT_ROTO = `Fotografía de producto, 4K, hyperrealistic, best quality, estudio, luz suave, fondo limpio, 85mm, bokeh, premium.

Titular «Resultados perfectos garantizados en solo ocho semanas» arriba.`;

function Bloque({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-[var(--scale)] py-12">
      <h2 className="display-md">{titulo}</h2>
      {nota && <p className="mt-2 cuerpo text-smoke medida">{nota}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

export default function Kit() {
  const advertencias = validarPrompt(PROMPT_ROTO);

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-16 sm:px-8">
      <h1 className="display-lg">Kit</h1>
      <p className="mt-4 cuerpo-lg text-smoke medida">
        Las primitivas del sistema, en todos sus estados. Página interna: si algo aquí se ve
        raro, se ve raro en todo el producto.
      </p>

      <Bloque titulo="Tipografía" nota="Fraunces para display, Geist para UI, Geist Mono para datos.">
        <div className="flex flex-col gap-4">
          <p className="display-xl">Display XL</p>
          <p className="display-lg">Display LG</p>
          <p className="display-md">Display MD</p>
          <p className="titulo">Título de sección</p>
          <p className="cuerpo-lg text-smoke">
            Cuerpo grande. La medida de lectura se mantiene entre 65 y 75 caracteres para que
            el ojo no tenga que buscar el principio de la línea siguiente.
          </p>
          <p className="cuerpo text-smoke">Cuerpo.</p>
          <p className="etiqueta text-slag">Etiqueta</p>
          <p className="mono-sm text-slag">mono-sm · 9:16 · #D6A75C · 1.240 palabras</p>
        </div>
      </Bloque>

      <Bloque titulo="Color" nota="El chrome es desaturado. El color del cliente es el único fuerte en pantalla.">
        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <p className="etiqueta text-smoke">Chrome</p>
            <ul className="mt-3 grid grid-cols-4 gap-2">
              {[
                ["--void", "#0B0B0C"],
                ["--anvil", "#121214"],
                ["--anvil-hi", "#1A1A1D"],
                ["--sunk", "#080809"],
                ["--scale", "#26262B"],
                ["--scale-hi", "#35353C"],
                ["--ash", "#F2EFEA"],
                ["--smoke", "#A7A29B"],
              ].map(([nombre, hex]) => (
                <li key={nombre} className="flex flex-col gap-1">
                  <span
                    style={{ background: hex }}
                    className="block h-12 rounded-[6px] border border-[var(--scale)]"
                  />
                  <span className="mono-sm text-slag text-[0.6875rem]">{hex}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="etiqueta text-smoke">Paleta del cliente, a plena saturación</p>
            <ul className="mt-3 grid grid-cols-5 gap-2">
              {swatches(PALETA).map((s) => (
                <li key={s.rol} className="flex flex-col gap-1">
                  <span
                    style={{ background: s.hex }}
                    className="block h-12 rounded-[6px] border border-[var(--scale)]"
                  />
                  <span className="mono-sm text-slag text-[0.6875rem]">{s.hex}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 cuerpo text-slag">{PALETA.nombre}: {PALETA.razon}</p>
          </div>
        </div>
      </Bloque>

      <Bloque
        titulo="Botón"
        nota="Seis estados. El hover está gated con (hover: hover) and (pointer: fine); el press vive en :active."
      >
        <div className="flex flex-col gap-6">
          {(["heat", "contorno", "fantasma", "peligro"] as const).map((v) => (
            <div key={v} className="flex flex-wrap items-center gap-3">
              <span className="mono-sm text-slag w-24">{v}</span>
              <Boton variante={v}>Reposo</Boton>
              <Boton variante={v} disabled>
                Deshabilitado
              </Boton>
              <Boton variante={v} cargando textoCargando="Generando…">
                Generar
              </Boton>
              <Boton variante={v} tamano="sm">
                Pequeño
              </Boton>
              <Boton variante={v} tamano="lg">
                Grande
              </Boton>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <span className="mono-sm text-slag w-24">enlace</span>
            <BotonEnlace href="#">Ver una campaña completa</BotonEnlace>
          </div>
        </div>
      </Bloque>

      <Bloque titulo="Campos, select y chips">
        <KitInteractivo />
      </Bloque>

      <Bloque titulo="Badges, sellos y datos">
        <div className="flex flex-wrap items-center gap-4">
          <Badge>neutro</Badge>
          <Badge tono="ok">lista</Badge>
          <Badge tono="aviso">parcial</Badge>
          <Badge tono="peligro">error</Badge>
          <Badge tono="maquina">generando</Badge>
          <Badge tono="metal">plan actual</Badge>
          <Chip>chip</Chip>
          <Chip activo>chip activo</Chip>
          <Sello tamano={48}>
            <Sparkle className="size-5" />
          </Sello>
          <Sello tamano={64}>
            <Trash  className="size-6" />
          </Sello>
          <Dato>9:16 · 2K</Dato>
        </div>
        <Hairline className="mt-8" />
      </Bloque>

      <Bloque
        titulo="Fotograma 9:16"
        nota="La unidad atómica de composición. El activo gana la hairline metálica."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Fotograma>
            <Lamina tipologia="hero" paleta={PALETA} />
          </Fotograma>
          <Fotograma activo>
            <Lamina tipologia="antes-despues" paleta={PALETA} />
          </Fotograma>
          <Fotograma>
            <Lamina tipologia="testimonios" paleta={PALETA} />
          </Fotograma>
          <Fotograma className="barrido-calor">
            <Lamina tipologia="confianza" paleta={PALETA} />
          </Fotograma>
        </div>
        <p className="mt-3 mono-sm text-slag">
          El cuarto lleva el barrido de luz de contorno: es el estado «generando».
        </p>
      </Bloque>

      <Bloque
        titulo="Validador"
        nota="Corriendo de verdad sobre un prompt mal escrito: keywords, palabras de la lista negra, titular de más de 25 caracteres y sin bloque de paleta."
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <pre className="rounded-[12px] border border-[var(--scale)] bg-[var(--sunk)] p-4 mono-sm whitespace-pre-wrap text-smoke">
            {PROMPT_ROTO}
          </pre>
          <Validador advertencias={advertencias} palabras={contarPalabras(PROMPT_ROTO)} />
        </div>
      </Bloque>

      <Bloque titulo="Acordeón" nota="El único sitio donde se anima height, porque no hay equivalente con transform.">
        <Acordeon
          items={[
            { id: "a", pregunta: "¿Se puede animar height aquí?", respuesta: <p>Sí, y solo aquí. 200ms, porque cuesta layout en cada frame.</p> },
            { id: "b", pregunta: "¿Y en el resto del producto?", respuesta: <p>No. transform y opacity, más clip-path y filter donde el inventario lo autoriza.</p> },
          ]}
        />
      </Bloque>
    </main>
  );
}
