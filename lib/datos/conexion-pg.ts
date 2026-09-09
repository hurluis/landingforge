import "server-only";

import { Pool, type PoolClient, type QueryResultRow } from "pg";

/**
 * Conexión a PostgreSQL.
 *
 * El proyecto sigue arrancando con SQLite y un archivo, que es lo que permite
 * clonar y correr sin instalar nada. Postgres se activa solo cuando
 * `DATABASE_URL` es una URL de conexión; el selector vive en
 * `lib/datos/index.ts`.
 *
 * ── Decisiones del port, y por qué ──────────────────────────────────────
 *
 * **Las fechas siguen siendo `text` con ISO-8601, no `timestamptz`.**
 * Tentador cambiarlas, pero el dominio (`lib/datos/tipos.ts`) define
 * `creadoEn: string` y toda la aplicación compara y ordena esas cadenas. El
 * ISO-8601 en UTC ordena lexicográficamente igual que cronológicamente, así
 * que `ORDER BY fecha DESC` y `WHERE creado_en >= $1` se comportan idéntico a
 * SQLite. Con `timestamptz`, `pg` devolvería objetos `Date` y habría que
 * convertir en cada mapeador: más superficie para que una zona horaria mueva
 * un registro de día en las gráficas. Fidelidad por encima de purismo.
 *
 * **Los JSON sí pasan a `jsonb`.**
 * Ahí el cambio sí gana: el panel de administración consulta dentro de los
 * prompts (por tipología, por severidad de advertencia) y con `jsonb` eso es
 * SQL nativo e indexable, mientras que en `text` habría que traer las filas y
 * filtrarlas en memoria —que es justo lo que `admin-sqlite.ts` evita con
 * JSON1—. `pg` ya devuelve `jsonb` como objeto JavaScript, así que los
 * mapeadores de este lado NO hacen `JSON.parse`: esa es la única diferencia
 * real respecto de los de `sqlite.ts`.
 *
 * **El pool vive en `globalThis`.**
 * En desarrollo Next recarga los módulos en caliente en cada cambio. Sin esto,
 * cada recarga abriría un pool nuevo y Postgres acabaría rechazando
 * conexiones por `too many clients`.
 */

const global_ = globalThis as unknown as {
  __lfPool?: Pool;
  __lfEsquema?: Promise<void>;
};

export function pool(): Pool {
  global_.__lfPool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    /* Postgres.app en local no pide TLS. Si la URL apunta a un servicio
       gestionado, se activa: casi todos lo exigen y presentan certificado
       propio. */
    ssl: /\bsslmode=require\b/.test(process.env.DATABASE_URL ?? "")
      ? { rejectUnauthorized: false }
      : undefined,
    max: 10,
    idleTimeoutMillis: 30_000,
  });
  return global_.__lfPool;
}

/* ================================================================
   Esquema
   ================================================================ */

const ESQUEMA = `
  CREATE TABLE IF NOT EXISTS usuarios (
    id          text PRIMARY KEY,
    email       text NOT NULL UNIQUE,
    hash        text NOT NULL,
    plan        text NOT NULL DEFAULT 'semilla',
    rol         text NOT NULL DEFAULT 'usuario',
    creditos    integer NOT NULL DEFAULT 0,
    renueva_en  text NOT NULL,
    creado_en   text NOT NULL
  );

  CREATE TABLE IF NOT EXISTS campanas (
    id                 text PRIMARY KEY,
    usuario_id         text NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nombre             text NOT NULL,
    producto           jsonb NOT NULL,
    paleta             jsonb NOT NULL,
    prompts            jsonb NOT NULL,
    secciones_fallidas jsonb NOT NULL DEFAULT '[]'::jsonb,
    estado             text NOT NULL,
    creada_en          text NOT NULL,
    actualizada_en     text NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_campanas_usuario
    ON campanas (usuario_id, actualizada_en DESC);

  /* GIN sobre los prompts: es lo que hace que filtrar por tipología o por
     severidad de advertencia sea una consulta y no un recorrido. */
  CREATE INDEX IF NOT EXISTS idx_campanas_prompts
    ON campanas USING gin (prompts jsonb_path_ops);

  CREATE TABLE IF NOT EXISTS movimientos (
    id             text PRIMARY KEY,
    usuario_id     text NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    campana_id     text,
    campana_nombre text NOT NULL,
    delta          integer NOT NULL,
    motivo         text NOT NULL,
    fecha          text NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_movimientos_usuario
    ON movimientos (usuario_id, fecha DESC);

  /* La auditoría NO lleva clave foránea sobre actor_id, igual que en SQLite:
     el registro de lo que hizo alguien tiene que sobrevivir al borrado de su
     propia cuenta. */
  CREATE TABLE IF NOT EXISTS auditoria (
    id                text PRIMARY KEY,
    actor_id          text,
    actor_email       text NOT NULL,
    accion            text NOT NULL,
    objetivo_tipo     text NOT NULL,
    objetivo_id       text NOT NULL,
    objetivo_etiqueta text NOT NULL,
    detalle           jsonb NOT NULL DEFAULT '{}'::jsonb,
    ip                text NOT NULL DEFAULT 'desconocida',
    fecha             text NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria (fecha DESC);
  CREATE INDEX IF NOT EXISTS idx_auditoria_actor ON auditoria (actor_id, fecha DESC);
`;

/**
 * Crea el esquema una sola vez por proceso.
 *
 * La promesa se guarda, no el booleano: si dos peticiones entran a la vez en
 * el arranque en frío, las dos esperan al mismo `CREATE TABLE` en lugar de
 * lanzar dos. Todo es `IF NOT EXISTS`, así que correrlo de más no rompe nada,
 * pero no hace falta correrlo de más.
 */
export function esquemaListo(): Promise<void> {
  global_.__lfEsquema ??= pool()
    .query(ESQUEMA)
    .then(() => undefined)
    .catch((e) => {
      /* Si falla, se olvida: así el siguiente intento vuelve a probar en vez
         de quedarse con una promesa rechazada para siempre. */
      global_.__lfEsquema = undefined;
      throw e;
    });
  return global_.__lfEsquema;
}

/* ================================================================
   Atajos de consulta
   ================================================================ */

/** Todas las filas. Espera al esquema antes de la primera consulta. */
export async function filas<T extends QueryResultRow>(
  sql: string,
  args: unknown[] = [],
): Promise<T[]> {
  await esquemaListo();
  const r = await pool().query<T>(sql, args);
  return r.rows;
}

/** La primera fila, o `null`. */
export async function fila<T extends QueryResultRow>(
  sql: string,
  args: unknown[] = [],
): Promise<T | null> {
  const r = await filas<T>(sql, args);
  return r[0] ?? null;
}

/** Cuántas filas tocó. Es el equivalente de `changes` en SQLite. */
export async function ejecutar(sql: string, args: unknown[] = []): Promise<number> {
  await esquemaListo();
  const r = await pool().query(sql, args);
  return r.rowCount ?? 0;
}

/** Una sola cifra: `SELECT COUNT(*) AS n ...` */
export async function cifra(sql: string, args: unknown[] = []): Promise<number> {
  const f = await fila<{ n: string | number }>(sql, args);
  return Number(f?.n ?? 0);
}

/**
 * Transacción sobre UNA conexión reservada del pool.
 *
 * Es la diferencia que más importa respecto de SQLite. `pool.query()` toma
 * una conexión distinta cada vez, así que un `BEGIN` por ahí abriría la
 * transacción en una conexión y el `UPDATE` correría en otra, fuera de ella.
 * Hay que reservar el cliente y devolverlo pase lo que pase.
 */
export async function enTransaccion<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  await esquemaListo();
  const cliente = await pool().connect();
  try {
    await cliente.query("BEGIN");
    const salida = await fn(cliente);
    await cliente.query("COMMIT");
    return salida;
  } catch (e) {
    try {
      await cliente.query("ROLLBACK");
    } catch {
      /* La conexión ya se perdió; el pool la descarta al soltarla. */
    }
    throw e;
  } finally {
    cliente.release();
  }
}
