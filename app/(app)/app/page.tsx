import type { Metadata } from "next";
import { usuarioActual } from "@/lib/auth/sesion";
import { repositorio } from "@/lib/datos";
import { Biblioteca } from "@/components/app/biblioteca";

export const metadata: Metadata = { title: "Biblioteca" };
export const dynamic = "force-dynamic";

export default async function PaginaBiblioteca() {
  const usuario = await usuarioActual();
  if (!usuario) return null; // el layout ya redirige
  const campanas = await repositorio().campanasDe(usuario.id);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 pt-20 sm:px-8 lg:pt-8">
      <header className="mb-8">
        <h1 className="display-md">Biblioteca</h1>
        <p className="mt-2 cuerpo text-smoke">
          {campanas.length === 0
            ? "Todavía no has generado nada."
            : `${campanas.length} ${campanas.length === 1 ? "campaña" : "campañas"} guardadas.`}
        </p>
      </header>

      <Biblioteca campanas={campanas} />
    </div>
  );
}
