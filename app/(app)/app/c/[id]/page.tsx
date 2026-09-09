import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { usuarioActual } from "@/lib/auth/sesion";
import { repositorio } from "@/lib/datos";
import { generacionDeImagenesActiva } from "@/lib/ia";
import { VistaCampana } from "@/components/campana/vista-campana";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const usuario = await usuarioActual();
  if (!usuario) return { title: "Campaña" };
  const { id } = await params;
  const campana = await repositorio().campana(id, usuario.id);
  return { title: campana?.nombre ?? "Campaña" };
}

export default async function PaginaCampana({ params }: Props) {
  const usuario = await usuarioActual();
  if (!usuario) return null; // el layout ya redirige

  const { id } = await params;
  const campana = await repositorio().campana(id, usuario.id);
  if (!campana) notFound();

  return (
    <VistaCampana
      campana={campana}
      generacionImagenesActiva={generacionDeImagenesActiva()}
    />
  );
}
