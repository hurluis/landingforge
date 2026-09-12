import "server-only";

import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import type {
  Campana,
  MovimientoCredito,
  Plan,
  Prompt,
  Rol,
  Usuario,
} from "@/lib/datos/tipos";
import type { Repositorio } from "@/lib/datos/repositorio";
import { CREDITOS_BIENVENIDA, esPorUso, plan as definicionPlan } from "@/lib/planes";
import { id } from "@/lib/utils";
import { productoGuardado } from "@/lib/datos/producto";

/**
 * Persistencia — SQLite a través de `node:sqlite`, el módulo integrado de
 * Node 22+. Decisión de §17 punto 2, resuelta a favor de SQLite frente a
 * Supabase por tres razones: no añade un servicio externo a la sustentación,
 * no arrastra dependencias nativas que compilar, y el esquema completo cabe
 * en este archivo, así que se puede leer y defender de principio a fin.
 *
 * Las campañas se guardan con producto, paleta y prompts en columnas JSON.
 * Es deliberado: son documentos que siempre se leen enteros, y normalizarlos
 * a nueve tablas no compraría nada a esta escala. Los créditos y los usuarios
 * sí son relacionales, porque ahí hay reglas de negocio y transacciones.
 */

/* La ruta se mantiene acotada a `datos/` de forma estática: si se construye
   con `resolve` sobre una variable de entorno libre, el empaquetador no puede
   acotar el análisis y termina trazando todo el proyecto —incluida la carpeta
   public— dentro del bundle del servidor. */
const NOMBRE_BD = (process.env.DATABASE_URL ?? "landingforge.db").replace(/[^\w.-]/g, "");
const RUTA = join(process.cwd(), "datos", NOMBRE_BD);

let db: DatabaseSync | null = null;

/**
 * Migraciones de esquema para bases ya existentes.
 *
 * `CREATE TABLE IF NOT EXISTS` no añade columnas a una tabla que ya está
 * creada, así que una base anterior al panel de administración se quedaría
 * sin `rol`. Se comprueba con PRAGMA y se añade si falta: es idempotente,
 * así que correrlo en cada arranque no cuesta nada y nunca duplica.
 */
function migrar(bd: DatabaseSync) {
  const columnas = bd.prepare("PRAGMA table_info(usuarios)").all() as { name: string }[];
  if (!columnas.some((c) => c.name === "rol")) {
    bd.exec("ALTER TABLE usuarios ADD COLUMN rol TEXT NOT NULL DEFAULT 'usuario'");
  }
}

/**
 * Conexión única del proceso. La exporta `admin-sqlite.ts`, que comparte
 * este mismo singleton en vez de abrir un segundo descriptor sobre el
 * mismo archivo: dos conexiones con WAL sobre la misma base compiten por
 * el bloqueo de escritura sin ninguna necesidad.
 */
export function conexion(): DatabaseSync {
  if (db) return db;
  mkdirSync(dirname(RUTA), { recursive: true });
  db = new DatabaseSync(RUTA);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      hash TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'semilla',
      rol TEXT NOT NULL DEFAULT 'usuario',
      creditos INTEGER NOT NULL DEFAULT 0,
      renueva_en TEXT NOT NULL,
      creado_en TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS campanas (
      id TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      nombre TEXT NOT NULL,
      producto TEXT NOT NULL,
      paleta TEXT NOT NULL,
      prompts TEXT NOT NULL,
      secciones_fallidas TEXT NOT NULL DEFAULT '[]',
      estado TEXT NOT NULL,
      creada_en TEXT NOT NULL,
      actualizada_en TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_campanas_usuario ON campanas(usuario_id, actualizada_en DESC);

    CREATE TABLE IF NOT EXISTS movimientos (
      id TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      campana_id TEXT,
      campana_nombre TEXT NOT NULL,
      delta INTEGER NOT NULL,
      motivo TEXT NOT NULL,
      fecha TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_movimientos_usuario ON movimientos(usuario_id, fecha DESC);

    CREATE TABLE IF NOT EXISTS auditoria (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      actor_email TEXT NOT NULL,
      accion TEXT NOT NULL,
      objetivo_tipo TEXT NOT NULL,
      objetivo_id TEXT NOT NULL,
      objetivo_etiqueta TEXT NOT NULL,
      detalle TEXT NOT NULL DEFAULT '{}',
      ip TEXT NOT NULL DEFAULT 'desconocida',
      fecha TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha DESC);
    CREATE INDEX IF NOT EXISTS idx_auditoria_actor ON auditoria(actor_id, fecha DESC);
  `);
  migrar(db);
  return db;
}

export type FilaUsuario = {
  id: string;
  email: string;
  hash: string;
  plan: string;
  rol: string;
  creditos: number;
  renueva_en: string;
  creado_en: string;
};

export type FilaCampana = {
  id: string;
  usuario_id: string;
  nombre: string;
  producto: string;
  paleta: string;
  prompts: string;
  secciones_fallidas: string;
  estado: string;
  creada_en: string;
  actualizada_en: string;
};

export function aUsuario(f: FilaUsuario): Usuario {
  return {
    id: f.id,
    email: f.email,
    plan: f.plan as Plan,
    rol: f.rol as Rol,
    creditosDisponibles: f.creditos,
    renuevaEn: f.renueva_en,
    creadoEn: f.creado_en,
  };
}

/** Mapeo de fila a dominio. Lo reutiliza `admin-sqlite.ts`: una sola copia. */
export function aCampana(f: FilaCampana): Campana {
  return {
    id: f.id,
    usuarioId: f.usuario_id,
    nombre: f.nombre,
    producto: productoGuardado(JSON.parse(f.producto)),
    paleta: JSON.parse(f.paleta),
    prompts: JSON.parse(f.prompts),
    seccionesFallidas: JSON.parse(f.secciones_fallidas),
    estado: f.estado as Campana["estado"],
    creadaEn: f.creada_en,
    actualizadaEn: f.actualizada_en,
  };
}

function enUnMes(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export class RepositorioSQLite implements Repositorio {
  /* ---------------- Usuarios ---------------- */

  async crearUsuario(email: string, hash: string): Promise<Usuario> {
    const bd = conexion();
    const usuario: FilaUsuario = {
      id: id("usr"),
      email: email.toLowerCase(),
      hash,
      plan: "semilla",
      rol: "usuario",
      creditos: CREDITOS_BIENVENIDA,
      renueva_en: enUnMes(),
      creado_en: new Date().toISOString(),
    };

    bd.exec("BEGIN");
    try {
      bd.prepare(
        `INSERT INTO usuarios (id, email, hash, plan, rol, creditos, renueva_en, creado_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        usuario.id,
        usuario.email,
        usuario.hash,
        usuario.plan,
        usuario.rol,
        usuario.creditos,
        usuario.renueva_en,
        usuario.creado_en,
      );
      this.anotar(usuario.id, null, "Registro", CREDITOS_BIENVENIDA, "bienvenida");
      bd.exec("COMMIT");
    } catch (e) {
      bd.exec("ROLLBACK");
      throw e;
    }

    return aUsuario(usuario);
  }

  async usuarioPorEmail(email: string) {
    const f = conexion()
      .prepare("SELECT * FROM usuarios WHERE email = ?")
      .get(email.toLowerCase()) as FilaUsuario | undefined;
    return f ? { ...aUsuario(f), hash: f.hash } : null;
  }

  async usuarioPorId(idUsuario: string) {
    const f = conexion()
      .prepare("SELECT * FROM usuarios WHERE id = ?")
      .get(idUsuario) as FilaUsuario | undefined;
    return f ? aUsuario(f) : null;
  }

  async cambiarPlan(usuarioId: string, nuevo: Plan): Promise<Usuario> {
    const bd = conexion();
    const def = definicionPlan(nuevo);
    bd.exec("BEGIN");
    try {
      bd.prepare("UPDATE usuarios SET plan = ?, creditos = ?, renueva_en = ? WHERE id = ?").run(
        nuevo,
        def.creditosMes,
        enUnMes(),
        usuarioId,
      );
      this.anotar(usuarioId, null, `Plan ${def.nombre}`, def.creditosMes, "recarga-plan");
      bd.exec("COMMIT");
    } catch (e) {
      bd.exec("ROLLBACK");
      throw e;
    }
    const u = await this.usuarioPorId(usuarioId);
    if (!u) throw new Error("Usuario no encontrado tras el cambio de plan");
    return u;
  }

  /* ---------------- Créditos ---------------- */

  private anotar(
    usuarioId: string,
    campanaId: string | null,
    campanaNombre: string,
    delta: number,
    motivo: MovimientoCredito["motivo"],
  ) {
    conexion()
      .prepare(
        `INSERT INTO movimientos (id, usuario_id, campana_id, campana_nombre, delta, motivo, fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id("mov"), usuarioId, campanaId, campanaNombre, delta, motivo, new Date().toISOString());
  }

  /**
   * Descuento transaccional. El UPDATE lleva la condición `creditos >= ?` en
   * el propio WHERE: si dos peticiones llegan a la vez, solo una puede pasar.
   * Comprobar antes y actualizar después dejaría la puerta abierta.
   */
  async descontarCreditos(
    usuarioId: string,
    cantidad: number,
    campanaId: string | null,
    campanaNombre: string,
  ): Promise<Usuario> {
    const bd = conexion();
    bd.exec("BEGIN IMMEDIATE");
    try {
      /* El plan por uso no lleva la condición de saldo: pasadas las incluidas
         sigue trabajando y el excedente se factura. Su
         saldo baja a negativo y ese negativo ES lo consumido en el ciclo, que
         es lo que se factura. Dejar aquí el `creditos >= ?` convertiría «sin
         límite» en un tope disfrazado. */
      const fila = bd.prepare("SELECT plan FROM usuarios WHERE id = ?").get(usuarioId) as
        | { plan: string }
        | undefined;
      const porUso = fila ? esPorUso(fila.plan as Plan) : false;
      const r = porUso
        ? bd
            .prepare("UPDATE usuarios SET creditos = creditos - ? WHERE id = ?")
            .run(cantidad, usuarioId)
        : bd
            .prepare("UPDATE usuarios SET creditos = creditos - ? WHERE id = ? AND creditos >= ?")
            .run(cantidad, usuarioId, cantidad);
      if (r.changes === 0) {
        bd.exec("ROLLBACK");
        throw new Error("CREDITOS_INSUFICIENTES");
      }
      this.anotar(usuarioId, campanaId, campanaNombre, -cantidad, "generacion");
      bd.exec("COMMIT");
    } catch (e) {
      try {
        bd.exec("ROLLBACK");
      } catch {
        /* la transacción ya se cerró */
      }
      throw e;
    }
    const u = await this.usuarioPorId(usuarioId);
    if (!u) throw new Error("Usuario no encontrado");
    return u;
  }

  async devolverCreditos(
    usuarioId: string,
    cantidad: number,
    campanaId: string | null,
    campanaNombre: string,
  ): Promise<Usuario> {
    const bd = conexion();
    bd.exec("BEGIN IMMEDIATE");
    try {
      bd.prepare("UPDATE usuarios SET creditos = creditos + ? WHERE id = ?").run(
        cantidad,
        usuarioId,
      );
      this.anotar(usuarioId, campanaId, campanaNombre, cantidad, "devolucion");
      bd.exec("COMMIT");
    } catch (e) {
      bd.exec("ROLLBACK");
      throw e;
    }
    const u = await this.usuarioPorId(usuarioId);
    if (!u) throw new Error("Usuario no encontrado");
    return u;
  }

  async movimientos(usuarioId: string, limite = 30): Promise<MovimientoCredito[]> {
    const filas = conexion()
      .prepare("SELECT * FROM movimientos WHERE usuario_id = ? ORDER BY fecha DESC LIMIT ?")
      .all(usuarioId, limite) as {
      id: string;
      usuario_id: string;
      campana_id: string | null;
      campana_nombre: string;
      delta: number;
      motivo: string;
      fecha: string;
    }[];
    return filas.map((f) => ({
      id: f.id,
      usuarioId: f.usuario_id,
      campanaId: f.campana_id,
      campanaNombre: f.campana_nombre,
      delta: f.delta,
      motivo: f.motivo as MovimientoCredito["motivo"],
      fecha: f.fecha,
    }));
  }

  /* ---------------- Campañas ---------------- */

  async crearCampana(c: Campana): Promise<Campana> {
    conexion()
      .prepare(
        `INSERT INTO campanas
           (id, usuario_id, nombre, producto, paleta, prompts, secciones_fallidas, estado, creada_en, actualizada_en)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        c.id,
        c.usuarioId,
        c.nombre,
        JSON.stringify(c.producto),
        JSON.stringify(c.paleta),
        JSON.stringify(c.prompts),
        JSON.stringify(c.seccionesFallidas),
        c.estado,
        c.creadaEn,
        c.actualizadaEn,
      );
    return c;
  }

  async campanasDe(usuarioId: string): Promise<Campana[]> {
    const filas = conexion()
      .prepare("SELECT * FROM campanas WHERE usuario_id = ? ORDER BY actualizada_en DESC")
      .all(usuarioId) as FilaCampana[];
    return filas.map(aCampana);
  }

  /** Siempre filtra por usuario: nadie lee la campaña de otro por adivinar el id. */
  async campana(idCampana: string, usuarioId: string): Promise<Campana | null> {
    const f = conexion()
      .prepare("SELECT * FROM campanas WHERE id = ? AND usuario_id = ?")
      .get(idCampana, usuarioId) as FilaCampana | undefined;
    return f ? aCampana(f) : null;
  }

  async actualizarCampana(
    idCampana: string,
    usuarioId: string,
    cambios: Partial<Pick<Campana, "nombre" | "prompts" | "estado" | "paleta" | "seccionesFallidas">>,
  ): Promise<Campana | null> {
    const actual = await this.campana(idCampana, usuarioId);
    if (!actual) return null;
    const siguiente: Campana = {
      ...actual,
      ...cambios,
      actualizadaEn: new Date().toISOString(),
    };
    conexion()
      .prepare(
        `UPDATE campanas
            SET nombre = ?, paleta = ?, prompts = ?, secciones_fallidas = ?, estado = ?, actualizada_en = ?
          WHERE id = ? AND usuario_id = ?`,
      )
      .run(
        siguiente.nombre,
        JSON.stringify(siguiente.paleta),
        JSON.stringify(siguiente.prompts),
        JSON.stringify(siguiente.seccionesFallidas),
        siguiente.estado,
        siguiente.actualizadaEn,
        idCampana,
        usuarioId,
      );
    return siguiente;
  }

  async reemplazarPrompt(
    idCampana: string,
    usuarioId: string,
    prompt: Prompt,
  ): Promise<Campana | null> {
    const actual = await this.campana(idCampana, usuarioId);
    if (!actual) return null;
    const existe = actual.prompts.some((p) => p.tipologia === prompt.tipologia);
    const prompts = existe
      ? actual.prompts.map((p) => (p.tipologia === prompt.tipologia ? prompt : p))
      : [...actual.prompts, prompt];
    return this.actualizarCampana(idCampana, usuarioId, {
      prompts,
      seccionesFallidas: actual.seccionesFallidas.filter((s) => s !== prompt.tipologia),
    });
  }

  async borrarCampana(idCampana: string, usuarioId: string): Promise<boolean> {
    const r = conexion()
      .prepare("DELETE FROM campanas WHERE id = ? AND usuario_id = ?")
      .run(idCampana, usuarioId);
    return r.changes > 0;
  }

  async duplicarCampana(idCampana: string, usuarioId: string): Promise<Campana | null> {
    const original = await this.campana(idCampana, usuarioId);
    if (!original) return null;
    const ahora = new Date().toISOString();
    return this.crearCampana({
      ...original,
      id: id("cmp"),
      nombre: `${original.nombre} (copia)`,
      creadaEn: ahora,
      actualizadaEn: ahora,
    });
  }
}

let repo: Repositorio | null = null;

/** Punto de inyección de la persistencia. */
export function repositorio(): Repositorio {
  repo ??= new RepositorioSQLite();
  return repo;
}
