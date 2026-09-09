import type { Audiencia, Paleta, TipoProducto, TipologiaSeccion } from "@/lib/datos/tipos";
import { TIPOLOGIAS_POR_DEFECTO } from "@/lib/metodologia/tipologias";

/**
 * El estado del wizard. Vive en un solo sitio para que volver atrás no pierda
 * nada, y se serializa a sessionStorage para que recargar tampoco (§7.1).
 */
export interface EstadoEstudio {
  nombre: string;
  descripcion: string;
  imagenUrl?: string;
  tipo: TipoProducto;
  audiencia: Audiencia;
  beneficioPrincipal: string;
  precioCOP: number;
  precioTachadoCOP?: number;
  paleta: Paleta | null;
  alternativa: number;
  secciones: TipologiaSeccion[];
}

export const ESTADO_INICIAL: EstadoEstudio = {
  nombre: "",
  descripcion: "",
  tipo: "suplemento-natural",
  audiencia: { genero: "mixto", edadMin: 25, edadMax: 45 },
  beneficioPrincipal: "",
  precioCOP: 0,
  paleta: null,
  alternativa: 0,
  secciones: [...TIPOLOGIAS_POR_DEFECTO],
};

export const CLAVE_ALMACEN = "landingforge:estudio";

export const OPCIONES_TIPO: { valor: TipoProducto; texto: string }[] = [
  { valor: "suplemento-deportivo", texto: "Suplemento deportivo" },
  { valor: "suplemento-rendimiento", texto: "Suplemento de rendimiento" },
  { valor: "dispositivo-belleza", texto: "Dispositivo de belleza" },
  { valor: "cosmetica", texto: "Cosmética" },
  { valor: "suplemento-natural", texto: "Suplemento natural" },
  { valor: "electronica", texto: "Electrónica" },
  { valor: "clinico", texto: "Producto clínico" },
  { valor: "skincare-lujo", texto: "Skincare de lujo" },
  { valor: "control-peso", texto: "Control de peso" },
  { valor: "capilar", texto: "Cuidado capilar" },
  { valor: "otro", texto: "Otro" },
];

/** Un paso solo se puede dejar atrás si lo que pide está completo. */
export function pasoCompleto(paso: number, e: EstadoEstudio): boolean {
  if (paso === 1) {
    return e.nombre.trim().length >= 2 && (e.descripcion.trim() !== "" || Boolean(e.imagenUrl));
  }
  if (paso === 2) {
    return (
      e.beneficioPrincipal.trim().length >= 3 &&
      e.precioCOP > 0 &&
      e.audiencia.edadMax >= e.audiencia.edadMin
    );
  }
  if (paso === 3) return e.paleta !== null;
  return e.secciones.length > 0;
}

/**
 * Qué le falta al paso para poder avanzar, en lenguaje del usuario.
 *
 * `pasoCompleto` responde sí o no, y con eso basta para deshabilitar el botón.
 * Pero un control deshabilitado que no dice por qué es exactamente el fallo
 * que Norman describe: el sistema conoce la razón y no la comparte, así que
 * el usuario tiene que adivinarla probando. La ISO/IEC 25010 lo llama
 * protección contra errores; Nielsen, visibilidad del estado del sistema.
 *
 * El paso 4 ya explicaba su bloqueo («te faltan N créditos»). Los pasos 1 a 3
 * no, y esa inconsistencia era nuestra, no del usuario.
 *
 * Devuelve lista vacía cuando el paso está completo.
 */
export function queFalta(paso: number, e: EstadoEstudio): string[] {
  const falta: string[] = [];

  if (paso === 1) {
    if (e.nombre.trim().length < 2) falta.push("el nombre del producto");
    if (e.descripcion.trim() === "" && !e.imagenUrl) {
      falta.push("una descripción o una foto");
    }
    return falta;
  }

  if (paso === 2) {
    if (e.beneficioPrincipal.trim().length < 3) falta.push("el beneficio principal");
    if (e.precioCOP <= 0) falta.push("el precio");
    if (e.audiencia.edadMax < e.audiencia.edadMin) {
      falta.push("un rango de edad válido: la edad máxima no puede ser menor que la mínima");
    }
    return falta;
  }

  if (paso === 3) {
    if (e.paleta === null) falta.push("elegir una paleta");
    return falta;
  }

  if (e.secciones.length === 0) falta.push("al menos una sección");
  return falta;
}

/** «el nombre y el precio» — enumeración en español, sin coma de Oxford. */
export function enumerar(partes: string[]): string {
  if (partes.length <= 1) return partes[0] ?? "";
  return `${partes.slice(0, -1).join(", ")} y ${partes[partes.length - 1]}`;
}
