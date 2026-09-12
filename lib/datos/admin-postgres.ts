import "server-only";

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
import { cifra, ejecutar, fila, filas, enTransaccion } from "@/lib/datos/conexion-pg";
import {
  aCampanaPG,
  aUsuarioPG,
  bytesBaseDatos,
  type FilaCampanaPG,
  type FilaUsuarioPG,
} from "@/lib/datos/postgres";
import { generacionDeImagenesActiva, hayModeloReal } from "@/lib/ia";
import { id } from "@/lib/utils";

/**
 * Implementación PostgreSQL del repositorio de administración.
 *
 * Port de `admin-sqlite.ts` con los dos criterios de aquel intactos:
 * los filtros se aplican en SQL y nunca sobre la página ya recortada, y las
 * agregaciones sobre prompts se hacen dentro de la consulta.
 *
 * Traducción de las consultas JSON, que es lo único sustancial:
 *
 *   SQLite (JSON1)                       PostgreSQL (jsonb)
 *   ─────────────────────────────────    ─────────────────────────────────
 *   json_array_length(prompts)           jsonb_array_length(prompts)
 *   json_each(c.prompts)                 jsonb_array_elements(c.prompts)
 *   json_extract(p.value, '$.tipologia') p->>'tipologia'
 *
 * El filtro por tipología usa además el operador de contención `@>`, que sí
 * aprovecha el índice GIN declarado en `conexion-pg.ts`; con
 * `jsonb_array_elements` habría que recorrer todas las filas.
 *
 * Detalle de `pg` que se repite en todo el archivo: `COUNT`, `SUM` y
 * `pg_database_size` devuelven `bigint`/`numeric`, y el driver los entrega
 * como **cadena** para no perder precisión. Por eso cada cifra pasa por
 * `Number()`. Sin eso, `total` sería `"7"` y el paginador compararía texto.
 */

const POR_PAGINA = 25;
const DIAS_SERIE = 30;

const ESTADOS: EstadoCampana[] = ["borrador", "generando", "lista", "error"];
const PLANES_IDS: Plan[] = ["semilla", "estudio", "agencia", "fundicion"];

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

function serieCompleta(fs: { dia: string; n: number }[], dias: number): PuntoSerie[] {
  const porDia = new Map(fs.map((f) => [f.dia, f.n]));
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

function comoLike(busqueda: string): string {
  return `%${busqueda.trim().toLowerCase().replace(/[%_\\]/g, "\\$&")}%`;
}

type FilaAuditoriaPG = {
  id: string;
  actor_id: string | null;
  actor_email: string;
  accion: string;
  objetivo_tipo: string;
  objetivo_id: string;
  objetivo_etiqueta: string;
  detalle: Record<string, unknown>;
  ip: string;
  fecha: string;
};

function aEvento(f: FilaAuditoriaPG): EventoAuditoria {
  return {
    id: f.id,
    actorId: f.actor_id,
    actorEmail: f.actor_email,
    accion: f.accion as EventoAuditoria["accion"],
    objetivoTipo: f.objetivo_tipo as EventoAuditoria["objetivoTipo"],
    objetivoId: f.objetivo_id,
    objetivoEtiqueta: f.objetivo_etiqueta,
    detalle: f.detalle,
    ip: f.ip,
    fecha: f.fecha,
  };
}

type FilaMovimientoPG = {
  id: string;
  usuario_id: string;
  campana_id: string | null;
  campana_nombre: string;
  delta: number;
  motivo: string;
  fecha: string;
};

function aMovimiento(f: FilaMovimientoPG): MovimientoCredito {
  return {
    id: f.id,
    usuarioId: f.usuario_id,
    campanaId: f.campana_id,
    campanaNombre: f.campana_nombre,
    delta: Number(f.delta),
    motivo: f.motivo as MovimientoCredito["motivo"],
    fecha: f.fecha,
  };
}

type FilaUsuarioMetricasPG = FilaUsuarioPG & {
  n_campanas: string | number;
  n_prompts: string | number;
  consumidos: string | number;
  ultima: string | null;
};

function aUsuarioConMetricas(f: FilaUsuarioMetricasPG): UsuarioConMetricas {
  return {
    ...aUsuarioPG(f),
    campanas: Number(f.n_campanas),
    prompts: Number(f.n_prompts),
    creditosConsumidos: Number(f.consumidos),
    ultimaActividad: f.ultima,
  };
}

const COLUMNAS_METRICAS = `
  u.*,
  (SELECT COUNT(*) FROM campanas c WHERE c.usuario_id = u.id) AS n_campanas,
  (SELECT COALESCE(SUM(jsonb_array_length(c.prompts)), 0)
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

export class RepositorioAdminPostgres implements RepositorioAdmin {
  /* ===================== Tablero ===================== */

  async resumen(): Promise<ResumenPlataforma> {
    const desde = haceDias(DIAS_SERIE);

    const [
      usuarios,
      usuariosNuevos30d,
      admins,
      campanas,
      prompts,
    ] = await Promise.all([
      cifra("SELECT COUNT(*) AS n FROM usuarios"),
      cifra("SELECT COUNT(*) AS n FROM usuarios WHERE creado_en >= $1", [desde]),
      cifra("SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'admin'"),
      cifra("SELECT COUNT(*) AS n FROM campanas"),
      cifra("SELECT COALESCE(SUM(jsonb_array_length(prompts)), 0) AS n FROM campanas"),
    ]);

    const porEstado = await filas<{ estado: string; n: string }>(
      "SELECT estado, COUNT(*) AS n FROM campanas GROUP BY estado",
    );
    const campanasPorEstado = Object.fromEntries(
      ESTADOS.map((e) => [e, Number(porEstado.find((f) => f.estado === e)?.n ?? 0)]),
    ) as Record<EstadoCampana, number>;

    const porPlan = await filas<{ plan: string; n: string }>(
      "SELECT plan, COUNT(*) AS n FROM usuarios GROUP BY plan",
    );
    const usuariosPorPlan = Object.fromEntries(
      PLANES_IDS.map((p) => [p, Number(porPlan.find((f) => f.plan === p)?.n ?? 0)]),
    ) as Record<Plan, number>;

    const creditos = await fila<{ consumidos: string; devueltos: string }>(
      `SELECT
         COALESCE(SUM(CASE WHEN delta < 0 THEN -delta ELSE 0 END), 0) AS consumidos,
         COALESCE(SUM(CASE WHEN motivo = 'devolucion' THEN delta ELSE 0 END), 0) AS devueltos
       FROM movimientos`,
    );

    /* `left(creado_en, 10)` en vez de `date(...)`: la columna es texto ISO,
       así que los diez primeros caracteres SON la fecha, sin conversión ni
       zona horaria de por medio. */
    const altas = await filas<{ dia: string; n: string }>(
      `SELECT left(creado_en, 10) AS dia, COUNT(*) AS n FROM usuarios
        WHERE creado_en >= $1 GROUP BY dia`,
      [desde],
    );
    const nuevas = await filas<{ dia: string; n: string }>(
      `SELECT left(creada_en, 10) AS dia, COUNT(*) AS n FROM campanas
        WHERE creada_en >= $1 GROUP BY dia`,
      [desde],
    );

    return {
      usuarios,
      usuariosNuevos30d,
      admins,
      campanas,
      campanasPorEstado,
      prompts,
      creditosConsumidos: Number(creditos?.consumidos ?? 0),
      creditosDevueltos: Number(creditos?.devueltos ?? 0),
      usuariosPorPlan,
      altasPorDia: serieCompleta(
        altas.map((a) => ({ dia: a.dia, n: Number(a.n) })),
        DIAS_SERIE,
      ),
      campanasPorDia: serieCompleta(
        nuevas.map((a) => ({ dia: a.dia, n: Number(a.n) })),
        DIAS_SERIE,
      ),
    };
  }

  async salud(): Promise<SaludSistema> {
    return {
      modeloReal: hayModeloReal(),
      imagenesHabilitadas: generacionDeImagenesActiva(),
      nodo: process.version,
      entorno: process.env.NODE_ENV ?? "development",
      /* En SQLite es el tamaño del archivo; aquí, el que declara el propio
         Postgres para esta base. Mismo significado para quien mira. */
      bytesBaseDatos: await bytesBaseDatos(),
      rateLimitDistribuido: false,
    };
  }

  /* ===================== Usuarios ===================== */

  async listarUsuarios(filtro: FiltroUsuarios): Promise<Pagina<UsuarioConMetricas>> {
    const { pagina, porPagina, salto } = paginaSegura(filtro);

    const donde: string[] = [];
    const args: unknown[] = [];
    const p = () => `$${args.length}`;

    if (filtro.busqueda?.trim()) {
      args.push(comoLike(filtro.busqueda));
      donde.push(`u.email LIKE ${p()} ESCAPE '\\'`);
    }
    if (filtro.plan) {
      args.push(filtro.plan);
      donde.push(`u.plan = ${p()}`);
    }
    if (filtro.rol) {
      args.push(filtro.rol);
      donde.push(`u.rol = ${p()}`);
    }
    const clausula = donde.length > 0 ? `WHERE ${donde.join(" AND ")}` : "";

    const total = await cifra(`SELECT COUNT(*) AS n FROM usuarios u ${clausula}`, args);

    const fs = await filas<FilaUsuarioMetricasPG>(
      `SELECT ${COLUMNAS_METRICAS}
         FROM usuarios u
         ${clausula}
        ORDER BY ${ORDENES[filtro.orden ?? "reciente"]}
        LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
      [...args, porPagina, salto],
    );

    return { filas: fs.map(aUsuarioConMetricas), total, pagina, porPagina };
  }

  async fichaUsuario(usuarioId: string): Promise<FichaUsuario | null> {
    const f = await fila<FilaUsuarioMetricasPG>(
      `SELECT ${COLUMNAS_METRICAS} FROM usuarios u WHERE u.id = $1`,
      [usuarioId],
    );
    if (!f) return null;

    const [campanas, movimientos, auditoria] = await Promise.all([
      filas<FilaCampanaPG>(
        "SELECT * FROM campanas WHERE usuario_id = $1 ORDER BY actualizada_en DESC",
        [usuarioId],
      ),
      filas<FilaMovimientoPG>(
        "SELECT * FROM movimientos WHERE usuario_id = $1 ORDER BY fecha DESC LIMIT 50",
        [usuarioId],
      ),
      /* Los hechos sufridos por este usuario y los que provocó siendo
         administrador: las dos mitades importan al investigar un incidente. */
      filas<FilaAuditoriaPG>(
        `SELECT * FROM auditoria
          WHERE (objetivo_tipo = 'usuario' AND objetivo_id = $1) OR actor_id = $1
          ORDER BY fecha DESC LIMIT 50`,
        [usuarioId],
      ),
    ]);

    return {
      usuario: aUsuarioConMetricas(f),
      campanas: campanas.map(aCampanaPG),
      movimientos: movimientos.map(aMovimiento),
      auditoria: auditoria.map(aEvento),
    };
  }

  async contarAdmins(): Promise<number> {
    return cifra("SELECT COUNT(*) AS n FROM usuarios WHERE rol = 'admin'");
  }

  async cambiarRol(usuarioId: string, rol: Rol): Promise<Usuario | null> {
    const n = await ejecutar("UPDATE usuarios SET rol = $1 WHERE id = $2", [rol, usuarioId]);
    if (n === 0) return null;
    return this.leerUsuario(usuarioId);
  }

  /**
   * Ajuste manual de saldo. La condición `creditos + $1 >= 0` va dentro del
   * UPDATE, igual que el descuento: comprobar antes y escribir después deja
   * una ventana por la que dos peticiones dejan el saldo en negativo.
   *
   * El movimiento se escribe en la misma transacción y con motivo propio, así
   * que el ajuste aparece en el historial que ve el propio usuario.
   */
  async ajustarCreditos(usuarioId: string, delta: number, nota: string): Promise<Usuario | null> {
    const existe = await this.leerUsuario(usuarioId);
    if (!existe) return null;

    await enTransaccion(async (c) => {
      const r = await c.query(
        "UPDATE usuarios SET creditos = creditos + $1 WHERE id = $2 AND creditos + $1 >= 0",
        [delta, usuarioId],
      );
      if ((r.rowCount ?? 0) === 0) throw new Error("SALDO_NEGATIVO");
      await c.query(
        `INSERT INTO movimientos (id, usuario_id, campana_id, campana_nombre, delta, motivo, fecha)
         VALUES ($1, $2, NULL, $3, $4, 'ajuste-admin', $5)`,
        [id("mov"), usuarioId, nota, delta, new Date().toISOString()],
      );
    });
    return this.leerUsuario(usuarioId);
  }

  async borrarUsuario(usuarioId: string): Promise<boolean> {
    /* Campañas y movimientos caen por ON DELETE CASCADE. La auditoría no:
       su `actor_id` no lleva clave foránea a propósito. */
    return (await ejecutar("DELETE FROM usuarios WHERE id = $1", [usuarioId])) > 0;
  }

  async promoverPorEmail(
    email: string,
  ): Promise<{ usuario: Usuario; promovido: boolean } | null> {
    const f = await fila<FilaUsuarioPG>("SELECT * FROM usuarios WHERE email = $1", [
      email.toLowerCase(),
    ]);
    if (!f) return null;
    if (f.rol === "admin") return { usuario: aUsuarioPG(f), promovido: false };

    await ejecutar("UPDATE usuarios SET rol = 'admin' WHERE id = $1", [f.id]);
    return { usuario: { ...aUsuarioPG(f), rol: "admin" }, promovido: true };
  }

  private async leerUsuario(usuarioId: string): Promise<Usuario | null> {
    const f = await fila<FilaUsuarioPG>("SELECT * FROM usuarios WHERE id = $1", [usuarioId]);
    return f ? aUsuarioPG(f) : null;
  }

  /* ===================== Campañas ===================== */

  async listarCampanas(filtro: FiltroCampanas): Promise<Pagina<CampanaConDueno>> {
    const { pagina, porPagina, salto } = paginaSegura(filtro);

    const donde: string[] = [];
    const args: unknown[] = [];
    const p = () => `$${args.length}`;

    if (filtro.busqueda?.trim()) {
      const patron = comoLike(filtro.busqueda);
      args.push(patron);
      const a = p();
      args.push(patron);
      donde.push(`(lower(c.nombre) LIKE ${a} ESCAPE '\\' OR u.email LIKE ${p()} ESCAPE '\\')`);
    }
    if (filtro.estado) {
      args.push(filtro.estado);
      donde.push(`c.estado = ${p()}`);
    }
    if (filtro.usuarioId) {
      args.push(filtro.usuarioId);
      donde.push(`c.usuario_id = ${p()}`);
    }
    if (filtro.tipologia) {
      /* Contención sobre jsonb: «¿contiene el array un objeto con esta
         tipología?». Usa el índice GIN, cosa que desplegar el array con
         jsonb_array_elements no haría. */
      args.push(JSON.stringify([{ tipologia: filtro.tipologia }]));
      donde.push(`c.prompts @> ${p()}::jsonb`);
    }
    if (filtro.soloConBloqueo) {
      /* Dos niveles: cada prompt, y dentro, sus advertencias. Es lo que hace
         que el total del paginador cuente solo las campañas con bloqueo real
         y no la página ya recortada. */
      donde.push(
        `EXISTS (SELECT 1
                   FROM jsonb_array_elements(c.prompts) p,
                        jsonb_array_elements(p->'advertencias') a
                  WHERE a->>'severidad' = 'bloqueo')`,
      );
    }

    const clausula = donde.length > 0 ? `WHERE ${donde.join(" AND ")}` : "";
    const desde = `FROM campanas c JOIN usuarios u ON u.id = c.usuario_id ${clausula}`;

    const total = await cifra(`SELECT COUNT(*) AS n ${desde}`, args);

    const fs = await filas<{
      id: string;
      usuario_id: string;
      nombre: string;
      producto: { nombre: string };
      prompts: Prompt[];
      estado: string;
      actualizada_en: string;
      email: string;
    }>(
      `SELECT c.id, c.usuario_id, c.nombre, c.producto, c.prompts, c.estado,
              c.actualizada_en, u.email
         ${desde}
        ORDER BY c.actualizada_en DESC
        LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
      [...args, porPagina, salto],
    );

    return {
      filas: fs.map((f) => {
        const advertencias = f.prompts.flatMap((x) => x.advertencias);
        return {
          id: f.id,
          usuarioId: f.usuario_id,
          usuarioEmail: f.email,
          nombre: f.nombre,
          productoNombre: f.producto.nombre,
          estado: f.estado as EstadoCampana,
          prompts: f.prompts.length,
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
    const f = await fila<FilaCampanaPG & { email: string }>(
      `SELECT c.*, u.email FROM campanas c
         JOIN usuarios u ON u.id = c.usuario_id
        WHERE c.id = $1`,
      [campanaId],
    );
    if (!f) return null;
    return { campana: aCampanaPG(f), email: f.email };
  }

  async borrarCampanaComoAdmin(campanaId: string): Promise<boolean> {
    return (await ejecutar("DELETE FROM campanas WHERE id = $1", [campanaId])) > 0;
  }

  /* ============ Calidad de la metodología ============ */

  /**
   * El recuento se hace en JavaScript y no en SQL a propósito, igual que en
   * SQLite: la matriz regla × tipología y el ranking de palabras exigirían
   * varias consultas con despliegue anidado, y aquí una sola lectura de la
   * columna basta. Si el volumen creciera, la salida es materializar el
   * resultado al guardar el prompt, no complicar la consulta.
   */
  async calidad(): Promise<CalidadMetodologia> {
    const fs = await filas<{ prompts: Prompt[] }>("SELECT prompts FROM campanas");

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

    for (const f of fs) {
      for (const p of f.prompts) {
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
           cinco sitios. */
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
    await ejecutar(
      `INSERT INTO auditoria
         (id, actor_id, actor_email, accion, objetivo_tipo, objetivo_id,
          objetivo_etiqueta, detalle, ip, fecha)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10)`,
      [
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
      ],
    );
    return evento;
  }

  /** WHERE compartido por la lista paginada y la exportación. */
  private filtroAuditoria(filtro: FiltroAuditoria) {
    const donde: string[] = [];
    const args: unknown[] = [];
    const p = () => `$${args.length}`;

    if (filtro.actorId) {
      args.push(filtro.actorId);
      donde.push(`actor_id = ${p()}`);
    }
    if (filtro.accion) {
      args.push(filtro.accion);
      donde.push(`accion = ${p()}`);
    }
    if (filtro.desde) {
      args.push(filtro.desde);
      donde.push(`fecha >= ${p()}`);
    }
    if (filtro.hasta) {
      args.push(filtro.hasta);
      donde.push(`fecha <= ${p()}`);
    }
    return { clausula: donde.length > 0 ? `WHERE ${donde.join(" AND ")}` : "", args };
  }

  async listarAuditoria(filtro: FiltroAuditoria): Promise<Pagina<EventoAuditoria>> {
    const { pagina, porPagina, salto } = paginaSegura(filtro);
    const { clausula, args } = this.filtroAuditoria(filtro);

    const total = await cifra(`SELECT COUNT(*) AS n FROM auditoria ${clausula}`, args);
    const fs = await filas<FilaAuditoriaPG>(
      `SELECT * FROM auditoria ${clausula} ORDER BY fecha DESC
        LIMIT $${args.length + 1} OFFSET $${args.length + 2}`,
      [...args, porPagina, salto],
    );

    return { filas: fs.map(aEvento), total, pagina, porPagina };
  }

  async auditoriaCompleta(filtro: FiltroAuditoria): Promise<EventoAuditoria[]> {
    const { clausula, args } = this.filtroAuditoria(filtro);
    /* Tope duro: la exportación no puede ser una forma de tumbar el proceso
       pidiendo un CSV de un millón de filas. */
    const fs = await filas<FilaAuditoriaPG>(
      `SELECT * FROM auditoria ${clausula} ORDER BY fecha DESC LIMIT 5000`,
      args,
    );
    return fs.map(aEvento);
  }
}
