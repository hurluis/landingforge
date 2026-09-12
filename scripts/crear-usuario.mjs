/**
 * Crea (o restablece) una cuenta de prueba para poder entrar al panel.
 *
 *   node scripts/crear-usuario.mjs
 *   node scripts/crear-usuario.mjs otro@correo.co MiClave1234 agencia
 *   node scripts/crear-usuario.mjs jefe@correo.co MiClave1234 agencia admin
 *
 * Escribe directo en SQLite en vez de llamar a /api/auth a propósito: así
 * funciona con el servidor apagado, que es justo cuando hace falta —cuando no
 * puedes entrar—. El precio de esa decisión es que este archivo tiene que
 * reproducir dos cosas del repositorio real: el formato del hash (scrypt con
 * sal, `sal:derivada` en hex) y el apunte en `movimientos`. Si alguna de las
 * dos cambia en lib/, hay que cambiarla aquí.
 *
 * Es idempotente: si el correo ya existe, le pone esta contraseña y le repone
 * los créditos en vez de fallar. Volver a correrlo es la forma de recuperar
 * una cuenta de prueba cuya contraseña se olvidó.
 */
import { DatabaseSync } from "node:sqlite";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { join } from "node:path";

const [
  email = "prueba@landingforge.co",
  contrasena = "Prueba1234",
  plan = "estudio",
  /* El arranque normal del primer administrador es ADMIN_EMAILS, que promueve
     al entrar. Esto es el atajo para cuando lo que quieres es una cuenta de
     pruebas con panel y no tocar el entorno. */
  rol = "usuario",
] = process.argv.slice(2);

/* Los mismos números que lib/planes.ts. */
const CREDITOS = { semilla: 30, estudio: 120, agencia: 400, fundicion: 900 };
if (!CREDITOS[plan]) {
  console.error(`Plan desconocido: ${plan}. Usa semilla, estudio, agencia o fundicion.`);
  process.exit(1);
}
if (!["usuario", "admin"].includes(rol)) {
  console.error(`Rol desconocido: ${rol}. Usa usuario o admin.`);
  process.exit(1);
}
if (contrasena.length < 8) {
  console.error("La contraseña necesita al menos 8 caracteres (esquemaCredenciales).");
  process.exit(1);
}

const NOMBRE_BD = (process.env.DATABASE_URL ?? "landingforge.db").replace(/[^\w.-]/g, "");
const bd = new DatabaseSync(join(process.cwd(), "datos", NOMBRE_BD));
bd.exec("PRAGMA foreign_keys = ON");

/* El esquema se crea aquí también: la primera vez que se corre esto puede que
   el servidor nunca haya arrancado y las tablas no existan todavía. */
bd.exec(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, hash TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'semilla', rol TEXT NOT NULL DEFAULT 'usuario',
    creditos INTEGER NOT NULL DEFAULT 0,
    renueva_en TEXT NOT NULL, creado_en TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS movimientos (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    campana_id TEXT, campana_nombre TEXT NOT NULL, delta INTEGER NOT NULL,
    motivo TEXT NOT NULL, fecha TEXT NOT NULL
  );
`);

/** Mismo formato que lib/auth/sesion.ts: scrypt, sal de 16 bytes, clave de 64. */
function hashear(clave) {
  const sal = randomBytes(16);
  return `${sal.toString("hex")}:${scryptSync(clave, sal, 64).toString("hex")}`;
}

const identificador = (prefijo) =>
  `${prefijo}_${randomUUID().replaceAll("-", "").slice(0, 12)}`;

const ahora = new Date().toISOString();
const renueva = new Date();
renueva.setMonth(renueva.getMonth() + 1);

const correo = email.trim().toLowerCase();
const existente = bd.prepare("SELECT id FROM usuarios WHERE email = ?").get(correo);

/* La base puede venir de antes de que existiera el rol: misma migración que
   hace lib/datos/sqlite.ts al conectar, porque este script corre sin servidor
   y tiene que poder arreglar una base vieja él solo. */
const columnas = bd.prepare("PRAGMA table_info(usuarios)").all().map((c) => c.name);
if (!columnas.includes("rol")) {
  bd.exec("ALTER TABLE usuarios ADD COLUMN rol TEXT NOT NULL DEFAULT 'usuario'");
}

bd.exec("BEGIN IMMEDIATE");
try {
  let usuarioId;
  if (existente) {
    usuarioId = existente.id;
    bd.prepare(
      "UPDATE usuarios SET hash = ?, plan = ?, rol = ?, creditos = ?, renueva_en = ? WHERE id = ?",
    ).run(hashear(contrasena), plan, rol, CREDITOS[plan], renueva.toISOString(), usuarioId);
  } else {
    usuarioId = identificador("usr");
    bd.prepare(
      `INSERT INTO usuarios (id, email, hash, plan, rol, creditos, renueva_en, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(usuarioId, correo, hashear(contrasena), plan, rol, CREDITOS[plan], renueva.toISOString(), ahora);
  }

  bd.prepare(
    `INSERT INTO movimientos (id, usuario_id, campana_id, campana_nombre, delta, motivo, fecha)
     VALUES (?, ?, NULL, ?, ?, 'recarga-plan', ?)`,
  ).run(identificador("mov"), usuarioId, `Plan ${plan}`, CREDITOS[plan], ahora);

  bd.exec("COMMIT");

  console.log(`\n  ${existente ? "Cuenta restablecida" : "Cuenta creada"}\n`);
  console.log(`  Correo      ${correo}`);
  console.log(`  Contraseña  ${contrasena}`);
  console.log(`  Plan        ${plan} · ${CREDITOS[plan]} créditos`);
  console.log(`  Rol         ${rol}${rol === "admin" ? "  ·  panel en /admin" : ""}`);
  console.log(`  Id          ${usuarioId}\n`);
  console.log("  Entra en http://localhost:3000/entrar\n");
} catch (e) {
  bd.exec("ROLLBACK");
  throw e;
}
