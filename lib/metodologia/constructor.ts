import type { EntradaPrompt, Producto, TipologiaSeccion } from "@/lib/datos/tipos";
import { tipologia } from "@/lib/metodologia/tipologias";
import {
  mercadoDe,
  requiereRegistro,
  senalesDeConfianza,
  type Mercado,
} from "@/lib/metodologia/mercados";
import { ETIQUETA_ILUMINACION, ETIQUETA_PALETA, LINEA_CIERRE } from "@/lib/metodologia/reglas-prompt";
import { formatoPrecio } from "@/lib/formato";

/**
 * El constructor — la fórmula de siete componentes hecha código.
 *
 * Esta es la pieza que hace que LandingForge no sea «una llamada a una API»:
 * el esqueleto del prompt, su orden, sus bloques obligatorios y las señales de
 * mercado los pone el sistema. El modelo generativo solo redacta la prosa
 * dentro de ese esqueleto, y cuando no hay modelo disponible el esqueleto ya
 * produce un prompt válido por sí solo.
 *
 * Orden de los componentes: el modelo pondera más lo que aparece primero, así
 * que formato y paleta van al inicio y la configuración técnica al final.
 *
 * Todo lo que depende del país —moneda, registro sanitario, contraentrega,
 * personas y ciudades— sale de `mercadoDe(producto)`. El constructor no sabe
 * de ningún país en concreto.
 */

function bloquePaleta(e: EntradaPrompt): string {
  const { paleta } = e;
  return `${ETIQUETA_PALETA} ${paleta.fondo} fondo · ${paleta.acento} acento · ${paleta.texto} texto · ${paleta.secundario} secundario · ${paleta.energia} energía. Formato vertical 9:16, un solo fotograma.`;
}

function bloqueIluminacion(t: TipologiaSeccion): string {
  const peso = tipologia(t).pesoIluminacion;
  if (peso === "alto") {
    return `${ETIQUETA_ILUMINACION} luz clave cálida a 45 grados arriba a la derecha que modela el volumen del sujeto, relleno suave a la izquierda para que la sombra no se cierre, y una luz de contorno fría que separa el sujeto del fondo. La sombra de contacto es corta y con desenfoque, nunca dura.`;
  }
  if (peso === "medio") {
    return `${ETIQUETA_ILUMINACION} luz difusa de estudio desde arriba con una caída suave hacia los bordes del fotograma. Sin brillos especulares fuertes que compitan con el texto.`;
  }
  return `${ETIQUETA_ILUMINACION} luz plana y uniforme de catálogo, sin sombras marcadas, para que los elementos gráficos y el texto se lean sin obstáculos.`;
}

function sujeto(p: Producto): string {
  return p.descripcion.trim() !== ""
    ? `${p.nombre}: ${p.descripcion.trim().replace(/\.$/, "")}`
    : p.nombre;
}

/** «de Colombia», o «del país de venta» cuando el mercado no es uno concreto. */
function dePais(m: Mercado): string {
  return m.id === "INT" ? "del país de venta" : `de ${m.nombre}`;
}

/** El componente de señales de mercado, distinto según la tipología. */
function bloqueMercado(e: EntradaPrompt): string {
  const { producto, tipologia: t } = e;
  const m = mercadoDe(producto);
  const senales = senalesDeConfianza(producto.tipo, m);
  const registro = requiereRegistro(producto.tipo);

  if (t === "confianza") {
    const principal = m.contraentrega
      ? `El sello de ${m.contraentrega} es el más grande porque es la señal que más pesa en la decisión de compra en ${m.nombre}.`
      : "El sello de la garantía es el más grande porque es la última objeción antes de comprar.";
    return `Las señales de confianza van dibujadas como sellos metálicos con relieve, no como stickers planos: ${senales.join("; ")}. ${principal}`;
  }
  if (t === "testimonios") {
    const gente = m.origenes.slice(0, 6).map((o) => `una persona ${o}`);
    const ciudades = m.ciudades.length
      ? `ciudad real —${m.ciudades.slice(0, 4).join(", ")}—`
      : "la ciudad real de quien la escribe";
    return `Las seis personas son físicamente distintas y con imperfecciones reales: ${gente.slice(0, -1).join(", ")} y ${gente[gente.length - 1]}. Cada reseña lleva nombre propio y ${ciudades}, y suena a alguien contando su experiencia, no a texto de marca.`;
  }
  if (t === "precios") {
    const tachado = producto.precioTachado
      ? ` El precio anterior aparece tachado en ${formatoPrecio(producto.precioTachado, m)}, más pequeño y en el color secundario.`
      : "";
    return `El precio se escribe exactamente ${formatoPrecio(producto.precio, m)}, con la moneda y los separadores ${dePais(m)}.${tachado} La opción del medio es el ancla visual y se distingue por altura y por el borde en el color de acento, no por una etiqueta que diga que es la más popular.`;
  }
  if (t === "autoridad") {
    return `El profesional aparenta entre 45 y 55 años y se ve como alguien que ejerce de verdad, no como un modelo de catálogo.${registro ? ` En un plano secundario se lee ${m.registro}.` : ""}`;
  }
  const pastilla = m.contraentrega ?? "garantía de devolución";
  return `Una pastilla discreta indica ${pastilla} en la esquina inferior del fotograma.${registro ? ` Si hay espacio, ${m.registro} aparece en tipografía pequeña sin robar protagonismo.` : ""}`;
}

/** La composición: la estructura documentada de la tipología, en prosa. */
function bloqueComposicion(e: EntradaPrompt): string {
  const t = tipologia(e.tipologia);
  const [primera, ...resto] = t.estructura;
  const evitar = t.erroresConocidos[0];
  return `Composición: ${primera.toLowerCase()}. ${resto
    .map((linea) => linea.charAt(0).toUpperCase() + linea.slice(1))
    .join(". ")}. Evita expresamente ${evitar.toLowerCase()}.`;
}

function bloqueTitular(e: EntradaPrompt): string {
  const t = e.tipologia;
  const titular = e.producto.beneficioPrincipal.trim();
  if (t === "hero") {
    return `El titular «${titular}» es el elemento de texto más grande del fotograma, sin excepción, alineado arriba a la izquierda y con espacio libre a su alrededor.`;
  }
  if (t === "antes-despues") {
    return `Los únicos textos renderizados son las etiquetas «ANTES» y «DESPUÉS», en la misma posición dentro de cada mitad y del mismo tamaño.`;
  }
  if (t === "confianza") {
    return `El texto renderizado se limita a «${titular}» sobre los sellos, corto para que el render no deforme las letras.`;
  }
  return `El texto renderizado es breve: «${titular}» como línea principal, y nada más largo que eso en el fotograma.`;
}

function bloqueVisual(e: EntradaPrompt): string {
  const t = tipologia(e.tipologia);
  const s = sujeto(e.producto);
  if (t.requiereImagenReferencia) {
    return `Visual principal: ${s}, tomado de la imagen de referencia adjunta y conservando exactamente su forma, su etiqueta y su color. ${
      e.tipologia === "hero"
        ? "El envase ocupa tres cuartos de la altura del fotograma y se apoya sobre una superficie visible, con sombra de contacto."
        : "El envase aparece en su tamaño natural dentro de la escena, sin flotar."
    }`;
  }
  return `Visual principal: la escena se construye alrededor de ${s}, que aparece pequeño y como ancla visual, no como protagonista del fotograma.`;
}

function bloqueAudiencia(e: EntradaPrompt): string {
  const { audiencia } = e.producto;
  const m = mercadoDe(e.producto);
  const quienes =
    audiencia.genero === "f"
      ? `mujeres ${m.gentilicio.f}`
      : audiencia.genero === "m"
        ? `hombres ${m.gentilicio.m}`
        : `personas ${m.gentilicio.f}`;
  const rasgos = m.id === "INT" ? "rasgos diversos" : "rasgos regionales reconocibles";
  return `Las personas que aparezcan son ${quienes} de entre ${audiencia.edadMin} y ${audiencia.edadMax} años, con ${rasgos} y piel con textura real.`;
}

/**
 * Construye el prompt completo, en prosa narrativa. Es determinista: la misma
 * entrada produce el mismo prompt, lo que hace el sistema auditable.
 */
export function construirTexto(e: EntradaPrompt): string {
  const t = tipologia(e.tipologia);
  const partes = [
    bloquePaleta(e),
    `Fotografía de la sección «${t.nombre}» de una landing page de e-commerce. ${t.proposito}.`,
    bloqueTitular(e),
    bloqueVisual(e),
    bloqueComposicion(e),
    bloqueAudiencia(e),
    bloqueIluminacion(e.tipologia),
    bloqueMercado(e),
    /* Solo la primera letra: `toLowerCase()` entero dejaba «siempre. es la
       señal» tras un punto y «invima» en minúsculas. */
    `Regla crítica de esta tipología: ${t.reglaCritica.charAt(0).toLowerCase()}${t.reglaCritica.slice(1)}.`,
    LINEA_CIERRE,
  ];
  return partes.join("\n\n");
}

/**
 * El esqueleto que se le entrega al modelo cuando sí hay uno disponible.
 * El modelo redacta la prosa; el sistema sigue poniendo el orden, los bloques
 * obligatorios y las reglas. Así la metodología no depende del proveedor.
 */
export function instruccionesParaModelo(e: EntradaPrompt): string {
  const t = tipologia(e.tipologia);
  const m = mercadoDe(e.producto);
  const senales = senalesDeConfianza(e.producto.tipo, m);
  return [
    "Redacta un prompt de generación de imagen en ESPAÑOL, en prosa narrativa continua.",
    "No uses listas de keywords ni viñetas. No uses comillas dobles.",
    "",
    `SECCIÓN: ${t.nombre} — ${t.proposito}`,
    `REGLA CRÍTICA: ${t.reglaCritica}`,
    `ERRORES A EVITAR: ${t.erroresConocidos.join("; ")}`,
    "",
    "ESTRUCTURA OBLIGATORIA, en este orden y con estas etiquetas literales:",
    `1. Una línea que empiece por «${ETIQUETA_PALETA}» con los cinco hex y el formato 9:16.`,
    "2. Qué sección es y qué debe conseguir.",
    "3. El texto que la imagen debe renderizar, entre comillas angulares « ».",
    "4. El visual principal.",
    "5. La composición.",
    `6. Las personas, si las hay, con su origen ${dePais(m)} explícito.`,
    `7. Una línea que empiece por «${ETIQUETA_ILUMINACION}».`,
    `8. Las señales del mercado ${dePais(m)}: ${senales.join("; ")}.`,
    `9. Termina exactamente con: ${LINEA_CIERRE}`,
    "",
    "RESTRICCIONES:",
    "- Ningún texto entre « » puede superar 25 caracteres.",
    "- Prohibidas estas palabras: 4K, 8K, masterpiece, highly detailed, ultra detailed, trending on ArtStation, hyperrealistic, photorealistic, best quality, award-winning, perfect, flawless, stunning, breathtaking, incredible, amazing.",
    "- Longitud total entre 150 y 350 palabras.",
    `- Precios con la moneda y los separadores ${dePais(m)}, exactamente como en: ${formatoPrecio(m.ejemplo, m)}.`,
    "",
    "DATOS DE LA CAMPAÑA:",
    `- Mercado: ${m.id === "INT" ? "internacional" : m.nombre}`,
    `- Producto: ${e.producto.nombre}`,
    `- Descripción: ${e.producto.descripcion || "sin descripción"}`,
    `- Beneficio principal (usar como texto renderizado): ${e.producto.beneficioPrincipal}`,
    `- Precio: ${formatoPrecio(e.producto.precio, m)}`,
    `- Audiencia: ${e.producto.audiencia.genero}, ${e.producto.audiencia.edadMin}–${e.producto.audiencia.edadMax} años`,
    `- Paleta «${e.paleta.nombre}»: ${e.paleta.fondo}, ${e.paleta.acento}, ${e.paleta.texto}, ${e.paleta.secundario}, ${e.paleta.energia}`,
    "",
    "Devuelve únicamente el prompt. Nada de explicaciones ni preámbulo.",
  ].join("\n");
}
