import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { repositorioAdmin } from "@/lib/datos";
import { fechaLarga, formatoPrecio, numero } from "@/lib/formato";
import { mercadoDe } from "@/lib/metodologia/mercados";
import { ETIQUETA_REGLA, ETIQUETA_TIPOLOGIA } from "@/lib/etiquetas-admin";
import { Badge } from "@/components/ui/piezas";
import { BorrarCampana } from "@/components/admin/borrar-campana";
import { ANCHO, Banda, Cifra, Cifras, Seccion } from "@/components/panel/piezas";
import { cn } from "@/lib/utils";

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
  const mercado = mercadoDe(campana.producto);
  const bloqueos = campana.prompts.flatMap((p) =>
    p.advertencias.filter((a) => a.severidad === "bloqueo"),
  ).length;
  const avisos = campana.prompts.flatMap((p) =>
    p.advertencias.filter((a) => a.severidad === "aviso"),
  ).length;

  const swatches = [
    ["fondo", campana.paleta.fondo],
    ["acento", campana.paleta.acento],
    ["texto", campana.paleta.texto],
    ["secundario", campana.paleta.secundario],
    ["energía", campana.paleta.energia],
  ] as const;

  return (
    <>
      <Banda
        fotograma="/secuencia/0300.jpg"
        encuadre="56% 50%"
        alto="media"
        volver={{ href: "/admin/campanas", texto: "Volver a campañas" }}
        rotulo="Campaña"
        titulo={campana.nombre}
        descripcion={
          <>
            {campana.producto.nombre} · de{" "}
            <Link
              href={`/admin/usuarios/${campana.usuarioId}`}
              className="text-ash underline decoration-1 underline-offset-4 hf:text-[var(--heat)]"
            >
              {email}
            </Link>
          </>
        }
      >
        <BorrarCampana campanaId={campana.id} nombre={campana.nombre} dueno={email} />
      </Banda>

      <div className={cn(ANCHO, "mt-10 flex flex-col gap-16")}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tono={TONO_ESTADO[campana.estado]}>{campana.estado}</Badge>
          <Badge tono="neutro">{campana.paleta.nombre}</Badge>
          <Badge tono="neutro">{mercado.id === "INT" ? "otro país" : mercado.nombre}</Badge>
          {campana.seccionesFallidas.length > 0 && (
            <Badge tono="aviso">{campana.seccionesFallidas.length} secciones fallidas</Badge>
          )}
        </div>

        <Cifras className="-mt-8">
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
            valor={formatoPrecio(campana.producto.precio, mercado)}
            nota={`creada el ${fechaLarga(campana.creadaEn)}`}
          />
        </Cifras>

        <Seccion titulo="Paleta asignada" descripcion={campana.paleta.razon}>
          {/* La paleta como tira continua: así se ve cómo conviven los cinco
              colores, que es lo que decide la matriz, no cada uno suelto. */}
          <div className="flex h-24 overflow-hidden rounded-2xl">
            {swatches.map(([nombre, hex]) => (
              <span key={nombre} aria-hidden style={{ background: hex }} className="flex-1" />
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {swatches.map(([nombre, hex]) => (
              <li key={nombre} className="mono-sm text-slag">
                {nombre}
                <span className="block text-ash">{hex}</span>
              </li>
            ))}
          </ul>
        </Seccion>

        <Seccion
          titulo="Prompts generados"
          descripcion="En solo lectura. Esta pantalla sirve para entender qué produjo la metodología, no para corregirlo por encima del usuario."
        >
          {campana.prompts.length === 0 && (
            <p className="cuerpo text-smoke">Esta campaña no llegó a generar ningún prompt.</p>
          )}

          <div className="flex flex-col">
            {campana.prompts.map((p, i) => (
              <article
                key={p.id}
                className={cn("py-8", i > 0 && "border-t border-[var(--scale)]")}
              >
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="flex items-baseline gap-3 titulo">
                    <span className="mono-sm text-slag">{String(i + 1).padStart(2, "0")}</span>
                    {ETIQUETA_TIPOLOGIA[p.tipologia]}
                  </h3>
                  <span className="mono-sm text-slag">{numero(p.palabras)} palabras</span>
                </header>

                {p.advertencias.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-2">
                    {p.advertencias.map((a, k) => (
                      <li key={`${a.regla}-${k}`} className="flex flex-wrap items-baseline gap-2">
                        <Badge tono={a.severidad === "bloqueo" ? "peligro" : "aviso"}>
                          {a.severidad}
                        </Badge>
                        <span className="etiqueta text-smoke">{ETIQUETA_REGLA[a.regla]}</span>
                        <span className="mono-sm text-slag">{a.detalle}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <pre className="mt-5 max-h-[320px] overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--sunk)] p-5 font-[family-name:var(--font-geist-mono)] text-[0.8125rem] leading-relaxed text-smoke">
                  {p.texto}
                </pre>
              </article>
            ))}
          </div>
        </Seccion>
      </div>
    </>
  );
}
