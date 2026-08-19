/**
 * Prepara public/pieza3d/martillo.gltf — la pieza 3D del fondo.
 *
 * PROCEDENCIA. La malla es «Cross Pein Hammer» de Poly Haven, publicada bajo
 * CC0 1.0 (dominio público: uso comercial libre, sin atribución obligatoria).
 * Se eligió por lo que significa, no por lo que es: LandingForge es una forja,
 * y el martillo de bola cruzada es la herramienta con la que se trabaja el
 * metal caliente. Autor: Tics. https://polyhaven.com/a/cross_pein_hammer
 *
 * QUÉ HACE ESTE SCRIPT, Y POR QUÉ. El paquete original pesa 1,5 MB: 58 KB de
 * geometría y 1,45 MB de texturas JPG. Las texturas se descartan enteras.
 *
 *   1. El mango es madera marrón. En una paleta donde el color significa
 *      estado del trabajo —naranja = en proceso, templado = terminado, azul =
 *      información— un marrón de textura no significa nada y ensucia el
 *      esquema. La pieza se pinta con un material de acero de la paleta y su
 *      temperatura la escribe el scroll.
 *   2. Es un objeto de fondo, detrás del contenido y desenfocado por
 *      contraste. El detalle de un normal map de 1k no llega al ojo, pero sí
 *      llega a la factura de red.
 *
 * El resultado son 61 KB versionados. Reproducible:
 *
 *   node scripts/preparar-pieza3d.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DESTINO = resolve(AQUI, "..", "public", "pieza3d");

const BASE = "https://dl.polyhaven.org/file/ph-assets/Models";
const GLTF = `${BASE}/gltf/1k/cross_pein_hammer/cross_pein_hammer_1k.gltf`;
const BIN = `${BASE}/gltf/8k/cross_pein_hammer/cross_pein_hammer.bin`;

async function bajar(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} al bajar ${url}`);
  return Buffer.from(await r.arrayBuffer());
}

const gltf = JSON.parse((await bajar(GLTF)).toString("utf8"));
const bin = await bajar(BIN);

/* Fuera todo lo que apunte a un JPG. Si quedara una sola referencia colgando,
   GLTFLoader intentaría el fetch y devolvería 404 en producción. */
delete gltf.images;
delete gltf.textures;
delete gltf.samplers;

/* Un solo material, de acero, con los canales PBR escritos como constantes.
   El color base es grafito frío y no negro: un negro puro no tiene a qué
   devolverle la luz clave, y la pieza se leería como una silueta recortada.
   El emisivo arranca apagado porque el metal empieza frío; subirlo con el
   scroll es trabajo del componente, no del asset. */
gltf.materials = [
  {
    name: "acero",
    doubleSided: false,
    pbrMetallicRoughness: {
      baseColorFactor: [0.28, 0.3, 0.34, 1],
      metallicFactor: 1,
      roughnessFactor: 0.38,
    },
    emissiveFactor: [0, 0, 0],
  },
];

/* Las UV sobran sin texturas: quitar el atributo evita que el loader suba a
   la GPU un buffer que ningún shader va a leer. Los bytes siguen en el .bin
   —reescribirlo por 11 KB no vale el riesgo de desalinear un offset—, pero
   ya no viajan a la tarjeta. */
for (const malla of gltf.meshes ?? []) {
  for (const prim of malla.primitives ?? []) {
    delete prim.attributes.TEXCOORD_0;
    prim.material = 0;
  }
}

gltf.buffers = [{ byteLength: bin.byteLength, uri: "martillo.bin" }];
gltf.asset.generator = "scripts/preparar-pieza3d.mjs · malla CC0 de Poly Haven";

await mkdir(DESTINO, { recursive: true });
await writeFile(resolve(DESTINO, "martillo.gltf"), JSON.stringify(gltf));
await writeFile(resolve(DESTINO, "martillo.bin"), bin);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`martillo.gltf  ${kb(JSON.stringify(gltf).length)}`);
console.log(`martillo.bin   ${kb(bin.byteLength)}`);
console.log("Malla CC0 · Cross Pein Hammer · Tics · polyhaven.com");
