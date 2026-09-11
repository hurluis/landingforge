import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { usuarioActual } from "@/lib/auth/sesion";
import { repositorio } from "@/lib/datos";
import { plan as definicionPlan } from "@/lib/planes";
import { fechaCorta } from "@/lib/formato";
import { Biblioteca } from "@/components/app/biblioteca";
import { Boton } from "@/components/ui/boton";
import { ANCHO, Banda, Cifra, Cifras } from "@/components/panel/piezas";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Biblioteca" };
export const dynamic = "force-dynamic";

/**
 * La biblioteca — la primera pantalla después de entrar.
 *
 * Abre con el mismo plano que la home, el frasco en su pedestal, porque es
 * la misma casa. Debajo, cuatro cifras que el usuario de verdad consulta
 * —cuántas campañas lleva, cuántos prompts tiene listos, cuántos créditos le
 * quedan y cuándo vuelven— y la biblioteca en sí.
 */
export default async function PaginaBiblioteca() {
  const usuario = await usuarioActual();
  if (!usuario) return null; // el layout ya redirige
  const campanas = await repositorio().campanasDe(usuario.id);
  const def = definicionPlan(usuario.plan);
  const prompts = campanas.reduce((n, c) => n + c.prompts.length, 0);

  return (
    <>
      <Banda
        fotograma="/secuencia/0001.jpg"
        encuadre="50% 58%"
        rotulo="Tu estudio"
        titulo="Biblioteca"
        descripcion={
          campanas.length === 0
            ? "Aquí vivirán tus campañas. La primera te toma menos de diez minutos."
            : `${campanas.length} ${campanas.length === 1 ? "campaña guardada" : "campañas guardadas"}, con sus prompts listos para copiar, editar y volver a correr.`
        }
      >
        <Boton asChild variante="tinta" tamano="md" className="rounded-full">
          <Link href="/app/nueva">
            <Plus className="size-4" weight="bold" />
            Nueva campaña
          </Link>
        </Boton>
      </Banda>

      <div className={cn(ANCHO, "mt-10 flex flex-col gap-16 pb-24")}>
        <Cifras>
          <Cifra
            etiqueta="Campañas"
            valor={campanas.length}
            nota={
              def.campanasGuardadas === "ilimitadas"
                ? "sin límite en tu plan"
                : `de ${def.campanasGuardadas} en tu plan`
            }
          />
          <Cifra etiqueta="Prompts" valor={prompts} nota="listos para copiar" />
          <Cifra
            etiqueta="Créditos"
            valor={usuario.creditosDisponibles}
            nota={`de ${def.creditosMes} · vuelven el ${fechaCorta(usuario.renuevaEn)}`}
            tono="calor"
          />
          <Cifra
            etiqueta="Plan"
            valor={def.nombre}
            nota={`${def.paletasAlternativas} ${def.paletasAlternativas === 1 ? "paleta alternativa" : "paletas alternativas"}`}
          />
        </Cifras>

        <Biblioteca campanas={campanas} />
      </div>
    </>
  );
}
