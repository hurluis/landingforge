import { z } from "zod";

/**
 * Esquemas zod — §9.6. Un esquema, validación en cliente y en servidor.
 * Se valida en el borde del servidor incluso en campos que el formulario ya
 * validó: el cliente no es de fiar.
 */

export const esquemaTipoProducto = z.enum([
  "suplemento-deportivo",
  "suplemento-rendimiento",
  "dispositivo-belleza",
  "cosmetica",
  "suplemento-natural",
  "electronica",
  "clinico",
  "skincare-lujo",
  "control-peso",
  "capilar",
  "otro",
]);

export const esquemaMercado = z.enum(["CO", "MX", "PE", "CL", "AR", "EC", "GT", "ES", "US", "INT"]);

export const esquemaTipologia = z.enum([
  "hero",
  "beneficios",
  "antes-despues",
  "paso-a-paso",
  "testimonios",
  "autoridad",
  "confianza",
  "precios",
  "estilo-de-vida",
]);

export const esquemaProducto = z
  .object({
    nombre: z.string().trim().min(2, "Escribe el nombre del producto").max(80),
    descripcion: z.string().trim().max(400).default(""),
    imagenUrl: z.string().max(2_000_000).optional(),
    tipo: esquemaTipoProducto,
    audiencia: z.object({
      genero: z.enum(["f", "m", "mixto"]),
      edadMin: z.number().int().min(13).max(90),
      edadMax: z.number().int().min(13).max(90),
    }),
    beneficioPrincipal: z.string().trim().min(3, "Escribe el beneficio principal").max(80),
    mercado: esquemaMercado.default("CO"),
    precio: z.number().int().min(0).max(999_999_999),
    precioTachado: z.number().int().min(0).max(999_999_999).optional(),
  })
  .refine((p) => p.audiencia.edadMax >= p.audiencia.edadMin, {
    message: "La edad máxima no puede ser menor que la mínima",
    path: ["audiencia", "edadMax"],
  })
  .refine((p) => p.descripcion.trim() !== "" || Boolean(p.imagenUrl), {
    message: "Se requiere la imagen o la descripción del producto",
    path: ["descripcion"],
  });

export const esquemaPaleta = z.object({
  id: z.string(),
  nombre: z.string(),
  razon: z.string(),
  fondo: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  acento: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  texto: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  secundario: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  energia: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export const esquemaGeneracion = z.object({
  producto: esquemaProducto,
  paleta: esquemaPaleta,
  tipologias: z.array(esquemaTipologia).min(1, "Elige al menos una sección").max(9),
  campanaId: z.string().optional(),
});

export const esquemaChat = z.object({
  mensajes: z
    .array(
      z.object({
        rol: z.enum(["usuario", "asistente"]),
        texto: z.string().trim().min(1).max(1000),
      }),
    )
    .min(1)
    .max(20, "Esta conversación llegó a su límite de 20 mensajes"),
});

export const esquemaCredenciales = z.object({
  email: z.string().trim().toLowerCase().email("Escribe un correo válido"),
  contrasena: z.string().min(8, "La contraseña necesita al menos 8 caracteres").max(200),
});

export const esquemaEdicionPrompt = z.object({
  tipologia: esquemaTipologia,
  texto: z.string().trim().min(1).max(20000),
});

export const esquemaCampanaPatch = z.object({
  nombre: z.string().trim().min(1).max(120).optional(),
  prompt: esquemaEdicionPrompt.optional(),
  accion: z.enum(["duplicar"]).optional(),
});

/** Prueba pública de la home: un prompt por visitante, sin cuenta. */
export const esquemaPruebaPublica = z.object({
  descripcion: z.string().trim().min(6, "Describe tu producto en una línea").max(200),
  tipologia: esquemaTipologia,
});

export const esquemaPlan = z.object({
  plan: z.enum(["semilla", "estudio", "agencia"]),
});
