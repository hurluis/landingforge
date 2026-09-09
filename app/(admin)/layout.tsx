import type { Metadata } from "next";
import { exigirAdminEnPagina } from "@/lib/auth/admin";
import { BarraAdmin } from "@/components/admin/barra-admin";
import { SaltarAlContenido } from "@/components/ui/saltar";

export const metadata: Metadata = {
  title: { default: "Administración", template: "%s · Administración" },
  /* El panel no se indexa: no es contenido, y su existencia no es pública. */
  robots: { index: false, follow: false },
};

/**
 * Segunda capa del guardia de administración.
 *
 * `proxy.ts` ya bloqueó a quien no tiene sesión, pero corre en el runtime
 * Edge y no puede abrir SQLite: solo sabe que la cookie está firmada, no de
 * quién es ni qué rol tiene. Aquí es donde se comprueba el rol contra la base
 * de datos, en cada petición y sin confiar en el token.
 *
 * Sin rol, `exigirAdminEnPagina` responde 404 en vez de 403. Un 403 le
 * confirmaría a quien tantea la URL que hay un panel detrás.
 */
export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const admin = await exigirAdminEnPagina();

  return (
    <div className="flex flex-1">
      <SaltarAlContenido />
      {/* La hairline de temple recorre el ancho: la señal de que esto no es
          la aplicación normal está siempre presente y nunca pide atención. */}
      <div
        aria-hidden
        className="fixed inset-x-0 top-0 z-40 h-px bg-[var(--quench)] opacity-70"
      />
      <BarraAdmin admin={admin} />
      <main id="contenido" className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
