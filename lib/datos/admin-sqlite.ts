import "server-only";

import { statSync } from "node:fs";
import { join } from "node:path";
import type {
  Advertencia,
  CalidadMetodologia,
  CalidadRegla,
  Campana,
  CampanaConDueno,
  EstadoCampana,
  EventoAuditoria,
  MovimientoCredito,
  Pagina,
  Plan,
  Prompt,
  PuntoSerie,
  ReglaAdvertencia,
  ResumenPlataforma,
  Rol,
  SaludSistema,
  Usuario,
  UsuarioConMetricas,
} from "@/lib/datos/tipos";
import type {
  EntradaAuditoria,
  FichaUsuario,
  FiltroAuditoria,
  FiltroCampanas,
  FiltroUsuarios,
  RepositorioAdmin,
} from "@/lib/datos/admin";
import {
  aCampana,
  aUsuario,
  conexion,
  type FilaCampana,
  type FilaUsuario,
} from "@/lib/datos/sqlite";
import { generacionDeImagenesActiva, hayModeloReal } from "@/lib/ia";
import { id } from "@/lib/utils";

/**
 * Implementación SQLite del repositorio de administración.
 *
 * Comparte la conexión de `sqlite.ts`, así que el esquema y las migraciones
 * siguen viviendo en un único archivo, y reutiliza sus mapeadores de fila a
 * dominio en vez de mantener una segunda copia que se desincronice.
 *
 * Dos criterios recorren todo el archivo:
 *
 * 1. **Los filtros se aplican en SQL, nunca en JavaScript después de paginar.**
 *    Filtrar la página ya recortada daría un total equivocado y un paginador
 *    que miente sobre cuántos resultados hay.
 * 2. **Las agregaciones sobre prompts usan JSON1.** Los prompts viven en una
 *    columna JSON, y `json_each` permite consultarlos dentro de SQL sin
 *    desnormalizar la tabla, que es la decisión que `sqlite.ts` ya tomó y
 *    documentó.
 */

const POR_PAGINA = 25;
const DIAS_SERIE = 30;

const ESTADOS: EstadoCampana[] = ["borrador", "generando", "lista", "error"];
const PLANES_IDS: Plan[] = ["semilla", "estudio", "agencia", "fundicion"];

/** Las seis reglas del validador, en el orden en que se presentan. */
const REGLAS: ReglaAdvertencia[] = [
  "sin-bloque-paleta",
  "sin-bloque-iluminacion",
  "limite-25-caracteres",
  "palabra-prohibida",
  "longitud",
  "estilo-keywords",
];

function haceDias(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
}

function soloFecha(iso: string): string {
  return iso.slice(0, 10);
}

/**
 * Rellena con ceros los días sin datos. Sin esto la gráfica saltaría de un
 * día al siguiente con actividad y exageraría la tendencia.
 */
function serieCompleta(filas: { dia: string; n: number }[], dias: number): PuntoSerie[] {
  const porDia = new Map(filas.map((f) => [f.dia, f.n]));
  const salida: PuntoSerie[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const clave = soloFecha(d.toISOString());
    salida.push({ fecha: clave, valor: porDia.get(clave) ?? 0 });
  }
  return salida;
}

function paginaSegura(filtro: { pagina?: number; porPagina?: number }) {
  const porPagina = Math.min(100, Math.max(5, Math.trunc(filtro.porPagina ?? POR_PAGINA)));
  const pagina = Math.max(1, Math.trunc(filtro.pagina ?? 1));
  return { pagina, porPagina, salto: (pagina - 1) * porPagina };
}

/**
 * Patrón para LIKE con los comodines del usuario neutralizados. Sin esto,
 * buscar «%» listaría a todo el mundo. Las consultas que lo usan declaran
 * ESCAPE para que la barra invertida sea el carácter de escape.
 */
function comoLike(busqueda: string): string {
  return `%${busqueda.trim().toLowerCase().replace(/[%_\\]/g, "\\$&")}%`;
}

type FilaAuditoria = {
  id: string;
  actor_id: string | null;
  actor_email: string;
  accion: string;
  objetivo_tipo: string;
  objetivo_id: string;
  objetivo_etiqueta: string;
  detalle: string;
  ip: string;
  fecha: string;
};

function aEvento(f: FilaAuditoria): EventoAuditoria {
  return {
    id: f.id,
    actorId: f.actor_id,
    actorEmail: f.actor_email,
    accion: f.accion as EventoAuditoria["accion"],
    objetivoTipo: f.objetivo_tipo as EventoAuditoria["objetivoTipo"],
    objetivoId: f.objetivo_id,
    objetivoEtiqueta: f.objetivo_etiqueta,
    detalle: JSON.parse(f.detalle) as Record<string, unknown>,
    ip: f.ip,
    fecha: f.fecha,
  };
}

type FilaMovimiento = {
  id: string;
  usuario_id: string;
  campana_id: string | null;
  campana_nombre: string;
  delta: number;
  motivo: string;
  fecha: string;
};

function aMovimiento(f: FilaMovimiento): MovimientoCredito {
  return {
    id: f.id,
    usuarioId: f.usuario_id,
    campanaId: f.campana_id,
    campanaNombre: f.campana_nombre,
    delta: f.delta,
    motivo: f.motivo as MovimientoCredito["motivo"],
    fecha: f.fecha,
  };
}

/** Fila de usuario con las cifras que añaden las subconsultas correlacionadas. */
type FilaUsuarioMetricas = FilaUsuario & {
  n_campanas: number;
  n_prompts: number;
  consumidos: number;
  ultima: string | null;
};

function aUsuarioConMetricas(f: FilaUsuarioMetricas): UsuarioConMetricas {
  return {
    ...aUsuario(f),
    campanas: f.n_campanas,
    prompts: f.n_prompts,
    creditosConsumidos: f.consumidos,
    ultimaActividad: f.ultima,
  };
}

/* Las cifras por usuario se calculan con subconsultas correlacionadas en vez
   de con tres JOIN y un GROUP BY: a esta escala rinden igual y la consulta se
   lee de arriba abajo sin tener que sostener el agrupamiento en la cabeza. */
const COLUMNAS_METRICAS = `
  u.*,
  (SELECT COUNT(*) FROM campanas c WHERE c.usuario_id = u.id) AS n_campanas,
  (SELECT COALESCE(SUM(json_array_length(c.prompts)), 0)
     FROM campanas c WHERE c.usuario_id = u.id) AS n_prompts,
  (SELECT COALESCE(SUM(CASE WHEN m.delta < 0 THEN -m.delta ELSE 0 END), 0)
     FROM movimientos m WHERE m.usuario_id = u.id) AS consumidos,
  (SELECT MAX(c.actualizada_en) FROM campanas c WHERE c.usuario_id = u.id) AS ultima
`;

const ORDENES: Record<NonNullable<FiltroUsuarios["orden"]>, string> = {
  reciente: "u.creado_en DESC",
  antiguo: "u.creado_en ASC",
  creditos: "u.creditos DESC",
  campanas: "n_campanas DESC",
};

export class RepositorioAdminSQLite implements RepositorioAdmin {
  /* ===================== Tablero ===================== */

  async resumen(): Promise<ResumenPlataforma> {
    const bd = conexion();
    const desde = haceDias(DIAS_SERIE);

    const uno = (sql: string, ...args: unknown[]) =>
      (bd.prepare(sql).get(...(args as never[])) as { n: number }).n;

    const usuarios = uno("SELECT COUNT(*) AS n FROM usuarios");
    const usuariosNuevos30d = uno("SELECT COUNT(*) AS n FROM usuarios WHERE creado_en >= ?", desde);
    const admins = uno("SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'admin'");
    const campanas = uno("SELECT COUNT(*) AS n FROM campanas");
    const prompts = uno(
      "SELECT COALESCE(SUM(json_array_length(prompts)), 0) AS n FROM campanas",
    );

    const porEstado = bd
      .prepare("SELECT estado, COUNT(*) AS n FROM campanas GROUP BY estado")
      .all() as { estado: string; n: number }[];
    const campanasPorEstado = Object.fromEntries(
      ESTADOS.map((e) => [e, porEstado.find((f) => f.estado === e)?.n ?? 0]),
    ) as Record<EstadoCampana, number>;

    const porPlan = bd
      .prepare("SELECT plan, COUNT(*) AS n FROM usuarios GROUP BY plan")
      .all() as { plan: string; n: number }[];
    const usuariosPorPlan = Object.fromEntries(
      PLANES_IDS.map((p) => [p, porPlan.find((f) => f.plan === p)?.n ?? 0]),
    ) as Record<Plan, number>;

    const creditos = bd
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN delta < 0 THEN -delta ELSE 0 END), 0) AS consumidos,
           COALESCE(SUM(CASE WHEN motivo = 'devolucion' THEN delta ELSE 0 END), 0) AS devueltos
         FROM movimientos`,
      )
      .get() as { consumidos: number; devueltos: number };

    const altas = bd
      .prepare(
        `SELECT date(creado_en) AS dia, COUNT(*) AS n FROM usuarios
          WHERE creado_en >= ? GROUP BY dia`,
      )
      .all(desde) as { dia: string; n: number }[];

    const nuevas = bd
      .prepare(
        `SELECT date(creada_en) AS dia, COUNT(*) AS n FROM campanas
          WHERE creada_en >= ? GROUP BY dia`,
      )
      .all(desde) as { dia: string; n: number }[];

    return {
      usuarios,
      usuariosNuevos30d,
      admins,
      campanas,
      campanasPorEstado,
      prompts,
      creditosConsumidos: creditos.consumidos,
      creditosDevueltos: creditos.devueltos,
      usuariosPorPlan,
      altasPorDia: serieCompleta(altas, DIAS_SERIE),
      campanasPorDia: serieCompleta(nuevas, DIAS_SERIE),
    };
  }

  async salud(): Promise<SaludSistema> {
    const nombre = (process.env.DATABASE_URL ?? "landingforge.db").replace(/[^\w.-]/g, "");
    let bytes = 0;
    try {
      bytes = statSync(join(process.cwd(), "datos", nombre)).size;
    } catch {
      /* Todavía no hay archivo en disco. Cero es la respuesta correcta. */
    }
    return {
      modeloReal: hayModeloReal(),
      imagenesHabilitadas: generacionDeImagenesActiva(),
      nodo: process.version,
      entorno: process.env.NODE_ENV ?? "development",
      bytesBaseDatos: bytes,
      /* Declarado, no detectado: el rate limit vive en memoria del proceso, y
         eso deja de ser suficiente en cuanto haya más de una instancia. La
         pantalla lo dice en vez de dejar que se descubra en producción. */
      rateLimitDistribuido: false,
    };
  }

  /* ===================== Usuarios ===================== */

  async listarUsuarios(filtro: FiltroUsuarios): Promise<Pagina<UsuarioConMetricas>> {
    const bd = conexion();
    const { pagina, porPagina, salto } = paginaSegura(filtro);

    const donde: string[] = [];
    const args: unknown[] = [];
    if (filtro.busqueda?.trim()) {
      donde.push("u.email LIKE ? ESCAPE '\\'");
      args.push(comoLike(filtro.busqueda));
    }
    if (filtro.plan) {
      donde.push("u.plan = ?");
      args.push(filtro.plan);
    }
    if (filtro.rol) {
      donde.push("u.rol = ?");
      args.push(filtro.rol);
    }
    const clausula = donde.length > 0 ? `WHERE ${donde.join(" AND ")}` : "";

    const total = (
      bd.prepare(`SELECT COUNT(*) AS n FROM usuarios u ${clausula}`).get(...(args as never[])) as {
        n: number;
      }
    ).n;

    const filas = bd
      .prepare(
        `SELECT ${COLUMNAS_METRICAS}
           FROM usuarios u
           ${clausula}
          ORDER BY ${ORDENES[filtro.orden ?? "reciente"]}
          LIMIT ? OFFSET ?`,
      )
      .all(...([...args, porPagina, salto] as never[])) as FilaUsuarioMetricas[];

    return { filas: filas.map(aUsuarioConMetricas), total, pagina, porPagina };
  }

  async fichaUsuario(usuarioId: string): Promise<FichaUsuario | null> {
    const bd = conexion();
    const fila = bd
      .prepare(`SELECT ${COLUMNAS_METRICAS} FROM usuarios u WHERE u.id = ?`)
      .get(usuarioId) as FilaUsuarioMetricas | undefined;
    if (!fila) return null;

    const campanas = bd
      .prepare("SELECT * FROM campanas WHERE usuario_id = ? ORDER BY actualizada_en DESC")
      .all(usuarioId) as FilaCampana[];

    const movimientos = bd
      .prepare("SELECT * FROM movimientos WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 50")
      .all(usuarioId) as FilaMovimiento[];

    /* Se traen tanto los hechos sufridos por este usuario como los que él
       mismo provocó siendo administrador. Las dos mitades importan al
       investigar un incidente. */
    const auditoria = bd
      .prepare(
        `SELECT * FROM auditoria
          WHERE (objetivo_tipo = 'usuario' AND objetivo_id = ?) OR actor_id = ?
          ORDER BY fecha DESC LIMIT 50`,
      )
      .all(usuarioId, usuarioId) as FilaAuditoria[];

    return {
      usuario: aUsuarioConMetricas(fila),
      campanas: campanas.map(aCampana),
      movimientos: movimientos.map(aMovimiento),
      auditoria: auditoria.map(aEvento),
    };
  }

  async contarAdmins(): Promise<number> {
    return (
      conexion().prepare("SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'admin'").get() as {
        n: number;
      }
    ).n;
  }

  async cambiarRol(usuarioId: string, rol: Rol): Promise<Usuario | null> {
    const bd = conexion();
    const r = bd.prepare("UPDATE usuarios SET rol = ? WHERE id = ?").run(rol, usuarioId);
    if (r.changes === 0) return null;
    return this.leerUsuario(usuarioId);
  }

  /**
   * Ajuste manual de saldo. La condición `creditos + ? >= 0` va dentro del
   * propio UPDATE, igual que en el descuento de `sqlite.ts`: comprobar antes
   * y escribir después deja una ventana por la que dos peticiones simultáneas
   * pueden dejar el saldo en negativo.
   *
   * El movimiento se escribe en la misma transacción y con un motivo propio,
   * así que el ajuste aparece en el historial que ve el propio usuario. Un
   * administrador tocando saldo sin dejar rastro visible para el cliente es
   * exactamente lo que esta tabla existe para impedir.
   */
  async ajustarCreditos(usuarioId: string, delta: number, nota: string): Promise<Usuario | null> {
    const bd = conexion();
    const existe = this.leerUsuario(usuarioId);
    if (!existe) return null;

    bd.exec("BEGIN IMMEDIATE");
    try {
      const r = bd
        .prepare("UPDATE usuarios SET creditos = creditos + ? WHERE id = ? AND creditos + ? >= 0")
        .run(delta, usuarioId, delta);
      if (r.changes === 0) {
        bd.exec("ROLLBACK");
        throw new Error("SALDO_NEGATIVO");
      }
      bd.prepare(
        `INSERT INTO movimientos (id, usuario_id, campana_id, campana_nombre, delta, motivo, fecha)
         VALUES (?, ?, NULL, ?, ?, 'ajuste-admin', ?)`,
      ).run(id("mov"), usuarioId, nota, delta, new Date().toISOString());
      bd.exec("COMMIT");
    } catch (e) {
      try {
        bd.exec("ROLLBACK");
      } catch {
        /* La transacción ya se cerró en la rama de saldo insuficiente. */
      }
      throw e;
    }
    return this.leerUsuario(usuarioId);
  }

  async borrarUsuario(usuarioId: string): Promise<boolean> {
    /* Campañas y movimientos caen por ON DELETE CASCADE. La auditoría no:
       su `actor_id` no lleva clave foránea a propósito, para que el registro
       de lo que hizo alguien sobreviva a su propia cuenta. */
    const r = conexion().prepare("DELETE FROM usuarios WHERE id = ?").run(usuarioId);
    return r.changes > 0;
  }

  async promoverPorEmail(
    email: string,
  ): Promise<{ usuario: Usuario; promovido: boolean } | null> {
    const bd = conexion();
    const fila = bd
      .prepare("SELECT * FROM usuarios WHERE email = ?")
      .get(email.toLowerCase()) as FilaUsuario | undefined;
    if (!fila) return null;
    if (fila.rol === "admin") return { usuario: aUsuario(fila), promovido: false };

    bd.prepare("UPDATE usuarios SET rol = 'admin' WHERE id = ?").run(fila.id);
    return { usuario: { ...aUsuario(fila), rol: "admin" }, promovido: true };
  }

  private leerUsuario(usuarioId: string): Usuario | null {
    const f = conexion().prepare("SELECT * FROM usuarios WHERE id = ?").get(usuarioId) as
      | FilaUsuario
      | undefined;
    return f ? aUsuario(f) : null;
  }

  /* ===================== Campañas ===================== */

  async listarCampanas(filtro: FiltroCampanas): Promise<Pagina<CampanaConDueno>> {
    const bd = conexion();
    const { pagina, porPagina, salto } = paginaSegura(filtro);

    const donde: string[] = [];
    const args: unknown[] = [];

    if (filtro.busqueda?.trim()) {
      donde.push("(lower(c.nombre) LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\')");
      const patron = comoLike(filtro.busqueda);
      args.push(patron, patron);
    }
    if (filtro.estado) {
      donde.push("c.estado = ?");
      args.push(filtro.estado);
    }
    if (filtro.usuarioId) {
      donde.push("c.usuario_id = ?");
      args.push(filtro.usuarioId);
    }
    if (filtro.tipologia) {
      /* La tipología vive dentro del array JSON de prompts: se consulta con
         json_each en lugar de traer las filas y filtrarlas en memoria. */
      donde.push(
        `EXISTS (SELECT 1 FROM json_each(c.prompts) p
                  WHERE json_extract(p.value, '$.tipologia') = ?)`,
      );
      args.push(filtro.tipologia);
    }
    if (filtro.soloConBloqueo) {
      /* Dos niveles de json_each: prompts, y dentro de cada uno, sus
         advertencias. Es lo que permite que el total del paginador cuente
         solo las campañas con bloqueo de verdad. */
      donde.push(
        `EXISTS (SELECT 1
                   FROM json_each(c.prompts) p,
                        json_each(json_extract(p.value, '$.advertencias')) a
                  WHERE json_extract(a.value, '$.severidad') = 'bloqueo')`,
      );
    }

    const clausula = donde.length > 0 ? `WHERE ${donde.join(" AND ")}` : "";
    const desde = `FROM campanas c JOIN usuarios u ON u.id = c.usuario_id ${clausula}`;

    const total = (
      bd.prepare(`SELECT COUNT(*) AS n ${desde}`).get(...(args as never[])) as { n: number }
    ).n;

    const filas = bd
      .prepare(
        `SELECT c.id, c.usuario_id, c.nombre, c.producto, c.prompts, c.estado,
                c.actualizada_en, u.email
           ${desde}
          ORDER BY c.actualizada_en DESC
          LIMIT ? OFFSET ?`,
      )
      .all(...([...args, porPagina, salto] as never[])) as {
      id: string;
      usuario_id: string;
      nombre: string;
      producto: string;
      prompts: string;
      estado: string;
      actualizada_en: string;
      email: string;
    }[];

    return {
      filas: filas.map((f) => {
        const prompts = JSON.parse(f.prompts) as Prompt[];
        const advertencias = prompts.flatMap((p) => p.advertencias);
        return {
          id: f.id,
          usuarioId: f.usuario_id,
          usuarioEmail: f.email,
          nombre: f.nombre,
          productoNombre: (JSON.parse(f.producto) as { nombre: string }).nombre,
          estado: f.estado as EstadoCampana,
          prompts: prompts.length,
          bloqueos: advertencias.filter((a) => a.severidad === "bloqueo").length,
          avisos: advertencias.filter((a) => a.severidad === "aviso").length,
          actualizadaEn: f.actualizada_en,
        };
      }),
      total,
      pagina,
      porPagina,
    };
  }

  async campanaCompleta(campanaId: string): Promise<{ campana: Campana; email: string } | null> {
    const fila = conexion()
      .prepare(
        `SELECT c.*, u.email FROM campanas c
           JOIN usuarios u ON u.id = c.usuario_id
          WHERE c.id = ?`,
      )
      .get(campanaId) as (FilaCampana & { email: string }) | undefined;
    if (!fila) return null;
    return { campana: aCampana(fila), email: fila.email };
  }

  async borrarCampanaComoAdmin(campanaId: string): Promise<boolean> {
    const r = conexion().prepare("DELETE FROM campanas WHERE id = ?").run(campanaId);
    return r.changes > 0;
  }

  /* ============ Calidad de la metodología ============ */

  /**
   * Agrega las advertencias de todos los prompts de la plataforma.
   *
   * El recuento se hace en JavaScript y no en SQL a propósito: la matriz
   * regla × tipología y el ranking de palabras exigirían tres consultas con
   * json_each anidado cada una, y aquí una sola lectura de la columna basta.
   * Si el volumen creciera hasta que esto pese, la salida es materializar el
   * resultado en una tabla al guardar el prompt, no complicar la consulta.
   */
  async calidad(): Promise<CalidadMetodologia> {
    const filas = conexion().prepare("SELECT prompts FROM campanas").all() as {
      prompts: string;
    }[];

    const ocurrencias = new Map<ReglaAdvertencia, number>();
    const afectados = new Map<ReglaAdvertencia, number>();
    const severidades = new Map<ReglaAdvertencia, Advertencia["severidad"]>();
    const matriz: CalidadMetodologia["matriz"] = {};
    const promptsPorTipologia: Record<string, number> = {};
    const palabras = new Map<string, number>();
    const bloqueoPorDia = new Map<string, { total: number; conBloqueo: number }>();

    let promptsTotales = 0;
    let promptsLimpios = 0;
    let promptsConBloqueo = 0;

    for (const fila of filas) {
      const prompts = JSON.parse(fila.prompts) as Prompt[];
      for (const p of prompts) {
        promptsTotales++;
        promptsPorTipologia[p.tipologia] = (promptsPorTipologia[p.tipologia] ?? 0) + 1;
        matriz[p.tipologia] ??= {};

        const reglasDelPrompt = new Set<ReglaAdvertencia>();
        let bloqueado = false;

        for (const a of p.advertencias) {
          ocurrencias.set(a.regla, (ocurrencias.get(a.regla) ?? 0) + 1);
          severidades.set(a.regla, a.severidad);
          reglasDelPrompt.add(a.regla);
          if (a.severidad === "bloqueo") bloqueado = true;
          if (a.regla === "palabra-prohibida" && a.fragmento) {
            palabras.set(a.fragmento, (palabras.get(a.fragmento) ?? 0) + 1);
          }
        }

        /* Un prompt cuenta una sola vez por regla, aunque la incumpla en
           cinco sitios: si no, un prompt con veinte textos largos hundiría
           la estadística él solo. */
        for (const regla of reglasDelPrompt) {
          afectados.set(regla, (afectados.get(regla) ?? 0) + 1);
          matriz[p.tipologia][regla] = (matriz[p.tipologia][regla] ?? 0) + 1;
        }

        if (p.advertencias.length === 0) promptsLimpios++;
        if (bloqueado) promptsConBloqueo++;

        const dia = soloFecha(p.creadoEn);
        const acumulado = bloqueoPorDia.get(dia) ?? { total: 0, conBloqueo: 0 };
        acumulado.total++;
        if (bloqueado) acumulado.conBloqueo++;
        bloqueoPorDia.set(dia, acumulado);
      }
    }

    const porRegla: CalidadRegla[] = REGLAS.map((regla) => ({
      regla,
      severidad: severidades.get(regla) ?? (regla === "sin-bloque-paleta" ? "bloqueo" : "aviso"),
      ocurrencias: ocurrencias.get(regla) ?? 0,
      promptsAfectados: afectados.get(regla) ?? 0,
    })).sort((a, b) => b.promptsAfectados - a.promptsAfectados);

    const serie = serieCompleta(
      [...bloqueoPorDia.entries()].map(([dia, v]) => ({
        dia,
        /* Porcentaje redondeado: la serie se dibuja, no se factura. */
        n: v.total === 0 ? 0 : Math.round((v.conBloqueo / v.total) * 100),
      })),
      DIAS_SERIE,
    );

    return {
      promptsTotales,
      promptsLimpios,
      promptsConBloqueo,
      porRegla,
      matriz,
      promptsPorTipologia,
      palabrasProhibidas: [...palabras.entries()]
        .map(([palabra, veces]) => ({ palabra, veces }))
        .sort((a, b) => b.veces - a.veces)
        .slice(0, 10),
      bloqueoPorDia: serie,
    };
  }

  /* ===================== Auditoría ===================== */

  async anotarAuditoria(entrada: EntradaAuditoria): Promise<EventoAuditoria> {
    const evento: EventoAuditoria = {
      id: id("aud"),
      actorId: entrada.actorId,
      actorEmail: entrada.actorEmail,
      accion: entrada.accion,
      objetivoTipo: entrada.objetivoTipo,
      objetivoId: entrada.objetivoId,
      objetivoEtiqueta: entrada.objetivoEtiqueta,
      detalle: entrada.detalle ?? {},
      ip: entrada.ip ?? "desconocida",
      fecha: new Date().toISOString(),
    };
    conexion()
      .prepare(
        `INSERT INTO auditoria
           (id, actor_id, actor_email, accion, objetivo_tipo, objetivo_id,
            objetivo_etiqueta, detalle, ip, fecha)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        evento.id,
        evento.actorId,
        evento.actorEmail,
        evento.accion,
        evento.objetivoTipo,
        evento.objetivoId,
        evento.objetivoEtiqueta,
        JSON.stringify(evento.detalle),
        evento.ip,
        evento.fecha,
      );
    return evento;
  }

  /** Construye el WHERE compartido por la lista paginada y la exportación. */
  private filtroAuditoria(filtro: FiltroAuditoria) {
    const donde: string[] = [];
    const args: unknown[] = [];
    if (filtro.actorId) {
      donde.push("actor_id = ?");
      args.push(filtro.actorId);
    }
    if (filtro.accion) {
      donde.push("accion = ?");
      args.push(filtro.accion);
    }
    if (filtro.desde) {
      donde.push("fecha >= ?");
      args.push(filtro.desde);
    }
    if (filtro.hasta) {
      donde.push("fecha <= ?");
      args.push(filtro.hasta);
    }
    return {
      clausula: donde.length > 0 ? `WHERE ${donde.join(" AND ")}` : "",
      args,
    };
  }

  async listarAuditoria(filtro: FiltroAuditoria): Promise<Pagina<EventoAuditoria>> {
    const bd = conexion();
    const { pagina, porPagina, salto } = paginaSegura(filtro);
    const { clausula, args } = this.filtroAuditoria(filtro);

    const total = (
      bd.prepare(`SELECT COUNT(*) AS n FROM auditoria ${clausula}`).get(...(args as never[])) as {
        n: number;
      }
    ).n;

    const filas = bd
      .prepare(`SELECT * FROM auditoria ${clausula} ORDER BY fecha DESC LIMIT ? OFFSET ?`)
      .all(...([...args, porPagina, salto] as never[])) as FilaAuditoria[];

    return { filas: filas.map(aEvento), total, pagina, porPagina };
  }

  async auditoriaCompleta(filtro: FiltroAuditoria): Promise<EventoAuditoria[]> {
    const { clausula, args } = this.filtroAuditoria(filtro);
    /* Tope duro: la exportación no puede convertirse en una forma de tumbar
       el proceso pidiendo un CSV de un millón de filas. */
    const filas = conexion()
      .prepare(`SELECT * FROM auditoria ${clausula} ORDER BY fecha DESC LIMIT 5000`)
      .all(...(args as never[])) as FilaAuditoria[];
    return filas.map(aEvento);
  }
}

let repo: RepositorioAdmin | null = null;

/** Punto de inyección del repositorio de administración. */
export function repositorioAdmin(): RepositorioAdmin {
  repo ??= new RepositorioAdminSQLite();
  return repo;
}
