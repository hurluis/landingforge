import "server-only";

import type {
  Campana,
  MovimientoCredito,
  Plan,
  Prompt,
  Rol,
  Usuario,
} from "@/lib/datos/tipos";
import type { Repositorio } from "@/lib/datos/repositorio";
import { cifra, ejecutar, fila, filas, enTransaccion } from "@/lib/datos/conexion-pg";
import { CREDITOS_BIENVENIDA, esPorUso, plan as definicionPlan } from "@/lib/planes";
import { id } from "@/lib/utils";
import { productoGuardado } from "@/lib/datos/producto";

/**
 * Implementación PostgreSQL de `Repositorio`.
 *
 * Es un port literal de `sqlite.ts`: mismas garantías, mismo orden de
 * operaciones, mismos mensajes de error. Lo único que cambia es el dialecto.
 *
 * Las tres diferencias que hay que tener presentes al leerlo:
 *
 * 1. **Los parámetros son `$1`, no `?`**, y van posicionales.
 * 2. **`jsonb` vuelve ya deserializado.** Los mapeadores de aquí no hacen
 *    `JSON.parse` —los de `sqlite.ts` sí, porque allí la columna es `text`—.
 *    Al escribir se pasa `JSON.stringify`, que es lo que `pg` espera para un
 *    parámetro `jsonb`.
 * 3. **Las transacciones reservan una conexión.** Ver `enTransaccion` en
 *    `conexion-pg.ts`: con un pool, `BEGIN` suelto no encierra nada.
 */

export type FilaUsuarioPG = {
  id: string;
  email: string;
  hash: string;
  plan: string;
  rol: string;
  creditos: number;
  renueva_en: string;
  creado_en: string;
};

export type FilaCampanaPG = {
  id: string;
  usuario_id: string;
  nombre: string;
  producto: Campana["producto"];
  paleta: Campana["paleta"];
  prompts: Prompt[];
  secciones_fallidas: Campana["seccionesFallidas"];
  estado: string;
  creada_en: string;
  actualizada_en: string;
};

export function aUsuarioPG(f: FilaUsuarioPG): Usuario {
  return {
    id: f.id,
    email: f.email,
    plan: f.plan as Plan,
    rol: f.rol as Rol,
    /* `integer` vuelve como number, pero COUNT y SUM vuelven como string
       porque son `bigint`/`numeric`. Aquí no aplica, y aun así se normaliza:
       cuesta nada y evita un `"5" - 1` en el futuro. */
    creditosDisponibles: Number(f.creditos),
    renuevaEn: f.renueva_en,
    creadoEn: f.creado_en,
  };
}

/** Mapeo de fila a dominio. Lo reutiliza `admin-postgres.ts`. */
export function aCampanaPG(f: FilaCampanaPG): Campana {
  return {
    id: f.id,
    usuarioId: f.usuario_id,
    nombre: f.nombre,
    producto: productoGuardado(f.producto),
    paleta: f.paleta,
    prompts: f.prompts,
    seccionesFallidas: f.secciones_fallidas,
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

export class RepositorioPostgres implements Repositorio {
  /* ---------------- Usuarios ---------------- */

  async crearUsuario(email: string, hash: string): Promise<Usuario> {
    const usuario: FilaUsuarioPG = {
      id: id("usr"),
      email: email.toLowerCase(),
      hash,
      plan: "semilla",
      rol: "usuario",
      creditos: CREDITOS_BIENVENIDA,
      renueva_en: enUnMes(),
      creado_en: new Date().toISOString(),
    };

    /* El alta y su movimiento de bienvenida van juntos o no van: un usuario
       con créditos y sin la línea que los explica es un agujero en el
       historial que el propio cliente puede ver. */
    await enTransaccion(async (c) => {
      await c.query(
        `INSERT INTO usuarios (id, email, hash, plan, rol, creditos, renueva_en, creado_en)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          usuario.id,
          usuario.email,
          usuario.hash,
          usuario.plan,
          usuario.rol,
          usuario.creditos,
          usuario.renueva_en,
          usuario.creado_en,
        ],
      );
      await c.query(
        `INSERT INTO movimientos (id, usuario_id, campana_id, campana_nombre, delta, motivo, fecha)
         VALUES ($1, $2, NULL, 'Registro', $3, 'bienvenida', $4)`,
        [id("mov"), usuario.id, CREDITOS_BIENVENIDA, new Date().toISOString()],
      );
    });

    return aUsuarioPG(usuario);
  }

  async usuarioPorEmail(email: string) {
    const f = await fila<FilaUsuarioPG>("SELECT * FROM usuarios WHERE email = $1", [
      email.toLowerCase(),
    ]);
    return f ? { ...aUsuarioPG(f), hash: f.hash } : null;
  }

  async usuarioPorId(idUsuario: string) {
    const f = await fila<FilaUsuarioPG>("SELECT * FROM usuarios WHERE id = $1", [idUsuario]);
    return f ? aUsuarioPG(f) : null;
  }

  async cambiarPlan(usuarioId: string, nuevo: Plan): Promise<Usuario> {
    const def = definicionPlan(nuevo);
    await enTransaccion(async (c) => {
      await c.query("UPDATE usuarios SET plan = $1, creditos = $2, renueva_en = $3 WHERE id = $4", [
        nuevo,
        def.creditosMes,
        enUnMes(),
        usuarioId,
      ]);
      await c.query(
        `INSERT INTO movimientos (id, usuario_id, campana_id, campana_nombre, delta, motivo, fecha)
         VALUES ($1, $2, NULL, $3, $4, 'recarga-plan', $5)`,
        [id("mov"), usuarioId, `Plan ${def.nombre}`, def.creditosMes, new Date().toISOString()],
      );
    });
    const u = await this.usuarioPorId(usuarioId);
    if (!u) throw new Error("Usuario no encontrado tras el cambio de plan");
    return u;
  }

  /* ---------------- Créditos ---------------- */

  /**
   * Descuento transaccional. La condición `creditos >= $3` va en el propio
   * WHERE: si dos peticiones llegan a la vez, solo una encuentra saldo. En
   * Postgres la segunda además queda bloqueada hasta que la primera confirma,
   * así que lee el saldo ya descontado y no puede colarse.
   */
  async descontarCreditos(
    usuarioId: string,
    cantidad: number,
    campanaId: string | null,
    campanaNombre: string,
  ): Promise<Usuario> {
    await enTransaccion(async (c) => {
      /* El plan por uso no tiene tope: su saldo baja a negativo y ese
         negativo es lo que se factura al cierre del ciclo. El `FOR UPDATE`
         bloquea la fila, así que dos generaciones a la vez siguen contando
         las dos. */
      const actual = await c.query("SELECT plan FROM usuarios WHERE id = $1 FOR UPDATE", [usuarioId]);
      const porUso = actual.rows[0] ? esPorUso(actual.rows[0].plan as Plan) : false;
      const r = porUso
        ? await c.query("UPDATE usuarios SET creditos = creditos - $1 WHERE id = $2", [
            cantidad,
            usuarioId,
          ])
        : await c.query(
            "UPDATE usuarios SET creditos = creditos - $1 WHERE id = $2 AND creditos >= $3",
            [cantidad, usuarioId, cantidad],
          );
      if ((r.rowCount ?? 0) === 0) throw new Error("CREDITOS_INSUFICIENTES");
      await c.query(
        `INSERT INTO movimientos (id, usuario_id, campana_id, campana_nombre, delta, motivo, fecha)
         VALUES ($1, $2, $3, $4, $5, 'generacion', $6)`,
        [id("mov"), usuarioId, campanaId, campanaNombre, -cantidad, new Date().toISOString()],
      );
    });
    const u = await this.usuarioPorId(usuarioId);
    if (!u) throw new Error("Usuario no encontrado");
    return u;
  }

  async movimientos(usuarioId: string, limite = 30): Promise<MovimientoCredito[]> {
    const fs = await filas<{
      id: string;
      usuario_id: string;
      campana_id: string | null;
      campana_nombre: string;
      delta: number;
      motivo: string;
      fecha: string;
    }>("SELECT * FROM movimientos WHERE usuario_id = $1 ORDER BY fecha DESC LIMIT $2", [
      usuarioId,
      limite,
    ]);
    return fs.map((f) => ({
      id: f.id,
      usuarioId: f.usuario_id,
      campanaId: f.campana_id,
      campanaNombre: f.campana_nombre,
      delta: Number(f.delta),
      motivo: f.motivo as MovimientoCredito["motivo"],
      fecha: f.fecha,
    }));
  }

  /* ---------------- Campañas ---------------- */

  async crearCampana(c: Campana): Promise<Campana> {
    await ejecutar(
      `INSERT INTO campanas
         (id, usuario_id, nombre, producto, paleta, prompts, secciones_fallidas, estado, creada_en, actualizada_en)
       VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::jsonb, $8, $9, $10)`,
      [
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
      ],
    );
    return c;
  }

  async campanasDe(usuarioId: string): Promise<Campana[]> {
    const fs = await filas<FilaCampanaPG>(
      "SELECT * FROM campanas WHERE usuario_id = $1 ORDER BY actualizada_en DESC",
      [usuarioId],
    );
    return fs.map(aCampanaPG);
  }

  /** Siempre filtra por usuario: nadie lee la campaña de otro por adivinar el id. */
  async campana(idCampana: string, usuarioId: string): Promise<Campana | null> {
    const f = await fila<FilaCampanaPG>(
      "SELECT * FROM campanas WHERE id = $1 AND usuario_id = $2",
      [idCampana, usuarioId],
    );
    return f ? aCampanaPG(f) : null;
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
    await ejecutar(
      `UPDATE campanas
          SET nombre = $1, paleta = $2::jsonb, prompts = $3::jsonb,
              secciones_fallidas = $4::jsonb, estado = $5, actualizada_en = $6
        WHERE id = $7 AND usuario_id = $8`,
      [
        siguiente.nombre,
        JSON.stringify(siguiente.paleta),
        JSON.stringify(siguiente.prompts),
        JSON.stringify(siguiente.seccionesFallidas),
        siguiente.estado,
        siguiente.actualizadaEn,
        idCampana,
        usuarioId,
      ],
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
    const n = await ejecutar("DELETE FROM campanas WHERE id = $1 AND usuario_id = $2", [
      idCampana,
      usuarioId,
    ]);
    return n > 0;
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

/** Tamaño de la base, para la pantalla de salud del panel. */
export async function bytesBaseDatos(): Promise<number> {
  try {
    return await cifra("SELECT pg_database_size(current_database()) AS n");
  } catch {
    return 0;
  }
}
