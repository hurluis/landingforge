/** El producto con sesión abierta: biblioteca, cuenta, estudio, campaña y asistente. */
export const PRODUCTO: Record<string, string> = {
  /* ---------------- Chrome del panel ---------------- */
  Biblioteca: "Library",
  Cuenta: "Account",
  "Volver a la app": "Back to the app",
  "Cerrar sesión": "Log out",
  "Página anterior": "Previous page",
  "Página siguiente": "Next page",
  Buscar: "Search",
  Estado: "Status",
  Plan: "Plan",
  Créditos: "Credits",
  Campaña: "Campaign",
  Campañas: "Campaigns",
  Prompts: "Prompts",
  Bloqueos: "Blocks",
  Avisos: "Warnings",

  /* ---------------- Biblioteca ---------------- */
  "Tus campañas": "Your campaigns",
  "Nueva campaña": "New campaign",
  "Buscar campañas": "Search campaigns",
  "Buscar por producto o paleta": "Search by product or palette",
  "listos para copiar": "ready to copy",
  "Secciones este ciclo": "Sections this cycle",
  "Se borran la campaña y sus prompts. No se puede deshacer, y los créditos que ya gastaste no vuelven.":
    "The campaign and its prompts are deleted. It cannot be undone, and the credits you already spent don't come back.",
  "Eliminar la campaña": "Delete the campaign",
  "Tu primera campaña": "Your first campaign",
  "Sube la foto de tu producto y recibe las nueve secciones.":
    "Upload your product photo and get all nine sections.",
  "Cuatro preguntas: qué es, para quién, dónde lo vendes y cuánto cuesta. La matriz asigna la paleta y el motor construye un prompt validado por sección.":
    "Four questions: what it is, who it's for, where you sell it and what it costs. The matrix assigns the palette and the engine builds one validated prompt per section.",
  "Crear mi primera campaña": "Create my first campaign",

  /* ---------------- Cuenta ---------------- */
  "Cambiar de plan": "Change plan",
  "En esta versión el cambio es una simulación: ajusta tu plan y recarga las secciones sin cobrar nada. Todavía no hay pasarela de pago conectada.":
    "In this version the change is a simulation: adjust your plan and top the sections back up without being charged. No payment gateway is connected yet.",
  "Es tu plan.": "This is your plan.",
  Consumo: "Usage",
  "Cada crédito que entra o sale, con la campaña a la que fue.":
    "Every credit in and out, with the campaign it went to.",
  "Todavía no has consumido créditos.": "You haven't spent any credits yet.",
  "Motor de esta instancia": "Engine behind this instance",
  "Historial de consumo y recarga de créditos.": "History of credit usage and top-ups.",

  /* ---------------- Asistente ---------------- */
  "Abrir el asistente de LandingForge": "Open the LandingForge assistant",
  "Asistente LandingForge": "LandingForge assistant",
  "Cerrar el asistente": "Close the assistant",
  Escribiendo: "Typing",
  "Escribe tu pregunta": "Type your question",
  "Enviar pregunta": "Send question",

  /* ---------------- Estudio: el producto ---------------- */
  "Nombre del producto": "Product name",
  "Colágeno Verisol 60 cápsulas": "Verisol Collagen, 60 capsules",
  Descripción: "Description",
  "Colágeno hidrolizado tipo I con vitamina C, en cápsulas, para firmeza de la piel.":
    "Hydrolysed type I collagen with vitamin C, in capsules, for skin firmness.",
  "Una o dos líneas. Se usa para describir el sujeto en cada prompt.":
    "One or two lines. It is used to describe the subject in every prompt.",
  "Foto del producto": "Product photo",
  "Quitar la foto": "Remove the photo",
  "JPG · PNG · WebP · hasta 8MB": "JPG · PNG · WebP · up to 8MB",
  "Se requiere la foto o la descripción. Con las dos, las piezas salen más fieles.":
    "Either the photo or the description is required. With both, the pieces come out truer.",

  /* ---------------- Estudio: mercado y audiencia ---------------- */
  "País donde vendes": "Country you sell in",
  "Tipo de producto": "Product type",
  "Es la primera dimensión de la matriz que asigna tu paleta.":
    "This is the first dimension of the matrix that assigns your palette.",
  "Edad desde": "Age from",
  "Edad hasta": "Age to",
  "Beneficio principal": "Main benefit",
  "Precio actual": "Current price",
  "Precio tachado": "Struck-through price",
  "El precio anterior, si hay descuento.": "The previous price, if there's a discount.",

  /* ---------------- Estudio: identidad y progreso ---------------- */
  "Paleta aceptada": "Palette accepted",
  "La matriz cruza tipo de producto, audiencia y registro emocional. Si cambias el tipo o la audiencia en el paso anterior, la propuesta cambia con ellos.":
    "The matrix crosses product type, audience and emotional register. Change the type or the audience in the previous step and the proposal changes with them.",
  "Nombre de la campaña": "Campaign name",
  "Secciones de la campaña": "Campaign sections",
  Atrás: "Back",
  "Construyendo la campaña": "Building the campaign",
  "Cada sección se valida contra las siete reglas antes de guardarse.":
    "Every section is validated against the seven rules before it is saved.",
  "en cola": "queued",

  /* ---------------- Campaña ---------------- */
  Validación: "Validation",
  "Pasa las siete reglas. Listo para generar.": "Passes all seven rules. Ready to generate.",
  falló: "failed",
  "adjunta la foto del producto": "attach the product photo",
  "Guardando…": "Saving…",
  "Generar la imagen": "Generate the image",
  "El generador de imágenes no está activo en esta instancia. Tu prompt ya está listo: cópialo y córrelo donde quieras mientras tanto.":
    "The image generator isn't switched on in this instance. Your prompt is ready: copy it and run it wherever you like in the meantime.",
  "Esta campaña no tiene prompts": "This campaign has no prompts",
  "Todas las secciones fallaron y sus créditos volvieron a tu cuenta. Vuelve a intentarlo desde una campaña nueva.":
    "Every section failed and their credits went back to your account. Try again from a new campaign.",

  /* ---------------- Avisos y confirmaciones ---------------- */
  "Campaña duplicada": "Campaign duplicated",
  "No se pudo duplicar.": "That couldn't be duplicated.",
  "Campaña eliminada": "Campaign deleted",
  "No se pudo eliminar.": "That couldn't be deleted.",
  "Prompt guardado": "Prompt saved",
  "No se pudo guardar": "Couldn't save",
  "Vuelve a intentarlo.": "Try that again.",
  "Campaña renombrada": "Campaign renamed",
  "No se pudo renombrar.": "That couldn't be renamed.",
  "Guardar cambios": "Save changes",
  "Plan actualizado": "Plan updated",
  "Cambio simulado: no se cobró nada.": "Simulated change: nothing was charged.",
  "No se pudo cambiar el plan.": "The plan couldn't be changed.",

  /* ---------------- Cuenta: el saldo ---------------- */
  Generación: "Generation",
  Devolución: "Refund",
  "Recarga del plan": "Plan top-up",
  "Créditos de bienvenida": "Welcome credits",
  "Ajuste del equipo": "Adjustment by the team",
  "Se factura el": "Billed on",
  "Renueva el": "Renews on",
  "Campañas guardadas": "Campaigns saved",
  "Secciones de este ciclo": "Sections this cycle",
  "Créditos este mes": "Credits this month",
  "Un crédito es una sección lista para publicar. Los del plan no se acumulan entre meses; los que compras aparte, sí.":
    "One credit is one section ready to publish. Plan credits don't roll over between months; the ones you buy separately do.",
  "Los prompts los redacta Gemini sobre el esqueleto de la metodología. La clave vive solo en el servidor.":
    "Prompts are written by Gemini on top of the method's skeleton. The key lives on the server and nowhere else.",
  "No hay clave de Gemini configurada, así que los prompts los construye el motor local con la misma metodología, sin modelo generativo. El resultado es válido; lo que falta es la redacción del modelo.":
    "No Gemini key is configured, so prompts are built by the local engine using the same method, with no generative model. The result is valid; what's missing is the model's phrasing.",

  /* ---------------- Asistente ---------------- */
  "Pregúntame lo que quieras sobre LandingForge: cómo funciona, qué genera, cuánto cuesta o por qué no usamos plantillas.":
    "Ask me anything about LandingForge: how it works, what it generates, what it costs, or why we don't use templates.",
  "¿Por qué no es una plantilla?": "Why isn't this a template?",
  "¿Cuánto cuesta empezar?": "What does it cost to start?",
  "No se pudo conectar con el asistente.": "Couldn't reach the assistant.",
  "Se cortó la conexión. Vuelve a preguntar.": "The connection dropped. Ask again.",

  /* ---------------- Validador ---------------- */
  "Límite de {n} caracteres": "{n}-character limit",
  "Lista negra": "Blacklist",
  "Bloque de paleta": "Palette block",
  "Longitud {min}–{max}": "Length {min}–{max}",
  "Prosa narrativa": "Narrative prose",

  /* ---------------- Estudio ---------------- */
  "Usar esta paleta": "Use this palette",
  "Sin alternativas restantes": "No alternatives left",
  "Otro país": "Another country",
  "La edad máxima no puede ser menor que la mínima.":
    "The maximum age can't be lower than the minimum.",
  "Se usa como titular renderizado. Por encima de 25 caracteres el render deforma las letras.":
    "This is used as the rendered headline. Past 25 characters the render warps the letters.",
  "Formato no admitido": "Format not supported",
  "Acepta JPG, PNG o WebP.": "JPG, PNG or WebP only.",
  "La imagen pesa demasiado": "That image is too heavy",
  "No se pudo leer la imagen": "Couldn't read the image",
  "Prueba con otro archivo.": "Try a different file.",
  "Vista previa de la foto de tu producto": "Preview of your product photo",
  "Procesando la imagen…": "Processing the image…",
  "Arrastra la foto o haz clic": "Drag the photo in, or click",
  "El producto": "The product",
  "Qué vas a vender y cómo se ve.": "What you're selling and what it looks like.",
  "El mercado": "The market",
  "Dónde lo vendes, para quién es, qué promete y cuánto cuesta.":
    "Where you sell it, who it's for, what it promises and what it costs.",
  "La identidad": "The identity",
  "La paleta que la matriz asigna a este producto.":
    "The palette the matrix assigns to this product.",
  "Las secciones": "The sections",
  "Qué piezas quieres de esta campaña.": "Which pieces you want from this campaign.",
  "No se pudo iniciar la generación.": "The generation couldn't be started.",
  "No se pudo generar": "Couldn't generate",
  "Generar los prompts": "Generate the prompts",

  /* ---------------- Chrome ---------------- */
  "LandingForge, ir al inicio": "LandingForge, back to home",
  "Secciones de la aplicación": "App sections",

  "Plan {nombre}": "{nombre} plan",
  "de {n} créditos": "of {n} credits",
  " / {n} créditos": " / {n} credits",
  "{saldo} de {total} créditos": "{saldo} of {total} credits",
  Salir: "Log out",

  "no se generó": "didn't generate",
};
