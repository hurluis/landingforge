import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const nextConfig: NextConfig = {
  /* Sin esto Turbopack sube buscando el package-lock más cercano y encuentra
     uno fuera del proyecto. Fijar la raíz evita que trace archivos ajenos. */
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },

  images: {
    // §12: AVIF y WebP, en ese orden de preferencia.
    formats: ["image/avif", "image/webp"],
  },

  /* node:sqlite es integrado de Node; no debe pasar por el empaquetador. */
  serverExternalPackages: ["node:sqlite"],
};

export default nextConfig;
