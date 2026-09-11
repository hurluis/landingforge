import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { Movimiento } from "@/components/motion/movimiento";
import { PanelAccesibilidad } from "@/components/a11y/panel-accesibilidad";
import "./globals.css";

/**
 * UNA SOLA FAMILIA: Nunito. Sans de remates redondeados, variable de 200 a
 * 1000.
 *
 * El encargo fue una letra «más bold, mucho más redondeada»: simple, y que
 * cargue con el minimalismo de la identidad. Outfit, la anterior, era
 * geométrica —bowls circulares— pero sus remates eran rectos, así que a
 * tamaño display se leía más seca que redonda. Nunito redondea el final de
 * cada trazo, y en peso 800 el titular gana cuerpo sin volverse infantil. Se
 * compararon Fredoka (más de juguete), M PLUS Rounded (más ancha, se come la
 * medida del titular) y Rubik (apenas redondeada).
 *
 * Que sea la MISMA familia para display y para texto es la mitad del
 * minimalismo: la página deja de tener dos voces.
 */
const nunito = Nunito({
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
      className={`${nunito.variable} ${GeistMono.variable} h-full`}
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
