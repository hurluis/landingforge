/**
 * La metodología publicada: estructura y errores de cada tipología, la
 * fórmula, la lista negra, las paletas y las señales de mercado.
 *
 * Casi ninguna de estas claves aparece como literal en un componente: salen de
 * los datos de `lib/metodologia`, así que `scripts/verificar-idioma.mjs` no
 * puede avisar si una se queda atrás. Al tocar allí, tocar aquí.
 */
export const METODOLOGIA: Record<string, string> = {
  /* ---------------- Hero ---------------- */
  "Titular de promesa, máximo 25 caracteres": "Promise headline, 25 characters maximum",
  "Producto como sujeto físico dominante, tres cuartos de la altura":
    "Product as the dominant physical subject, three quarters of the height",
  "Badge de garantía o contraentrega en la esquina inferior":
    "Guarantee or cash-on-delivery badge in the bottom corner",
  "Precio con la moneda y el separador de miles del país":
    "Price with the country's currency and thousands separator",
  "Titular más pequeño que el nombre de la marca": "Headline smaller than the brand name",
  "Producto flotando sin superficie de apoyo ni sombra de contacto":
    "Product floating with no surface under it and no contact shadow",
  "Fondo tan cargado que compite con el envase":
    "A background so busy it competes with the packaging",

  /* ---------------- Beneficios ---------------- */
  "Tres o cuatro beneficios en columna o rejilla":
    "Three or four benefits in a column or a grid",
  "Un icono lineal por beneficio, mismo grosor de trazo":
    "One line icon per benefit, all at the same stroke weight",
  "Producto pequeño como ancla visual, no como protagonista":
    "The product small, as a visual anchor rather than the lead",
  "Beneficios escritos como características técnicas": "Benefits written as technical specs",
  "Iconos de estilos distintos mezclados en el mismo bloque":
    "Icons from different styles mixed into the same block",
  "Texto largo que el modelo deforma al renderizar":
    "Long text that the model mangles when it renders",

  /* ---------------- Antes / Después ---------------- */
  "Partición vertical exacta al 50 %, sin marco decorativo":
    "An exact 50% vertical split, with no decorative frame",
  "Etiquetas ANTES y DESPUÉS en la misma posición de cada mitad":
    "BEFORE and AFTER labels in the same position on each half",
  "Idéntica iluminación, distancia focal y encuadre en ambas mitades":
    "Identical lighting, focal length and framing on both halves",
  "Bloqueo explícito de rasgos faciales antes de describir el cambio":
    "Facial features locked explicitly before the change is described",
  "Dos personas distintas: destruye la credibilidad de la pieza":
    "Two different people: it destroys the credibility of the whole piece",
  "Iluminación más favorecedora en el después: se lee como truco":
    "More flattering light on the after: it reads as a trick",
  "Cambio exagerado que promete un resultado imposible":
    "An exaggerated change that promises an impossible result",

  /* ---------------- Paso a paso ---------------- */
  "Tres pasos en secuencia vertical numerada": "Three steps in a numbered vertical sequence",
  "Las mismas manos y el mismo tono de piel en los tres":
    "The same hands and the same skin tone across all three",
  "Una acción visible por paso, sin texto explicativo largo":
    "One visible action per step, with no long explanatory text",
  "Manos distintas entre pasos: rompe la continuidad narrativa":
    "Different hands between steps: it breaks the narrative continuity",
  "Pasos que describen resultados en vez de acciones":
    "Steps that describe results instead of actions",
  "Más de cuatro pasos: deja de leerse como fácil":
    "More than four steps: it stops reading as easy",

  /* ---------------- Testimonios ---------------- */
  "Rejilla de seis retratos con su reseña corta":
    "A grid of six portraits, each with a short review",
  "Origen especificado por persona, con la diversidad real del país donde se vende":
    "Origin specified per person, with the real diversity of the country you sell in",
  "Nombre y ciudad reales del país bajo cada reseña":
    "A real name and a real city from that country under each review",
  "Cinco estrellas dibujadas, no en emoji": "Five drawn stars, not emoji",
  "Seis caras de la misma edad, mismo peinado y misma piel perfecta":
    "Six faces of the same age, the same haircut and the same flawless skin",
  "Reseñas que suenan a copy de marca en vez de a persona":
    "Reviews that sound like brand copy instead of a person",
  "Ciudades genéricas o inventadas": "Generic or invented cities",

  /* ---------------- Autoridad ---------------- */
  "Retrato de medio cuerpo en su entorno de trabajo real":
    "A waist-up portrait in their real working environment",
  "Una sola frase de respaldo, atribuida con nombre y especialidad":
    "A single endorsing sentence, attributed with a name and a speciality",
  "Señal institucional visible: bata, consultorio, diploma fuera de foco":
    "A visible institutional signal: a coat, a consulting room, a diploma out of focus",
  "Un modelo de 30 años con bata impecable de estudio":
    "A 30-year-old model in a spotless studio coat",
  "Frases que prometen resultados médicos": "Sentences that promise medical results",
  "Fondo de laboratorio de banco de imágenes": "A stock-photo laboratory background",

  /* ---------------- Confianza y garantía ---------------- */
  "Tres o cuatro sellos metálicos alineados": "Three or four metallic seals in a row",
  "Pago contraentrega como sello principal, en los mercados que lo usan":
    "Cash on delivery as the lead seal, in the markets that use it",
  "Registro sanitario del país cuando el producto es suplemento o cosmético":
    "The country's health registration when the product is a supplement or a cosmetic",
  "Garantía con plazo concreto en días": "A guarantee with a concrete term in days",
  "Sellos que parecen stickers planos en vez de medallas con relieve":
    "Seals that look like flat stickers instead of embossed medals",
  "Omitir la contraentrega donde se usa: es la objeción que más ventas cuesta":
    "Leaving cash on delivery out where it is used: it is the objection that costs the most sales",
  "Garantías vagas sin plazo": "Vague guarantees with no term",

  /* ---------------- Precios ---------------- */
  "Tres opciones de cantidad, la del medio destacada":
    "Three quantity options, with the middle one highlighted",
  "Precio tachado y precio final con la moneda y los separadores del país":
    "A struck-through price and a final price in the country's currency and separators",
  "Ahorro expresado en dinero, no solo en porcentaje":
    "Savings expressed in money, not only as a percentage",
  "Botón de compra con verbo de acción": "A buy button with an action verb",
  "El separador equivocado —$99,900 en Bogotá, $99.900 en Ciudad de México—: delata que la pieza no es de allí":
    "The wrong separator — $99,900 in Bogotá, $99.900 in Mexico City — gives away that the piece is not from there",
  "Tres opciones sin jerarquía: el ojo no sabe cuál tomar":
    "Three options with no hierarchy: the eye cannot tell which one to take",
  "Descuentos redondos poco creíbles": "Round discounts nobody believes",

  /* ---------------- Estilo de vida ---------------- */
  "El producto dentro de una escena cotidiana que el comprador reconoce como de su país":
    "The product inside an everyday scene the buyer recognises as their own country",
  "Persona del rango de edad objetivo, en actitud de uso, no posando":
    "Someone in the target age range, in the act of using it, not posing",
  "Luz ambiente coherente con la hora del día declarada":
    "Ambient light consistent with the stated time of day",
  "Escenas de banco de imágenes que no ubican al comprador en su vida":
    "Stock scenes that do not place the buyer inside their own life",
  "El producto tan pequeño que se pierde en la escena":
    "The product so small it gets lost in the scene",
  "Persona mirando a cámara: rompe el efecto de escena real":
    "Someone looking at the camera: it breaks the real-scene effect",

  /* ---------------- La página de metodología ---------------- */
  "La metodología, abierta.": "The method, in the open.",
  "Las nueve tipologías de sección, la fórmula de siete componentes, la lista negra y la matriz de paletas.":
    "The nine section types, the seven-component formula, the blacklist and the palette matrix.",
  "Esto es lo que ejecuta el motor cuando construye tus prompts. Está publicado porque el activo no es el secreto: es tenerlo documentado, versionado y probado en campañas reales.":
    "This is what the engine runs when it builds your prompts. It is published because the asset is not the secrecy: it is having it documented, versioned and proven on real campaigns.",
  "Nueve tipologías.": "Nine section types.",
  "Regla crítica": "Critical rule",
  Estructura: "Structure",
  "Errores conocidos": "Known mistakes",
  "Siete componentes, en este orden.": "Seven components, in this order.",
  "El modelo pondera más lo que aparece primero. Por eso el formato y la paleta abren el prompt, y la configuración técnica lo cierra.":
    "The model weights whatever comes first most heavily. That is why format and palette open the prompt, and the technical configuration closes it.",
  "peso {n}": "weight {n}",
  "Las siete reglas del validador": "The validator's seven rules",
  "Ningún elemento de texto supera {n} caracteres": "No text element goes over {n} characters",
  "Ninguna palabra de la lista negra": "Not one word from the blacklist",
  "Prosa narrativa, no lista de keywords": "Narrative prose, not a keyword list",
  "Bloque de paleta con hex al inicio": "Palette block with hex values up top",
  "Bloque de iluminación presente": "Lighting block present",
  "Longitud entre {min} y {max} palabras": "Length between {min} and {max} words",
  "Cierre con la línea de configuración": "Closes with the configuration line",
  "La lista negra, con su reemplazo": "The blacklist, and what replaces it",
  "Cada palabra empuja al modelo hacia arte de concurso y banco de imágenes, no hacia fotografía de producto.":
    "Each of these words pushes the model towards contest art and stock imagery, away from product photography.",
  "La paleta la elige la matriz, no el azar.": "The matrix picks the palette, not chance.",
  "Tipo de producto por audiencia por registro emocional. Doce paletas construidas a mano, cada una con su argumento. Dos clientes distintos no reciben la misma.":
    "Product type by audience by emotional register. Twelve palettes built by hand, each with its own reasoning. Two different clients never get the same one.",
  "Las cuatro señales que se inyectan solas.": "The four signals that go in by themselves.",
  "Probar la metodología con mi producto": "Try the method on my product",

  /* ---------------- Los siete componentes ---------------- */
  "Formato y paleta": "Format and palette",
  "Titular y texto renderizado": "Headline and rendered text",
  "Visual principal": "Lead visual",
  "Composición de la sección": "Section composition",
  "Bloque de iluminación": "Lighting block",
  "Señales del mercado": "Market signals",
  "Cierre de configuración": "Configuration close",

  /* ---------------- Reemplazos de la lista negra ----------------
     Las palabras prohibidas no se traducen: ya están en inglés y son las que
     el modelo recibe. Lo que se traduce es con qué hay que sustituirlas. */
  "resolución 2K declarada en el cierre": "the 2K resolution declared in the closing line",
  "descripción concreta de la composición": "a concrete description of the composition",
  "el detalle que importa, nombrado: textura del envase, poros de la piel":
    "the detail that matters, named: packaging texture, skin pores",
  "el detalle que importa, nombrado": "the detail that matters, named",
  "referencia fotográfica real: luz de estudio de producto":
    "a real photographic reference: product studio lighting",
  "fotografía de producto con lente de 85 mm": "product photography with an 85 mm lens",
  "el cierre de configuración ya declara la calidad":
    "the configuration close already declares the quality",
  "descripción del resultado buscado": "a description of the result you are after",
  "la cualidad concreta: uniforme, alineado, limpio":
    "the concrete quality: even, aligned, clean",
  "la cualidad concreta: piel uniforme, sin brillos":
    "the concrete quality: even skin, no shine",
  "el efecto concreto que debe producir la imagen":
    "the concrete effect the image has to produce",

  /* ---------------- Las doce paletas ---------------- */
  "Hierro nocturno": "Night iron",
  "Naranja de esfuerzo sobre gris hierro: lee como gimnasio a las cinco de la mañana, no como tienda de vitaminas":
    "Effort orange over iron grey: it reads as a gym at five in the morning, not a vitamin shop",
  "Cal y cobre": "Lime and copper",
  "Cobre sobre marrón profundo: material caro sin caer en el dorado de joyería":
    "Copper over deep brown: expensive material without falling into jewellery gold",
  Quirófano: "Operating room",
  "Azul institucional sobre blanco frío: la señal visual que el comprador asocia con criterio médico":
    "Institutional blue over cold white: the visual signal buyers associate with medical judgement",
  "Seda nocturna": "Night silk",
  "Lila desaturado sobre violeta casi negro: cosmética de gama alta sin recurrir al rosa de catálogo":
    "Desaturated lilac over near-black violet: high-end cosmetics without resorting to catalogue pink",
  "Monte húmedo": "Wet woodland",
  "Verde de hoja sobre fondo de sotobosque: producto natural que no se ve de herbolario genérico":
    "Leaf green over an undergrowth backdrop: a natural product that doesn't look like generic health-food packaging",
  "Arena costeña": "Coastal sand",
  "Arena y naranja de sol de mediodía con turquesa de contraste: el mundo cromático del Caribe":
    "Sand and midday-sun orange with turquoise for contrast: the colour world of the Caribbean",
  "Grafito eléctrico": "Electric graphite",
  "Verde de señal sobre grafito: la paleta de un instrumento, apropiada cuando el producto es un aparato":
    "Signal green over graphite: the palette of an instrument, right when the product is a device",
  "Porcelana rosa": "Pink porcelain",
  "Rosa terroso sobre porcelana: skincare femenino adulto, lejos del rosa chicle de producto adolescente":
    "Earthy pink over porcelain: adult women's skincare, far from teen bubblegum pink",
  "Acero limpio": "Clean steel",
  "Azul marino sobre gris claro con un naranja de acción: seriedad clínica que aún permite un botón que se ve":
    "Navy over light grey with an action orange: clinical seriousness that still allows a button you can see",
  Brasa: "Ember",
  "Rojo de brasa sobre negro cálido: urgencia y calor, para categorías donde la decisión es impulsiva":
    "Ember red over warm black: urgency and heat, for categories where the decision is impulsive",
  "Sal de mar": "Sea salt",
  "Verde azulado sobre blanco salino: frescura de producto de cuidado sin recurrir al azul de detergente":
    "Blue-green over saline white: care-product freshness without resorting to detergent blue",
  Tabaco: "Tobacco",
  "Marrón tabaco con un verde apagado: registro masculino adulto que no cae en el negro y azul de siempre":
    "Tobacco brown with a muted green: an adult masculine register that avoids the usual black and blue",

  /* ---------------- Registros emocionales ---------------- */
  energetico: "energetic",
  premium: "premium",
  clinico: "clinical",
  natural: "natural",
  calido: "warm",
  tecnico: "technical",

  /* ---------------- Las cuatro señales de mercado ---------------- */
  "Donde se paga al recibir, es la señal de confianza que más pesa. Si tu mercado la usa, tu landing la dice sin que la pidas; si no la usa, no la finge.":
    "Where people pay on arrival, it is the trust signal that carries the most weight. If your market uses it, your landing page says so before anyone asks; if it doesn't, it never fakes it.",
  "INVIMA, COFEPRIS, DIGESA, ANMAT, FDA. En suplementos y cosméticos, el registro no es un trámite: es la diferencia entre parecer un negocio y parecer un riesgo. Cada campaña enseña el de su país.":
    "INVIMA, COFEPRIS, DIGESA, ANMAT, FDA. In supplements and cosmetics the registration is not paperwork: it is the difference between looking like a business and looking like a risk. Every campaign shows the one for its own country.",
  "Cada prompt especifica el origen de las personas según el país que eliges, porque un modelo dejado a su suerte devuelve un latino genérico que ningún comprador reconoce como suyo.":
    "Every prompt specifies where the people come from based on the country you choose, because a model left to itself hands back a placeless face no buyer recognises as their own.",
  "El precio con la moneda y el separador de tu país: $99.900 en Bogotá, $99,900 en Ciudad de México, 39,90 € en Madrid. 3.412 clientes, no +3.000. Reseñas que suenan a alguien real.":
    "The price in your country's currency and separator: $99.900 in Bogotá, $99,900 in Mexico City, 39,90 € in Madrid. 3,412 customers, not 3,000+. Reviews that sound like a real person.",
};
