import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Ignores por defecto de eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Configuración local de editores y asistentes: código de terceros que
    // no forma parte del producto. Lintarlo enmascararía los hallazgos
    // reales bajo cientos de avisos ajenos.
    ".agents/**",
    ".claude/**",
    // Base de datos local de SQLite.
    "datos/**",
  ]),
]);

export default eslintConfig;
