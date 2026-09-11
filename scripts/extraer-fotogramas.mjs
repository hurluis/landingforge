/**
 * Extrae los fotogramas de la toma de producto a `public/secuencia`.
 *
 *   node scripts/extraer-fotogramas.mjs
 *   node scripts/extraer-fotogramas.mjs Video/otra-toma.mp4
 *
 * El máster en `Video/` pesa 22 MB y no se versiona; lo que se versiona son
 * los fotogramas, que son el asset que la página realmente sirve. Este script
 * existe para poder reconstruirlos —o cambiar la toma— sin recordar los flags.
 *
 * Requiere ffmpeg:  brew install ffmpeg
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const origen = process.argv[2] ?? "Video/Animate_frame_into_an_sec_gwr_video_mvp.mp4";
const destino = resolve("public/secuencia");

try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
} catch {
  console.error("Falta ffmpeg. Instálalo con:  brew install ffmpeg");
  process.exit(1);
}

rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });

/* Calidad 3 con un unsharp suave. Con la toma como fondo apagado, calidad 5
   bastaba; con la toma a plena luz como protagonista, el degradado oscuro del
   fondo se escalonaba en bandas visibles —comparado a 2x sobre el fotograma
   150—. Calidad 3 lo deja continuo, y el unsharp devuelve la nitidez que el
   vídeo pierde al escalarse a pantallas de 2x. Son 12 MB en vez de 9: la
   película es lo primero que se ve, y es donde se nota. */
execFileSync(
  "ffmpeg",
  ["-v", "error", "-i", origen, "-an", "-vf", "unsharp=5:5:0.5:5:5:0.0",
   "-q:v", "3", "-fps_mode", "passthrough", `${destino}/%04d.jpg`],
  { stdio: "inherit" },
);

const total = readdirSync(destino).length;
console.log(`\n  ${total} fotogramas en public/secuencia\n`);
console.log(`  Actualiza TOTAL_FOTOGRAMAS en lib/pelicula-reloj.ts si cambió.\n`);
