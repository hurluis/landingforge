import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";

/* Display — §4.3. Variable con opsz/SOFT/WONK: editorial y caro, no rústico. */
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "LandingForge — el paquete visual de tu landing, sin plantillas",
    template: "%s · LandingForge",
  },
  description:
    "Sube la foto de tu producto. LandingForge elige la paleta, escribe el copy y construye las nueve secciones que hacen vender en Colombia.",
  openGraph: {
    title: "LandingForge",
    description:
      "El paquete visual completo de tu landing de e-commerce, construido con metodología, no con plantillas.",
    locale: "es_CO",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0C",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-CO"
      className={`${fraunces.variable} ${GeistSans.variable} ${GeistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-canvas text-hi">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "!bg-surface-2 !text-hi !border-line !rounded-[10px] !shadow-elev-1 !font-sans",
              description: "!text-mid",
            },
          }}
        />
      </body>
    </html>
  );
}
