import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PAQUETE_EXTRA, PLANES, CREDITOS_BIENVENIDA } from "@/lib/planes";

import { formatoUSD } from "@/lib/formato";
import { traductor } from "@/lib/i18n/servidor";

/**
 * Páginas legales. Están escritas en el mismo registro que el resto del
 * producto: §3.3 dice que la letra pequeña oculta destruye la confianza del
 * comprador, así que aquí no hay letra pequeña.
 */

type Doc = { titulo: string; entrada: string; secciones: { h: string; p: string[] }[] };

const DOCS: Record<string, Doc> = {
  terminos: {
    titulo: "Términos",
    entrada:
      "Esto es lo que aceptas al usar LandingForge, dicho sin fórmulas que nadie lee.",
    secciones: [
      {
        h: "Qué entrega LandingForge",
        p: [
          "LandingForge construye y valida prompts de generación de imagen para las secciones de una landing page, y asigna una paleta de marca a tu producto.",
          "No es un constructor de sitios web, no provee hosting y no publica tu página. Lo que recibes es el paquete visual y su copy.",
        ],
      },
      {
        h: "De quién es lo que generas",
        p: [
          "Los prompts y las campañas que generas son tuyos. Los puedes exportar, editar y usar donde quieras, también fuera de LandingForge.",
          "Nos reservamos el derecho de usar datos agregados y anonimizados sobre el uso del producto para mejorarlo. Nunca tu contenido concreto ni tus fotos.",
        ],
      },
      {
        h: "Lo que no podemos garantizar",
        p: [
          "La salida de un modelo generativo varía. La metodología reduce mucho la variación, pero no la elimina.",
          "Tú eres responsable de revisar que lo que publicas cumpla la regulación aplicable a tu producto, incluido el registro sanitario de tu país —INVIMA, COFEPRIS, FDA u otro— cuando corresponda. LandingForge no valida afirmaciones de salud.",
        ],
      },
      {
        h: "Cuentas y suspensión",
        p: [
          "Una cuenta es de una persona o de una empresa. Si detectamos uso automatizado que degrade el servicio para los demás, podemos limitar la cuenta y te avisamos por correo antes.",
        ],
      },
    ],
  },
  privacidad: {
    titulo: "Privacidad",
    entrada: "Qué guardamos, dónde y por cuánto tiempo.",
    secciones: [
      {
        h: "Qué guardamos",
        p: [
          "Tu correo y una versión cifrada de tu contraseña, que no se puede revertir. Nunca vemos tu contraseña.",
          "Las campañas que creas: el producto que describiste, la foto que subiste, la paleta asignada y los prompts generados.",
          "El historial de consumo de créditos, porque es la base de tu facturación.",
        ],
      },
      {
        h: "Qué no guardamos",
        p: [
          "Las conversaciones con el asistente no se persisten: viven en la memoria de tu sesión y desaparecen al cerrar la pestaña.",
          "No usamos rastreadores de terceros ni vendemos datos a nadie.",
        ],
      },
      {
        h: "Terceros",
        p: [
          "Los prompts se redactan con la API de Gemini de Google. Eso significa que el texto de tu producto y su descripción viajan a ese servicio para procesarse. Tus credenciales nunca salen de nuestro servidor.",
        ],
      },
      {
        h: "Borrar tu cuenta",
        p: [
          "Escribe a hola@landingforge.co y borramos tu cuenta y todas tus campañas. No queda una copia de respaldo indefinida.",
        ],
      },
    ],
  },
  creditos: {
    titulo: "Política de créditos",
    entrada: "Cómo se consumen, qué caduca y por qué los planes traen holgura.",
    secciones: [
      {
        h: "Qué es un crédito",
        p: [
          "Un crédito equivale a una generación: una sección con su prompt construido y validado, y su imagen 9:16 en calidad máxima.",
          "Cada intento consume un crédito, salga como salga. Repetir una sección para probar otra idea también.",
        ],
      },
      {
        h: "Cuándo se descuentan",
        p: [
          "Se descuentan al iniciar la generación, antes de gastar ningún token, y solo si te alcanzan. Si no te alcanzan, el botón te dice exactamente cuántos faltan y no se cobra nada.",
        ],
      },
      {
        h: "Por qué no hay devolución automática",
        p: [
          "Una sección que falla ya se produjo, y una devolución automática se puede reclamar después de haberla visto. Ese agujero encarecería el producto para todos, así que la compensación no es un botón: es el diseño del plan.",
          "Por eso el formulario pregunta lo que pregunta —producto, audiencia, mercado, beneficio y precio—: cuanta mejor sea la entrada, menos intentos hacen falta. Y por eso los planes traen holgura: 30 secciones en el de entrada y 120 en el siguiente, muchas más de las nueve de una campaña.",
          "Si el fallo es nuestro y no tuyo, escribe a hola@landingforge.co con el nombre de la campaña. El equipo puede ajustar tus créditos a mano, y ese ajuste queda registrado en tu historial con su motivo.",
        ],
      },
      {
        h: "Caducidad",
        p: [
          "Los créditos incluidos en tu plan no se acumulan entre meses: se reinician en la fecha de renovación.",
          "Los créditos que compras aparte sí se acumulan y no caducan mientras tu cuenta esté activa.",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ doc: string }>;
}): Promise<Metadata> {
  const { doc } = await params;
  const t = await traductor();
  return { title: t(DOCS[doc]?.titulo ?? "Legal") };
}

export default async function Legal({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const contenido = DOCS[doc];
  if (!contenido) notFound();
  const t = await traductor();

  return (
    <article className="mx-auto max-w-[760px] px-4 py-16 sm:px-8">
      <h1 className="display-lg">{t(contenido.titulo)}</h1>
      <p className="mt-6 cuerpo-lg text-smoke medida">{t(contenido.entrada)}</p>

      {contenido.secciones.map((s) => (
        <section key={s.h} className="mt-12 border-t border-[var(--scale)] pt-8">
          <h2 className="titulo">{t(s.h)}</h2>
          {s.p.map((parrafo, i) => (
            <p key={i} className="mt-3 cuerpo text-smoke medida">
              {t(parrafo)}
            </p>
          ))}
        </section>
      ))}

      {doc === "creditos" && (
        <section className="mt-12 border-t border-[var(--scale)] pt-8">
          <h2 className="titulo">{t("Los números, hoy")}</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {PLANES.map((p) => (
              <li key={p.id} className="mono-sm text-smoke">
                {t("{plan} · {precio} / mes · {n} secciones", {
                  plan: t(p.nombre),
                  precio: formatoUSD(p.precioMensualUSD),
                  n: p.creditosMes,
                })}
                {p.medida === "por-uso" &&
                  t(" · extra a {precio}, sin tope", {
                    precio: formatoUSD(p.precioSeccionUSD ?? 0),
                  })}
              </li>
            ))}
            <li className="mono-sm text-smoke">
              {t("Paquete extra · {precio} · {n} secciones", {
                precio: formatoUSD(PAQUETE_EXTRA.precioUSD),
                n: PAQUETE_EXTRA.creditos,
              })}
            </li>
            <li className="mono-sm text-smoke">
              {t("Registro · {n} créditos gratis, sin tarjeta", { n: CREDITOS_BIENVENIDA })}
            </li>
          </ul>
        </section>
      )}
    </article>
  );
}
