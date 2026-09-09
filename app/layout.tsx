import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, Zilla_Slab } from "next/font/google";
import { Toaster } from "sonner";
import { Movimiento } from "@/components/motion/movimiento";
import "./globals.css";

/**
 * LA TIPOGRAFÍA — tres familias, ninguna por defecto.
 *
 * Lo que había antes era Bodoni Moda sobre Geist. El problema no era la
 * Bodoni: era Geist. Geist es la tipografía de Vercel, viene en la plantilla
 * de Next.js y sale hasta en el ejemplo de la documentación oficial de
 * `next/font`. Cualquier página armada con andamio la lleva, así que un
 * visitante que ha visto tres landings de este año ya la reconoce. No es fea
 * —es genérica, que en una página de venta es peor.
 *
 * El criterio para reemplazarla no fue «que se vea distinta» sino que las
 * tres digan lo mismo que dice el producto. LandingForge es una FORJA: taller,
 * metal, calor, algo estampado. Nada de eso es editorial de moda.
 *
 * Zilla Slab · display.
 *   Slab de remates cuadrados, dibujada por Mozilla para titulares y para
 *   interfaz. Donde una didone como la Bodoni adelgaza hasta el pelo y se
 *   lee «revista de moda», la Zilla mantiene el grosor en los remates y se
 *   lee estampada, como un troquel sobre chapa. Es exactamente el gesto de
 *   la marca, y conserva el contraste serif/grotesca sobre el que ya está
 *   construido el sistema de `display-*`.
 *
 * Archivo · interfaz y cuerpo.
 *   Grotesca industrial de Omnibus-Type, derivada de las góticas americanas
 *   de rotulación y señalética. Tiene el aplomo que Geist no tiene: las
 *   mayúsculas pesan, los números son firmes y aguanta bien en negativo,
 *   que es donde vive la mitad del producto. Variable en peso, así que no
 *   descarga un archivo por grosor.
 *
 * IBM Plex Mono · datos, etiquetas y precios.
 *   Es la que más textura aporta, porque el mono está en todos los índices
 *   («01 · El resultado»), los chips y los precios. La Plex Mono se dibujó
 *   para contextos de ingeniería: mecánica y precisa sin ser de máquina de
 *   escribir. Junto a la Archivo comparten ese aire de manual técnico.
 *
 * Las tres traen `latin`, que cubre las tildes y la eñe.
 */
const display = Zilla_Slab({
  variable: "--font-display-serif",
  subsets: ["latin"],
  display: "swap",
  /* No es variable: los pesos se declaran. 600 es el de titular; 500 y 700
     quedan disponibles para no tener que pedirlos después. */
  weight: ["500", "600", "700"],
});

const sans = Archivo({
  variable: "--font-sans-ui",
  subsets: ["latin"],
  display: "swap",
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono-datos",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "LandingForge · el paquete visual de tu landing, sin plantillas",
    template: "%s · LandingForge",
  },
  description:
    "Sube la foto. LandingForge arma las nueve secciones que venden en Colombia. Sin plantillas.",
  openGraph: {
    title: "LandingForge",
    description:
      "El paquete visual completo de tu landing de e-commerce, construido con metodología.",
    locale: "es_CO",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0B0D",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-CO"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-void text-ash">
        <Movimiento>{children}</Movimiento>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!bg-anvil-hi !text-ash !border-scale !rounded-[10px] !shadow-elev-1 !font-sans",
              description: "!text-smoke",
            },
          }}
        />
      </body>
    </html>
  );
}
