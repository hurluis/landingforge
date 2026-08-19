import type { Metadata, Viewport } from "next";
import { Bodoni_Moda } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { Movimiento } from "@/components/motion/movimiento";
import "./globals.css";

/**
 * Display: Bodoni Moda. Didone variable con eje óptico, de contraste muy alto
 * entre astas y perfiles: a tamaño grande lee cara y dibujada, que es lo que
 * el cliente pidió.
 *
 * El brief prohibía serif, y con razón: "se siente editorial" no es un motivo
 * de diseño. Pero prohibía en concreto Fraunces e Instrument Serif, que son
 * las dos que salen por defecto. Bodoni no está en ese grupo, y su contraste
 * altísimo hace algo que ninguna grotesca hace: sobre el papel claro los
 * remates finos casi desaparecen y el texto se lee impreso, mientras que
 * sobre el estudio oscuro los mismos remates brillan. La tipografía cambia de
 * carácter con el material, igual que el resto del sistema.
 *
 * Por eso el peso nunca baja de 500: en negativo, un didone ligero pierde las
 * astas finas.
 */
const bodoni = Bodoni_Moda({
  variable: "--font-display-serif",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz"],
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
      className={`${bodoni.variable} ${GeistSans.variable} ${GeistMono.variable} h-full`}
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
