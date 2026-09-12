/**
 * Los tres documentos legales. Se traducen enteros porque §3.3 del brief dice
 * que la letra pequeña escondida destruye la confianza del comprador: dejarla
 * en un idioma que el visitante no lee sería esconderla igual.
 *
 * Traducción de sentido, no jurada. Son las condiciones de un producto, no un
 * contrato firmado ante notario, y se leen mejor en el registro llano del
 * resto de la página.
 */
export const LEGAL: Record<string, string> = {
  /* ---------------- Términos ---------------- */
  "Esto es lo que aceptas al usar LandingForge, dicho sin fórmulas que nadie lee.":
    "This is what you agree to by using LandingForge, written without the boilerplate nobody reads.",
  "Qué entrega LandingForge": "What LandingForge delivers",
  "LandingForge construye y valida prompts de generación de imagen para las secciones de una landing page, y asigna una paleta de marca a tu producto.":
    "LandingForge builds and validates image-generation prompts for the sections of a landing page, and assigns a brand palette to your product.",
  "No es un constructor de sitios web, no provee hosting y no publica tu página. Lo que recibes es el paquete visual y su copy.":
    "It is not a website builder, it does not provide hosting and it does not publish your page. What you get is the visual kit and its copy.",
  "De quién es lo que generas": "Who owns what you generate",
  "Los prompts y las campañas que generas son tuyos. Los puedes exportar, editar y usar donde quieras, también fuera de LandingForge.":
    "The prompts and campaigns you generate are yours. You can export them, edit them and use them anywhere, including outside LandingForge.",
  "Nos reservamos el derecho de usar datos agregados y anonimizados sobre el uso del producto para mejorarlo. Nunca tu contenido concreto ni tus fotos.":
    "We reserve the right to use aggregated, anonymised data about product usage to improve it. Never your actual content or your photos.",
  "Lo que no podemos garantizar": "What we cannot guarantee",
  "La salida de un modelo generativo varía. La metodología reduce mucho la variación, pero no la elimina.":
    "The output of a generative model varies. The method cuts that variation down a great deal, but it does not remove it.",
  "Tú eres responsable de revisar que lo que publicas cumpla la regulación aplicable a tu producto, incluido el registro sanitario de tu país —INVIMA, COFEPRIS, FDA u otro— cuando corresponda. LandingForge no valida afirmaciones de salud.":
    "You are responsible for checking that what you publish complies with the regulation that applies to your product, including your country's health registration — INVIMA, COFEPRIS, FDA or another — where relevant. LandingForge does not validate health claims.",
  "Cuentas y suspensión": "Accounts and suspension",
  "Una cuenta es de una persona o de una empresa. Si detectamos uso automatizado que degrade el servicio para los demás, podemos limitar la cuenta y te avisamos por correo antes.":
    "An account belongs to one person or one company. If we detect automated use that degrades the service for everyone else, we may limit the account, and we email you before we do.",

  /* ---------------- Privacidad ---------------- */
  "Qué guardamos, dónde y por cuánto tiempo.": "What we store, where, and for how long.",
  "Qué guardamos": "What we store",
  "Tu correo y una versión cifrada de tu contraseña, que no se puede revertir. Nunca vemos tu contraseña.":
    "Your email and an encrypted version of your password that cannot be reversed. We never see your password.",
  "Las campañas que creas: el producto que describiste, la foto que subiste, la paleta asignada y los prompts generados.":
    "The campaigns you create: the product you described, the photo you uploaded, the palette assigned and the prompts generated.",
  "El historial de consumo de créditos, porque es la base de tu facturación.":
    "Your credit usage history, because it is the basis of your billing.",
  "Qué no guardamos": "What we don't store",
  "Las conversaciones con el asistente no se persisten: viven en la memoria de tu sesión y desaparecen al cerrar la pestaña.":
    "Conversations with the assistant are not persisted: they live in your session's memory and disappear when you close the tab.",
  "No usamos rastreadores de terceros ni vendemos datos a nadie.":
    "We use no third-party trackers and we sell data to nobody.",
  Terceros: "Third parties",
  "Los prompts se redactan con la API de Gemini de Google. Eso significa que el texto de tu producto y su descripción viajan a ese servicio para procesarse. Tus credenciales nunca salen de nuestro servidor.":
    "Prompts are written using Google's Gemini API. That means your product text and its description travel to that service to be processed. Your credentials never leave our server.",
  "Borrar tu cuenta": "Deleting your account",
  "Escribe a hola@landingforge.co y borramos tu cuenta y todas tus campañas. No queda una copia de respaldo indefinida.":
    "Write to hola@landingforge.co and we delete your account and all your campaigns. No backup copy is kept indefinitely.",

  /* ---------------- Política de créditos ---------------- */
  "Cómo se consumen, qué caduca y por qué los planes traen holgura.":
    "How they are spent, what expires, and why the plans carry slack.",
  "Qué es un crédito": "What a credit is",
  "Un crédito equivale a una generación: una sección con su prompt construido y validado, y su imagen 9:16 en calidad máxima.":
    "One credit equals one generation: a section with its prompt built and validated, and its 9:16 image at full quality.",
  "Cada intento consume un crédito, salga como salga. Repetir una sección para probar otra idea también.":
    "Every attempt uses a credit, however it turns out. Re-running a section to try another idea counts too.",
  "Cuándo se descuentan": "When they are deducted",
  "Se descuentan al iniciar la generación, antes de gastar ningún token, y solo si te alcanzan. Si no te alcanzan, el botón te dice exactamente cuántos faltan y no se cobra nada.":
    "They are deducted when the generation starts, before a single token is spent, and only if you have enough. If you don't, the button tells you exactly how many are missing and nothing is charged.",
  "Por qué no hay devolución automática": "Why there is no automatic refund",
  "Una sección que falla ya se produjo, y una devolución automática se puede reclamar después de haberla visto. Ese agujero encarecería el producto para todos, así que la compensación no es un botón: es el diseño del plan.":
    "A section that fails has already been produced, and an automatic refund can be claimed after seeing it. That hole would make the product more expensive for everyone, so the compensation isn't a button: it is how the plan is built.",
  "Por eso el formulario pregunta lo que pregunta —producto, audiencia, mercado, beneficio y precio—: cuanta mejor sea la entrada, menos intentos hacen falta. Y por eso los planes traen holgura: 30 secciones en el de entrada y 120 en el siguiente, muchas más de las nueve de una campaña.":
    "That is why the form asks what it asks — product, audience, market, benefit and price: the better the input, the fewer attempts it takes. And it is why the plans carry slack: 30 sections on the entry plan and 120 on the next, far more than the nine a campaign takes.",
  "Si el fallo es nuestro y no tuyo, escribe a hola@landingforge.co con el nombre de la campaña. El equipo puede ajustar tus créditos a mano, y ese ajuste queda registrado en tu historial con su motivo.":
    "If the failure is ours rather than yours, write to hola@landingforge.co with the campaign name. The team can adjust your credits by hand, and that adjustment is recorded in your history along with its reason.",
  Caducidad: "Expiry",
  "Los créditos incluidos en tu plan no se acumulan entre meses: se reinician en la fecha de renovación.":
    "The credits included in your plan don't roll over between months: they reset on your renewal date.",
  "Los créditos que compras aparte sí se acumulan y no caducan mientras tu cuenta esté activa.":
    "The credits you buy separately do accumulate, and they don't expire while your account is active.",

  /* ---------------- La tabla de números ---------------- */
  "Los números, hoy": "The numbers, as of today",
  "{plan} · {precio} / mes · {n} secciones": "{plan} · {precio} / mo · {n} sections",
  " · extra a {precio}, sin tope": " · extra at {precio}, no ceiling",
  "Paquete extra · {precio} · {n} secciones": "Extra pack · {precio} · {n} sections",
  "Registro · {n} créditos gratis, sin tarjeta": "Sign-up · {n} free credits, no card",
};
