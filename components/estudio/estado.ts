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
