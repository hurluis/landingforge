import { Banknote, FileCheck2, Users, Type } from "lucide-react";
import { BLOQUES_MERCADO } from "@/lib/metodologia/mercado-co";
import { Revelar } from "@/components/ui/revelar";
import { Sello } from "@/components/ui/piezas";

/**
 * La metodología colombiana — §6.2.5. El foso.
 *
 * Fondo --surface-sunk: la sección más oscura de la página. Revela de arriba
 * hacia abajo, como una hoja que se imprime — la dirección la manda el
 * contenido, que es una lista vertical de reglas.
 *
 * Los sellos metálicos son el único lugar de la página donde el degradado
 * aparece a este tamaño, y están tomados del lenguaje visual real de las
 * secciones de garantía colombianas (§4.1).
 */

const ICONOS = {
  contraentrega: Banknote,
  invima: FileCheck2,
  caras: Users,
  formato: Type,
} as const;

export function BloqueMetodologia() {
  return (
    <section
      aria-labelledby="metodologia-titulo"
      className="bg-[var(--surface-sunk)] border-y border-[var(--line)]"
    >
      <Revelar desde="arriba" className="mx-auto max-w-[1200px] px-4 sm:px-8 py-24">
        <h2 id="metodologia-titulo" className="display-lg medida">
          Lo que ninguna plataforma internacional sabe de vender en Colombia.
        </h2>

        <ul className="mt-16">
          {BLOQUES_MERCADO.map((b) => {
            const Icono = ICONOS[b.id];
            return (
              <li
                key={b.id}
                className="grid gap-6 border-t border-[var(--line)] py-8 sm:grid-cols-[auto_1fr] sm:gap-10"
              >
                <Sello tamano={48}>
                  <Icono strokeWidth={1.5} className="size-5" />
                </Sello>
                <div>
                  <h3 className="titulo text-hi">{b.titulo}</h3>
                  <p className="mt-2 medida cuerpo-lg text-mid">{b.texto}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Revelar>
    </section>
  );
}
