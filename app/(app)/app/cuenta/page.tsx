import type { Metadata } from "next";
import { usuarioActual } from "@/lib/auth/sesion";
import { repositorio } from "@/lib/datos/sqlite";
import { hayModeloReal } from "@/lib/ia";
import { Cuenta } from "@/components/app/cuenta";

export const metadata: Metadata = { title: "Cuenta" };
export const dynamic = "force-dynamic";

export default async function PaginaCuenta() {
  const usuario = await usuarioActual();
  if (!usuario) return null; // el layout ya redirige
  const movimientos = await repositorio().movimientos(usuario.id);

  return <Cuenta usuario={usuario} movimientos={movimientos} modeloReal={hayModeloReal()} />;
}
