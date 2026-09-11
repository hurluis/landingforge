import type { Metadata } from "next";
import { CheckCircle, Database, Sparkle, Warning } from "@phosphor-icons/react/dist/ssr";
import { repositorioAdmin } from "@/lib/datos";
import { numero, pesoArchivo } from "@/lib/formato";
import { Badge } from "@/components/ui/piezas";
import { ANCHO, Banda, Cifra, Cifras, Seccion } from "@/components/panel/piezas";
import {
  EstadosDeCampana,
  RepartoPorPlan,
  SerieTemporal,
} from "@/components/admin/graficas";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Tablero" };
export const dynamic = "force-dynamic";

/**
 * F-A1 · Tablero.
 *
 * Las cuatro cifras de arriba son números sueltos y por eso se dibujan como
 * números sueltos: convertir un dato único en una barra ocupa sitio y no
 * añade lectura. Las series de 30 días sí son forma, y van en dos gráficas
 * separadas —altas y campañas— en lugar de una sola con dos ejes verticales,
 * que es la manera más habitual de hacer que una gráfica mienta.
 */
export default async function PaginaTablero() {
  const gestor = repositorioAdmin();
  const [resumen, salud] = await Promise.all([gestor.resumen(), gestor.salud()]);

  const tasaDevolucion =
    resumen.creditosConsumidos === 0
      ? 0
      : Math.round((resumen.creditosDevueltos / resumen.creditosConsumidos) * 100);

  return (
    <>
      <Banda
        fotograma="/secuencia/0180.jpg"
        encuadre="58% 50%"
        rotulo="Administración"
        titulo="Tablero"
        descripcion="El estado de la plataforma en una pantalla: quién la usa, qué produce y qué está corriendo por debajo."
      />

      <div className={cn(ANCHO, "mt-10 flex flex-col gap-16")}>
        <Cifras>
          <Cifra
            etiqueta="Cuentas"
            valor={resumen.usuarios}
            nota={`+${resumen.usuariosNuevos30d} en 30 días · ${resumen.admins} admin`}
          />
          <Cifra etiqueta="Campañas" valor={resumen.campanas} nota="de todos los usuarios" />
          <Cifra etiqueta="Prompts generados" valor={resumen.prompts} nota="acumulado histórico" />
          <Cifra
            etiqueta="Créditos consumidos"
            valor={resumen.creditosConsumidos}
            nota={`${numero(resumen.creditosDevueltos)} devueltos · ${tasaDevolucion}%`}
            tono="calor"
          />
        </Cifras>

        <div className="grid gap-x-14 gap-y-16 lg:grid-cols-2">
          <Seccion titulo="Altas de cuentas">
            <SerieTemporal titulo="Cuentas nuevas por día" puntos={resumen.altasPorDia} />
          </Seccion>
          <Seccion titulo="Campañas creadas">
            <SerieTemporal
              titulo="Campañas nuevas por día"
              puntos={resumen.campanasPorDia}
              color="var(--forged)"
            />
          </Seccion>
          <Seccion titulo="Reparto por plan">
            <RepartoPorPlan reparto={resumen.usuariosPorPlan} />
          </Seccion>
          <Seccion titulo="Estado de las campañas">
            <EstadosDeCampana porEstado={resumen.campanasPorEstado} />
          </Seccion>
        </div>

        {/* Salud del sistema. Va aquí y no en pantalla propia porque es lo que
            de verdad se mira: de pasada, mientras se revisa lo demás. */}
        <Seccion
          titulo="Salud del sistema"
          descripcion="Se lee, no se configura: cada valor sale del proceso que está sirviendo esta página."
        >
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="etiqueta text-slag">Motor de prompts</dt>
              <dd className="mt-2.5 flex items-center gap-2">
                {salud.modeloReal ? (
                  <Badge tono="ok">
                    <CheckCircle className="size-3.5" /> Gemini conectado
                  </Badge>
                ) : (
                  <Badge tono="maquina">
                    <Sparkle className="size-3.5" /> Motor local
                  </Badge>
                )}
              </dd>
            </div>
            <div>
              <dt className="etiqueta text-slag">Generación de imágenes</dt>
              <dd className="mt-2.5">
                <Badge tono={salud.imagenesHabilitadas ? "ok" : "neutro"}>
                  {salud.imagenesHabilitadas ? "habilitada" : "tras bandera, apagada"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="etiqueta text-slag">Rate limiting</dt>
              <dd className="mt-2.5">
                <Badge tono={salud.rateLimitDistribuido ? "ok" : "aviso"}>
                  <Warning className="size-3.5" />
                  {salud.rateLimitDistribuido ? "distribuido" : "en memoria del proceso"}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="etiqueta text-slag">Base de datos</dt>
              <dd className="mt-2.5 flex items-center gap-2 mono-sm text-smoke">
                <Database className="size-4 text-slag" />
                {pesoArchivo(salud.bytesBaseDatos)}
              </dd>
            </div>
            <div>
              <dt className="etiqueta text-slag">Node</dt>
              <dd className="mt-2.5 mono-sm text-smoke">{salud.nodo}</dd>
            </div>
            <div>
              <dt className="etiqueta text-slag">Entorno</dt>
              <dd className="mt-2.5 mono-sm text-smoke">{salud.entorno}</dd>
            </div>
          </dl>

          {!salud.rateLimitDistribuido && (
            <p className="mt-8 cuerpo text-slag medida">
              El contador de peticiones vive en la memoria de este proceso. Con una sola
              instancia es suficiente; en cuanto haya varias, cada una llevará su propia cuenta y
              el límite real será el configurado multiplicado por el número de instancias. La
              salida es moverlo a Redis o al KV de la plataforma.
            </p>
          )}
        </Seccion>
      </div>
    </>
  );
}
