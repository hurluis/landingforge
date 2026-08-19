import { Suspense } from "react";
import type { Metadata } from "next";
import { usuarioActual } from "@/lib/auth/sesion";
import { Wizard } from "@/components/estudio/wizard";

export const metadata: Metadata = { title: "Estudio" };
export const dynamic = "force-dynamic";

export default async function Nueva() {
  const usuario = await usuarioActual();
  if (!usuario) return null; // el layout ya redirige

  return (
    <Suspense fallback={null}>
      <Wizard usuario={usuario} />
    </Suspense>
  );
}
