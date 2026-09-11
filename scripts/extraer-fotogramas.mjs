/**
 * Extrae los fotogramas de las dos tomas de la página.
 *
 *   npm run fotogramas
 *
 *   public/secuencia        La toma principal, la de la apertura: `part 1` y
 *                           `part 2` son dos planos seguidos —el frasco que
 *                           despega y da vueltas, y el primer plano de la marca
 *                           que abre hasta la mano—, unidos aquí en uno solo.
 *   public/secuencia-crema  La toma del cierre: un tarro de crema girando en la
 *                           mano. Es independiente y va sola.
 *
 * Los másters de `Video/` no se versionan; lo que se versiona son los
 * fotogramas, que son el asset que la página realmente sirve. Este script
 * existe para poder reconstruirlos —o cambiar una toma— sin recordar los flags.
 *
 * Requiere ffmpeg:  brew install ffmpeg
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const TOMAS = [
  { destino: "public/secuencia", entradas: ["Video/part 1.mp4", "Video/part 2.mp4"] },
  {
    destino: "public/secuencia-crema",
    entradas: ["Video/Hand_holding_cream_jar_rotation_20260911131008.mp4"],
  },
];

/* Los dos planos de la toma principal no casan: el primero termina con el
   frasco boca abajo en el aire y el segundo empieza pegado a la etiqueta. En
   un vídeo que se reproduce, el corte seco pasa; en uno que se recorre con el
   dedo, el visitante puede pararse justo en él y verlo saltar adelante y
   atrás. Tres cuartos de segundo de fundido lo convierten en una doble
   exposición —la marca aparece sobre el frasco que cae— y la toma se lee como
   un solo plano. Se probaron también `zoomin` (deja un fotograma gris plano a
   mitad de camino) y el fundido a negro (un apagón en mitad de la apertura). */
const FUNDIDO = 0.75;

/* Calidad 3 con un unsharp suave. Con la toma a plena luz como protagonista,
   calidad 5 escalonaba en bandas el degradado oscuro del fondo; calidad 3 lo
   deja continuo, y el unsharp devuelve la nitidez que el vídeo pierde al
   escalarse a pantallas de 2x. */
const ACABADO = "unsharp=5:5:0.5:5:5:0.0";

try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
} catch {
  console.error("Falta ffmpeg. Instálalo con:  brew install ffmpeg");
  process.exit(1);
}

const duracion = (archivo) =>
  Number(
    execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration",
      "-of", "csv=p=0", archivo]).toString(),
  );

for (const { destino, entradas } of TOMAS) {
  const salida = resolve(destino);
  rmSync(salida, { recursive: true, force: true });
  mkdirSync(salida, { recursive: true });

  const filtro = entradas.length === 1
    ? ["-vf", ACABADO]
    : ["-filter_complex",
       `[0:v][1:v]xfade=transition=fade:duration=${FUNDIDO}:offset=${duracion(entradas[0]) - FUNDIDO},${ACABADO}`];

  execFileSync(
    "ffmpeg",
    ["-v", "error", ...entradas.flatMap((e) => ["-i", e]), "-an", ...filtro,
     "-q:v", "3", "-fps_mode", "passthrough", `${salida}/%04d.jpg`],
    { stdio: "inherit" },
  );
  console.log(`  ${readdirSync(salida).length} fotogramas en ${destino}`);
}

console.log(`\n  Si cambió algún total, actualiza TOMAS en components/motion/pelicula.tsx.\n`);
