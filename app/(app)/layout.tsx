import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth/sesion";
import { BarraLateral } from "@/components/app/barra-lateral";

/**
 * Guard de sesión. El middleware ya bloquea /app/* con la firma del token;
 * esto es la segunda comprobación, contra la base de datos, para el caso de
 * un token válido cuyo usuario ya no existe.
 */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const usuario = await usuarioActual();
  if (!usuario) redirect("/entrar?volver=/app");

  return (
    <div className="flex flex-1">
      {/* Primera parada del tabulador: sin esto hay que atravesar la barra
          lateral entera con el teclado en cada carga de página. */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[10px] focus:bg-[var(--anvil-hi)] focus:px-4 focus:py-2 focus:text-ash"
      >
        Saltar al contenido
      </a>
      <BarraLateral usuario={usuario} />
      <main id="contenido" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
