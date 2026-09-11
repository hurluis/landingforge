import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { Movimiento } from "@/components/motion/movimiento";
import { PanelAccesibilidad } from "@/components/a11y/panel-accesibilidad";
import "./globals.css";

/**
 * UNA SOLA FAMILIA: Outfit. Geométrica de bowls circulares y remates rectos,
 * variable de 100 a 900.
 *
 * Sustituye al par Bodoni + Geist. El didone se eligió cuando la página era
 * una sala oscura con objetos dentro: su contraste altísimo entre astas y
 * perfiles brillaba sobre el estudio y desaparecía sobre el papel, y esa
 * ambigüedad era el argumento. Ahora la identidad es la película, que ocupa
 * la pantalla entera y ya lleva toda la textura que la página necesita.
 * Encima de ella un didone compite; una geométrica redonda en peso alto se
 * apoya. La referencia usa Halyard Display en 500-600, que es exactamente
 * esta forma: círculo, remate recto, nada de gracia.
 *
 * Que sea la MISMA familia para display y para texto es la mitad del
 * minimalismo: la página deja de tener dos voces.
 */
const outfit = Outfit({
  variable: "--font-round",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "LandingForge · el paquete visual de tu landing, sin plantillas",
    template: "%s · LandingForge",
  },
  description:
    "Sube la foto. LandingForge arma las nueve secciones que venden, adaptadas al país donde vendes. Sin plantillas.",
  openGraph: {
    title: "LandingForge",
    description:
      "El paquete visual completo de tu landing de e-commerce, construido con metodología.",
    locale: "es_LA",
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
      lang="es"
      className={`${outfit.variable} ${GeistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Las preferencias de accesibilidad se aplican ANTES del primer
            pintado. Si esperasen a que React hidrate, quien pidió texto grande
            o el papel claro vería medio segundo de la página que justamente
            no puede usar. El bucle es genérico: escribe `data-<clave>` por
            cada preferencia guardada, así que añadir una preferencia nueva no
            obliga a tocar este script. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var p=JSON.parse(localStorage.getItem("lf_a11y")||"{}"),d=document.documentElement;for(var k in p)d.setAttribute("data-"+k,String(p[k]))}catch(e){}',
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-void text-ash">
        <Movimiento>{children}</Movimiento>
        <PanelAccesibilidad />
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
