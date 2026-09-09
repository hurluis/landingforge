import { redirect } from "next/navigation";
import { usuarioActual } from "@/lib/auth/sesion";
import { BarraLateral } from "@/components/app/barra-lateral";
import { SaltarAlContenido } from "@/components/ui/saltar";

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
      <SaltarAlContenido />
      <BarraLateral usuario={usuario} />
      <main id="contenido" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
