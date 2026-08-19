/**
 * Comprueba el criterio de aceptación de §14: la clave de Gemini no aparece
 * en el bundle del cliente.
 *
 * No basta con confiar en que «no usamos NEXT_PUBLIC_»: esto lo verifica de
 * verdad. Inyecta una clave centinela, compila, y busca la cadena en todo lo
 * que Next produce. Si aparece en cualquier archivo servido al navegador,
 * falla con código distinto de cero para que un CI lo detenga.
 *
 *   node scripts/verificar-clave.mjs
 */
import { execSync } from "node:child_process";
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  copyFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { join, resolve } from "node:path";

const RAIZ = resolve(import.meta.dirname, "..");
const ENV = join(RAIZ, ".env.local");
const RESPALDO = join(RAIZ, ".env.local.verificacion");
const CENTINELA = "CENTINELA_FUGA_DE_CLAVE_9f2a71c4";

function archivosDe(dir) {
  const salida = [];
  const pila = [dir];
  while (pila.length > 0) {
    const actual = pila.pop();
    for (const entrada of readdirSync(actual)) {
      const ruta = join(actual, entrada);
      if (statSync(ruta).isDirectory()) pila.push(ruta);
      else salida.push(ruta);
    }
  }
  return salida;
}

const habiaEnv = existsSync(ENV);
if (habiaEnv) copyFileSync(ENV, RESPALDO);

try {
  const original = habiaEnv ? readFileSync(ENV, "utf8") : "";
  const conCentinela = habiaEnv
    ? original.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${CENTINELA}`)
    : `GEMINI_API_KEY=${CENTINELA}\nAUTH_SECRET=${"0".repeat(64)}\n`;

  writeFileSync(ENV, conCentinela);

  console.log("Compilando con una clave centinela…");
  execSync("npx next build", { cwd: RAIZ, stdio: "ignore" });

  const estaticos = join(RAIZ, ".next", "static");
  const sospechosos = archivosDe(estaticos).filter((f) =>
    readFileSync(f, "utf8").includes(CENTINELA),
  );

  if (sospechosos.length > 0) {
    console.error("FALLA: la clave aparece en el bundle del cliente:");
    for (const f of sospechosos) console.error(`  ${f.replace(RAIZ, ".")}`);
    process.exitCode = 1;
  } else {
    console.log("OK · la clave no aparece en ningún archivo de .next/static");
  }
} finally {
  if (habiaEnv) {
    copyFileSync(RESPALDO, ENV);
    rmSync(RESPALDO);
  } else {
    rmSync(ENV, { force: true });
  }
}
