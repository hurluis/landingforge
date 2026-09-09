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

/* Calidad 5 y sin escalar: a 1280x720 salen ~20 KB por fotograma, así que los
   480 caben en 9 MB —menos de la mitad que el mp4— y se pintan sin decodificar
   nada. Bajar la calidad no compensa: el degradado del fondo es lo primero que
   se rompe en bandas. */
execFileSync(
  "ffmpeg",
  ["-v", "error", "-i", origen, "-an", "-q:v", "5", "-fps_mode", "passthrough",
   `${destino}/%04d.jpg`],
  { stdio: "inherit" },
);

const total = readdirSync(destino).length;
console.log(`\n  ${total} fotogramas en public/secuencia\n`);
console.log(`  Actualiza TOTAL en components/motion/secuencia-scroll.tsx si cambió.\n`);
