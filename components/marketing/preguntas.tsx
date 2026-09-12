import { Acordeon } from "@/components/ui/acordeon";
import { RevealLineas } from "@/components/motion/reveal";
import { traductor } from "@/lib/i18n/servidor";
import type { Traductor } from "@/lib/i18n/idioma";

/**
 * Preguntas — §6.2.9. Escritas como las haría un operador desconfiado, no
 * como las escribiría marketing. Las respuestas siguen §3.2 y §3.3: directas,
 * sin vender, admitiendo límites reales.
 *
 * Revela desde abajo: es la última sección con movimiento antes del cierre
 * quieto, y ninguna otra sección de la página usa esta dirección.
 */

const preguntas = (t: Traductor) => [
  {
    id: "ia",
    pregunta: t("¿Las imágenes se ven hechas por IA?"),
    respuesta: (
      <>
        <p>
          {t(
            "Menos que el promedio, y por razones concretas: se bloquean los rasgos faciales entre el antes y el después, se piden seis personas físicamente distintas con imperfecciones reales, y hay una lista negra de palabras que empujan al modelo hacia el aspecto de banco de imágenes.",
          )}
        </p>
        <p className="mt-3">
          {t(
            "Aun así, una cara generada sigue siendo detectable si la miras de cerca. Por eso el hero, precios y estilo de vida se construyen sobre la foto real de tu producto.",
          )}
        </p>
      </>
    ),
  },
  {
    id: "foto",
    pregunta: t("¿Puedo usar la foto real de mi producto y que salga idéntica?"),
    respuesta: (
      <>
        <p>
          {t(
            "Sí en las cuatro secciones que la usan como referencia: hero, antes/después, precios y estilo de vida. El envase conserva forma, etiqueta y color.",
          )}
        </p>
        <p className="mt-3">
          {t(
            "En las demás el producto aparece pequeño y puede variar en detalles menores. Si tu etiqueta lleva texto legal fino, revísalo antes de publicar.",
          )}
        </p>
      </>
    ),
  },
  {
    id: "no-gusta",
    pregunta: t("¿Qué pasa si no me gusta lo que genera?"),
    respuesta: (
      <>
        <p>
          {t(
            "Editas el prompt y vuelves a correr esa sección sola. No hay que regenerar la campaña entera, y cada plan trae bastantes más secciones de las nueve que ocupa una campaña, justo para que puedas insistir en la que no te convenza.",
          )}
        </p>
        <p className="mt-3">
          {t(
            "Si lo que no te convence es la paleta, puedes pedir hasta dos alternativas antes de generar nada.",
          )}
        </p>
      </>
    ),
  },
  {
    id: "propiedad",
    pregunta: t("¿Los prompts son míos?"),
    respuesta: (
      <p>
          {t(
            "Sí. Te llevas el texto completo, exportable en .md y .json. Los puedes editar, versionar y correr en cualquier generador de imagen. Si mañana dejas de usar LandingForge, tu trabajo sigue siendo tuyo.",
          )}
        </p>
    ),
  },
  {
    id: "categoria",
    pregunta: t("¿Sirve si mi producto no es de salud ni belleza?"),
    respuesta: (
      <>
        <p>
          {t(
            "Sirve, con una advertencia honesta: la matriz de paletas y las reglas de sección están calibradas para suplementos, cosmética, dispositivos de belleza y electrónica de consumo.",
          )}
        </p>
        <p className="mt-3">
          {t(
            "Fuera de esas categorías el sistema funciona, pero pierde precisión. Pruébalo con los 5 créditos gratis antes de pagar un plan.",
          )}
        </p>
      </>
    ),
  },
];

export async function Preguntas() {
  const t = await traductor();
  return (
    <section aria-labelledby="preguntas-titulo" className="py-32 lg:py-36">
      <div className="mx-auto max-w-[1400px] px-6 lg:px-10">
        <RevealLineas
          as="h2"
          id="preguntas-titulo"
          className="display-lg max-w-[16ch]"
          lineas={t("Lo que preguntan|antes de pagar.").split("|")}
        />
        <div className="mt-12 max-w-[820px]">
          <Acordeon items={preguntas(t)} />
        </div>
      </div>
    </section>
  );
}
