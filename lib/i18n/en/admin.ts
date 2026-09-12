/** El panel de administración: tablero, usuarios, campañas, calidad y auditoría. */
export const ADMIN: Record<string, string> = {
  /* ---------------- Tablero ---------------- */
  Administración: "Admin",
  Tablero: "Dashboard",
  "El estado de la plataforma en una pantalla: quién la usa, qué produce y qué está corriendo por debajo.":
    "The state of the platform on one screen: who uses it, what it produces and what is running underneath.",
  Cuentas: "Accounts",
  "de todos los usuarios": "across all users",
  "acumulado histórico": "all-time total",
  "Créditos consumidos": "Credits spent",
  "Altas de cuentas": "New accounts",
  "Cuentas nuevas por día": "New accounts per day",
  "Campañas creadas": "Campaigns created",
  "Campañas nuevas por día": "New campaigns per day",
  "Reparto por plan": "Split by plan",
  "Estado de las campañas": "Campaign status",
  "Salud del sistema": "System health",
  "Se lee, no se configura: cada valor sale del proceso que está sirviendo esta página.":
    "Read-only, not configurable: every value comes from the process serving this page.",
  "Motor de prompts": "Prompt engine",
  "Gemini conectado": "Gemini connected",
  "Motor local": "Local engine",
  "Generación de imágenes": "Image generation",
  "Rate limiting": "Rate limiting",
  "Base de datos": "Database",
  "Todavía no hay cuentas que repartir.": "No accounts to split up yet.",
  Día: "Day",

  /* ---------------- Usuarios ---------------- */
  Usuarios: "Users",
  "Buscar por correo": "Search by email",
  "ana@ejemplo.com": "jane@example.com",
  Rol: "Role",
  Orden: "Sort",
  "Ninguna cuenta coincide con estos filtros.": "No account matches these filters.",
  "Cuentas de la plataforma con plan, rol, saldo y actividad.":
    "Platform accounts with plan, role, balance and activity.",
  "Ver ficha": "View profile",
  "Ficha de usuario": "User profile",
  "eres tú": "this is you",
  "Campañas de esta cuenta": "Campaigns on this account",
  "Esta cuenta todavía no ha creado ninguna campaña.":
    "This account hasn't created any campaigns yet.",
  "Campañas de esta cuenta con estado y número de prompts.":
    "Campaigns on this account with status and prompt count.",
  "Movimientos de crédito": "Credit movements",
  "Sin movimientos registrados en esta cuenta.": "No movements recorded on this account.",
  "Auditoría relacionada": "Related audit trail",
  "Lo que el equipo ha hecho sobre esta cuenta, y lo que esta cuenta ha hecho sobre otras si tiene rol de administrador.":
    "What the team has done to this account, and what this account has done to others if it holds an admin role.",
  "Nadie ha tocado esta cuenta desde el panel.": "Nobody has touched this account from the panel.",
  "Acciones administrativas relacionadas con esta cuenta.":
    "Admin actions related to this account.",

  /* ---------------- Acciones sobre una cuenta ---------------- */
  "Cambiar el plan recarga los créditos del mes y reinicia la fecha de renovación.":
    "Changing the plan tops the month's credits back up and resets the renewal date.",
  "Nuevo plan": "New plan",
  "Cambiando…": "Changing…",
  "Aplicar plan": "Apply plan",
  "Ajustar créditos": "Adjust credits",
  "Positivo suma, negativo resta. El motivo aparece en el historial que ve el propio usuario, así que escríbelo pensando en que él lo va a leer.":
    "Positive adds, negative subtracts. The reason shows up in the history the user sees themselves, so write it knowing they will read it.",
  "-10 o 25": "-10 or 25",
  Motivo: "Reason",
  "Compensación por generación fallida": "Compensation for a failed generation",
  "Ajustando…": "Adjusting…",
  "Aplicar ajuste": "Apply adjustment",
  "Borrar la cuenta": "Delete the account",
  "Se borran también sus campañas y su historial de créditos. La línea de auditoría sobrevive al borrado: queda constancia de quién lo hizo y cuándo.":
    "Their campaigns and credit history go too. The audit entry survives the deletion: there is a record of who did it and when.",
  "Borrar cuenta": "Delete account",
  "No puedes borrar tu propia cuenta desde el panel.":
    "You can't delete your own account from the panel.",
  "Borrar esta cuenta": "Delete this account",
  "Esta acción no se puede deshacer. Escribe el correo exacto para confirmar.":
    "This cannot be undone. Type the exact email to confirm.",
  "Escribe el correo": "Type the email",
  "Borrando…": "Deleting…",
  "Borrar definitivamente": "Delete permanently",

  /* ---------------- Campañas ---------------- */
  "nombre de campaña o correo": "campaign name or email",
  Sección: "Section",
  "Solo con bloqueo": "Blocked only",
  "Ninguna campaña coincide con estos filtros.": "No campaign matches these filters.",
  "Campañas de la plataforma con dueño, estado y advertencias del validador.":
    "Platform campaigns with owner, status and validator warnings.",
  "Precio del producto": "Product price",
  "Paleta asignada": "Assigned palette",
  "Prompts generados": "Prompts generated",
  "En solo lectura. Esta pantalla sirve para entender qué produjo la metodología, no para corregirlo por encima del usuario.":
    "Read-only. This screen is for understanding what the method produced, not for correcting it over the user's head.",
  "Esta campaña no llegó a generar ningún prompt.":
    "This campaign never generated a single prompt.",
  "Borrar campaña": "Delete campaign",
  "Borrar esta campaña": "Delete this campaign",
  "Se borra el trabajo de un cliente y no se puede deshacer. Hazlo solo por abuso.":
    "This erases a client's work and cannot be undone. Only do it for abuse.",
  campaña: "campaign",
  dueño: "owner",

  /* ---------------- Calidad ---------------- */
  "Calidad de la metodología": "Method quality",
  "El validador corre sobre cada prompt que se genera. Esto es lo que ha encontrado en toda la plataforma: qué reglas se incumplen, en qué secciones y con qué tendencia.":
    "The validator runs on every prompt generated. This is what it has found across the whole platform: which rules get broken, in which sections, and which way the trend is going.",
  "Todavía no hay ningún prompt generado en la plataforma.":
    "No prompt has been generated on the platform yet.",
  "Prompts analizados": "Prompts analysed",
  "Sin ninguna advertencia": "With no warnings at all",
  "Con bloqueo": "Blocked",
  "Incumplimientos por regla": "Breaches by rule",
  "«Prompts afectados» cuenta cada prompt una sola vez por regla, aunque la incumpla en varios sitios. «Ocurrencias» las cuenta todas: la distancia entre las dos columnas dice si el problema está repartido o concentrado.":
    "“Prompts affected” counts each prompt once per rule, even when it breaks it in several places. “Occurrences” counts them all: the gap between the two columns tells you whether the problem is spread out or concentrated.",
  "Reglas del validador ordenadas por número de prompts afectados.":
    "Validator rules ordered by the number of prompts affected.",
  "Dónde falla cada regla": "Where each rule fails",
  "La cifra es el número de prompts afectados; la intensidad del color es la proporción sobre los prompts de esa misma tipología, para que una sección con pocas campañas no parezca sana solo por tener menos casos. Una columna encendida entera señala a la regla; una fila encendida entera, al constructor de esa tipología.":
    "The figure is the number of prompts affected; the colour intensity is the share of prompts within that same section type, so a section with few campaigns doesn't look healthy just for having fewer cases. A whole column lit up points at the rule; a whole row lit up points at the builder for that section type.",
  "Todavía no hay suficientes secciones distintas para cruzar.":
    "There aren't enough distinct sections to cross-tabulate yet.",
  "Tendencia del bloqueo": "Blocking trend",
  "Porcentaje de los prompts de cada día que salieron con al menos un bloqueo. Subir aquí significa que la metodología está produciendo peor, no que los usuarios escriban peor.":
    "The percentage of each day's prompts that came out with at least one block. A rise here means the method is producing worse output, not that users are writing worse.",
  "Prompts con bloqueo por día": "Blocked prompts per day",
  "Palabras de la lista negra": "Blacklisted words",
  "Las que más se cuelan en los prompts. Si una encabeza la lista mes tras mes, el sitio donde arreglarla es el constructor, no el aviso.":
    "The ones that slip into prompts most often. If one tops the list month after month, the place to fix it is the builder, not the warning.",
  "Ninguna palabra de la lista negra ha aparecido todavía.":
    "No blacklisted word has turned up yet.",
  "Prompts afectados por cada regla, desglosados por tipología de sección.":
    "Prompts affected by each rule, broken down by section type.",
  Tipología: "Section type",

  /* ---------------- Auditoría ---------------- */
  Auditoría: "Audit trail",
  "Toda acción del panel que cambia algo queda aquí. Este registro no se puede editar ni borrar desde ninguna parte de la aplicación.":
    "Every panel action that changes something lands here. This log cannot be edited or deleted from anywhere in the application.",
  "Exportar CSV": "Export CSV",
  Acción: "Action",
  Desde: "From",
  Hasta: "To",
  "No hay ninguna acción registrada con estos filtros.":
    "No action recorded under these filters.",
  "Acciones administrativas con actor, objetivo, detalle y origen.":
    "Admin actions with actor, target, detail and origin.",

  "No se pudo completar la acción.": "That action couldn't be completed.",
  "El ajuste tiene que ser un número entero distinto de cero.":
    "The adjustment has to be a whole number other than zero.",
  "No se pudo borrar la cuenta.": "The account couldn't be deleted.",
  "Cuenta borrada.": "Account deleted.",
  "Queda registrada en la auditoría.": "It is recorded in the audit trail.",
  "Plan actualizado.": "Plan updated.",
  Calidad: "Quality",
  "Secciones de administración": "Admin sections",
};
