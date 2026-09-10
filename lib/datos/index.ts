import "server-only";

import type { Repositorio } from "@/lib/datos/repositorio";
import type { RepositorioAdmin } from "@/lib/datos/admin";
import { RepositorioSQLite } from "@/lib/datos/sqlite";
import { RepositorioAdminSQLite } from "@/lib/datos/admin-sqlite";
import { RepositorioPostgres } from "@/lib/datos/postgres";
import { RepositorioAdminPostgres } from "@/lib/datos/admin-postgres";

/**
 * Selector de persistencia — el punto de inyección de §9.2.
 *
 * `Repositorio` se escribió desde el principio como interfaz asíncrona para
 * que cambiar de motor fuera escribir otra clase. Esto es esa promesa
 * cobrada: toda la aplicación importa de aquí y no sabe con qué está hablando.
 *
 * La regla es una sola:
 *
 *   DATABASE_URL empieza por postgres:// o postgresql://  →  PostgreSQL
 *   cualquier otra cosa (o nada)                          →  SQLite
 *
 * Así el proyecto conserva lo que lo hacía cómodo —clonar, `npm install`,
 * `npm run dev`, sin instalar ni configurar un servidor— y a la vez corre
 * sobre Postgres en cuanto la variable apunta a uno. No hay una bandera
 * aparte que se pueda quedar desincronizada de la URL: la URL ES la decisión.
 *
 * Las cuatro implementaciones se importan de forma estática, y da igual:
 * ninguna abre nada al cargarse. El pool de `pg` y el descriptor de SQLite se
 * crean dentro de su primera consulta, no en el módulo, así que el motor que
 * no se use no llega a tocar disco ni red. Todo esto es `server-only`: nada
 * de esto viaja al navegador.
 */

export type MotorDatos = "postgres" | "sqlite";

export function motor(): MotorDatos {
  return /^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL ?? "") ? "postgres" : "sqlite";
}

let repo: Repositorio | null = null;
let repoAdmin: RepositorioAdmin | null = null;

export function repositorio(): Repositorio {
  if (repo) return repo;
  repo = motor() === "postgres" ? new RepositorioPostgres() : new RepositorioSQLite();
  return repo;
}

export function repositorioAdmin(): RepositorioAdmin {
  if (repoAdmin) return repoAdmin;
  repoAdmin =
    motor() === "postgres" ? new RepositorioAdminPostgres() : new RepositorioAdminSQLite();
  return repoAdmin;
}
