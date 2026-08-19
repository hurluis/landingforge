import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/marketing/wordmark";
import { Forja } from "@/components/marketing/forja";
import { usuarioActual } from "@/lib/auth/sesion";
import { FormularioEntrada } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

export default async function Entrar() {
  // Con sesión abierta, esta pantalla no tiene nada que ofrecer.
  if (await usuarioActual()) redirect("/app");

  return (
    <main className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-4 py-8 sm:px-8">
        <Wordmark />

        <div className="grid flex-1 items-center gap-16 py-12 lg:grid-cols-2">
          <Suspense fallback={<div className="h-[420px]" />}>
            <FormularioEntrada />
          </Suspense>

          {/* La Forja también aquí: lo que se compra, mostrado mientras se
              entra. No es decoración, es la misma tesis del hero. */}
          <div className="hidden lg:block">
            <Forja />
          </div>
        </div>
      </div>
    </main>
  );
}
