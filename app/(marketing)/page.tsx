import Link from "next/link";
import { Boton, BotonEnlace } from "@/components/ui/boton";
import { Forja } from "@/components/marketing/forja";
import { TiraContactos } from "@/components/marketing/tira-contactos";
import { BloqueMetodologia } from "@/components/marketing/bloque-metodologia";
import { EstudioVivo } from "@/components/marketing/estudio-vivo";
import { TablaPrecios } from "@/components/marketing/tabla-precios";
import { Preguntas } from "@/components/marketing/preguntas";
import { Revelar, Escalonado } from "@/components/ui/revelar";

/**
 * Home — §6.2. El copy es el definitivo del brief, se usa tal cual.
 *
 * Cada sección entra de una forma distinta, derivada de su contenido (§5.3).
 * Ninguna repite la dirección de otra, y el cierre no se mueve.
 */

const CONSECUENCIAS = [
  {
    afirmacion: "Misma estructura para todos los productos",
    consecuencia: "Tu producto premium se ve como el genérico de al lado",
  },
  {
    afirmacion: "Caras de stock o caras de IA evidentes",
    consecuencia: "El comprador desconfía antes de leer el precio",
  },
  {
    afirmacion: "Cero señales del mercado local",
    consecuencia: "Pagas tráfico que no convierte",
  },
];

const PASOS = [
  {
    titulo: "Cuéntale a LandingForge sobre tu producto.",
    texto:
      "Subes la foto y respondes cuatro preguntas: qué es, para quién, cuál es el beneficio principal y cuánto cuesta.",
  },
  {
    titulo: "LandingForge asigna paleta y secciones.",
    texto:
      "La matriz cruza tipo de producto, audiencia y registro emocional. Ves la paleta con sus hex antes de generar nada.",
  },
  {
    titulo: "Recibes la campaña completa.",
    texto:
      "Los nueve prompts construidos en prosa narrativa, validados y listos para generar. Los puedes editar, versionar y volver a correr.",
  },
];

export default function Home() {
  return (
    <>
      {/* ---------------- Hero (§6.2.2) ---------------- */}
      <section aria-labelledby="hero-titulo" className="pt-16 pb-24 sm:pt-24">
        <div className="mx-auto grid max-w-[1200px] gap-16 px-4 sm:px-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <h1 id="hero-titulo" className="display-xl">
              Tu producto no se parece a ningún otro.
              <br />
              Tu landing tampoco debería.
            </h1>

            <p className="mt-8 cuerpo-lg text-mid max-w-[60ch]">
              Sube la foto. LandingForge elige la paleta, escribe el copy y construye las nueve
              secciones que hacen vender en Colombia. Ninguna plantilla de por medio.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Boton asChild variante="primario" tamano="lg">
                <Link href="/app/nueva">Crear mi primera landing</Link>
              </Boton>
              <BotonEnlace href="#tira-titulo">Ver una campaña completa</BotonEnlace>
            </div>

            {/* Especificaciones del producto, no una fila de stats decorativa. */}
            <p className="mt-10 mono-sm text-lo">
              9 tipologías de sección · 9:16 · 2K · prompts editables, no bloqueados
            </p>
          </div>

          <div className="lg:col-span-7">
            <Forja />
          </div>
        </div>
      </section>

      {/* ---------------- El problema (§6.2.3) ----------------
          Sección de contraste, no de tarjetas. Entra desde arriba: es un
          argumento que se lee de arriba abajo. */}
      <Revelar as="section" desde="arriba" aria-labelledby="problema-titulo" className="py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <div className="grid gap-10 md:grid-cols-[0.9fr_1px_1.1fr] md:gap-12">
            <h2 id="problema-titulo" className="display-lg">
              Las plantillas venden lo mismo diez mil veces.
            </h2>
            <div aria-hidden className="hidden md:block w-px bg-[var(--line)]" />
            <p className="cuerpo-lg text-mid medida">
              Un constructor de plantillas te da la misma estructura que a tus competidores,
              con imágenes de stock o caras generadas que se notan a un kilómetro. Y ninguno
              sabe que en Colombia la venta se cierra con contraentrega, que un suplemento sin
              INVIMA no genera confianza, y que un precio escrito{" "}
              <span className="mono-sm text-hi">$99,900</span> en vez de{" "}
              <span className="mono-sm text-hi">$99.900</span> le dice a tu comprador que no
              eres de aquí.
            </p>
          </div>

          {/* Ritmo editorial, no rejilla: pares afirmación → consecuencia. */}
          <ul className="mt-16">
            {CONSECUENCIAS.map((c) => (
              <li
                key={c.afirmacion}
                className="grid gap-2 border-t border-[var(--line)] py-6 sm:grid-cols-2 sm:gap-12"
              >
                <p className="titulo text-hi text-balance">{c.afirmacion}</p>
                <p className="cuerpo text-lo sm:pl-8">{c.consecuencia}</p>
              </li>
            ))}
          </ul>
        </div>
      </Revelar>

      {/* ---------------- La tira de contactos (§6.2.4) ---------------- */}
      <TiraContactos />

      {/* ---------------- La metodología colombiana (§6.2.5) ---------------- */}
      <BloqueMetodologia />

      {/* ---------------- Cómo funciona (§6.2.6) ----------------
          Aquí los pasos numerados SÍ están ganados: la secuencia es
          obligatoria y el usuario necesita saber el orden. */}
      <section aria-labelledby="pasos-titulo" className="py-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
          <h2 id="pasos-titulo" className="display-lg medida">
            Once minutos, en tres pasos.
          </h2>

          <Escalonado as="ol" className="mt-16 grid gap-10 md:grid-cols-3">
            {PASOS.map((p, i) => (
              <li key={p.titulo} className="flex flex-col gap-4">
                <span
                  aria-hidden
                  className="font-[family-name:var(--font-fraunces)] text-[3rem] font-[300] leading-none tracking-[-0.03em] text-lo"
                >
                  {i + 1}
                </span>
                <h3 className="titulo text-hi text-balance">{p.titulo}</h3>
                <p className="cuerpo text-mid">{p.texto}</p>
              </li>
            ))}
          </Escalonado>

          <p className="mt-12 cuerpo-lg text-mid medida border-t border-[var(--line)] pt-8">
            Te llevas los prompts, no solo las imágenes. Si mañana dejas de usar LandingForge,
            tu trabajo sigue siendo tuyo.
          </p>
        </div>
      </section>

      {/* ---------------- El estudio en vivo (§6.2.7) ---------------- */}
      <EstudioVivo />

      {/* ---------------- Precios (§6.2.8) ---------------- */}
      <TablaPrecios compacta />

      {/* ---------------- Preguntas (§6.2.9) ---------------- */}
      <Preguntas />

      {/* ---------------- Cierre (§6.2.10) ----------------
          SIN animación de entrada. Que esta sección esté quieta es lo que la
          hace pesar, después de una página en movimiento. */}
      <section aria-labelledby="cierre-titulo" className="py-32">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-8 text-center">
          <h2 id="cierre-titulo" className="display-lg mx-auto max-w-[16ch]">
            La primera campaña te toma once minutos.
          </h2>
          <div className="mt-10 flex justify-center">
            <Boton asChild variante="primario" tamano="lg">
              <Link href="/app/nueva">Crear mi primera landing</Link>
            </Boton>
          </div>
        </div>
      </section>
    </>
  );
}
