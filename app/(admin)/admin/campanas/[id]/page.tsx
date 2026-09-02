import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { repositorioAdmin } from "@/lib/datos/admin-sqlite";
import { fechaLarga, formatoCOP, numero } from "@/lib/formato";
import { ETIQUETA_REGLA, ETIQUETA_TIPOLOGIA } from "@/lib/etiquetas-admin";
import { Badge } from "@/components/ui/piezas";
import { BorrarCampana } from "@/components/admin/borrar-campana";
import { Cifra, Panel } from "@/components/admin/piezas-admin";

export const metadata: Metadata = { title: "Campaña" };
export const dynamic = "force-dynamic";

const TONO_ESTADO = {
  borrador: "neutro",
  generando: "metal",
  lista: "ok",
  error: "peligro",
} as const;

/**
 * F-A3 · Detalle de una campaña, en solo lectura.
 *
 * Los prompts se muestran completos con sus advertencias porque diagnosticar
 * un caso de soporte exige ver exactamente lo que vio el usuario. Lo que no
 * hay es un campo editable: no existe ruta en el servidor para modificar la
 * campaña de otro, así que no es una restricción de interfaz que se pueda
 * saltar abriendo las herramientas del navegador.
 */
export default async function PaginaCampanaAdmin({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ficha = await repositorioAdmin().campanaCompleta(id);
  if (!ficha) notFound();

  const { campana, email } = ficha;
  const bloqueos = campana.prompts.flatMap((p) =>
    p.advertencias.filter((a) => a.severidad === "bloqueo"),
  ).length;
  const avisos = campana.prompts.flatMap((p) =>
    p.advertencias.filter((a) => a.severidad === "aviso"),
  ).length;

  return (
    <div className="mx-auto max-w-[1000px] px-4 py-8 pt-20 sm:px-8 lg:pt-8">
      <Link
        href="/admin/campanas"
        className="inline-flex items-center gap-2 etiqueta text-slag no-underline hf:text-ash"
      >
        <ArrowLeft className="size-4" />
        Volver a campañas
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="display-md">{campana.nombre}</h1>
          <p className="mt-2 cuerpo text-smoke">
            {campana.producto.nombre} · de{" "}
            <Link
              href={`/admin/usuarios/${campana.usuarioId}`}
              className="text-[var(--quench)] no-underline hf:underline"
            >
              {email}
            </Link>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tono={TONO_ESTADO[campana.estado]}>{campana.estado}</Badge>
            <Badge tono="neutro">{campana.paleta.nombre}</Badge>
            {campana.seccionesFallidas.length > 0 && (
              <Badge tono="aviso">
                {campana.seccionesFallidas.length} secciones fallidas
              </Badge>
            )}
          </div>
        </div>
        <BorrarCampana campanaId={campana.id} nombre={campana.nombre} dueno={email} />
      </header>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cifra etiqueta="Prompts" valor={campana.prompts.length} />
        <Cifra
          etiqueta="Bloqueos"
          valor={bloqueos}
          tono={bloqueos > 0 ? "calor" : "neutro"}
          nota={bloqueos === 0 ? "ninguno" : "impiden generar imagen"}
        />
        <Cifra etiqueta="Avisos" valor={avisos} />
        <Cifra
          etiqueta="Precio del producto"
          valor={formatoCOP(campana.producto.precioCOP)}
          nota={`creada el ${fechaLarga(campana.creadaEn)}`}
        />
      </div>

      {/* Paleta asignada por la matriz de la metodología. */}
      <Panel titulo="Paleta asignada" className="mt-4">
        <p className="-mt-2 cuerpo text-slag medida">{campana.paleta.razon}</p>
        <ul className="mt-5 flex flex-wrap gap-4">
          {(
            [
              ["fondo", campana.paleta.fondo],
              ["acento", campana.paleta.acento],
              ["texto", campana.paleta.texto],
              ["secundario", campana.paleta.secundario],
              ["energía", campana.paleta.energia],
            ] as const
          ).map(([nombre, hex]) => (
            <li key={nombre} className="flex items-center gap-2.5">
              <span
                aria-hidden
                style={{ background: hex }}
                className="size-8 shrink-0 rounded-[8px] border border-[var(--scale)]"
              />
              <span className="mono-sm text-slag">
                {nombre}
                <span className="block text-smoke">{hex}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      {/* Prompts, tal cual los vio el usuario. */}
      <section aria-labelledby="prompts-titulo" className="mt-10">
        <h2 id="prompts-titulo" className="titulo">
          Prompts generados
        </h2>
        <p className="mt-2 cuerpo text-slag medida">
          En solo lectura. Esta pantalla sirve para entender qué produjo la metodología,
          no para corregirlo por encima del usuario.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {campana.prompts.length === 0 && (
            <p className="cuerpo text-smoke">Esta campaña no llegó a generar ningún prompt.</p>
          )}

          {campana.prompts.map((p) => (
            <article
              key={p.id}
              className="rounded-[16px] border border-[var(--scale)] bg-[var(--anvil)] p-6"
            >
              <header className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="titulo">{ETIQUETA_TIPOLOGIA[p.tipologia]}</h3>
                <span className="mono-sm text-slag">{numero(p.palabras)} palabras</span>
              </header>

              {p.advertencias.length > 0 && (
                <ul className="mt-4 flex flex-col gap-2">
                  {p.advertencias.map((a, i) => (
                    <li key={`${a.regla}-${i}`} className="flex flex-wrap items-baseline gap-2">
                      <Badge tono={a.severidad === "bloqueo" ? "peligro" : "aviso"}>
                        {a.severidad}
                      </Badge>
                      <span className="etiqueta text-smoke">{ETIQUETA_REGLA[a.regla]}</span>
                      <span className="mono-sm text-slag">{a.detalle}</span>
                    </li>
                  ))}
                </ul>
              )}

              <pre className="mt-5 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-[10px] bg-[var(--sunk)] p-4 font-[family-name:var(--font-geist-mono)] text-[0.8125rem] leading-relaxed text-smoke">
                {p.texto}
              </pre>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
