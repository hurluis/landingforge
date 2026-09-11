"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Boton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/campo";
import { CREDITOS_BIENVENIDA } from "@/lib/planes";
import { cn } from "@/lib/utils";

/**
 * Entrada y registro — §7.2. Un solo formulario con dos modos: comparten
 * credenciales, así que separarlos en dos pantallas sería fricción sin razón.
 *
 * El parámetro `volver` devuelve al usuario exactamente donde estaba cuando
 * el middleware lo interceptó.
 */
export function FormularioEntrada() {
  const router = useRouter();
  const parametros = useSearchParams();
  const volver = parametros.get("volver") ?? "/app";

  const [modo, setModo] = React.useState<"entrar" | "registro">(
    parametros.get("modo") === "registro" ? "registro" : "entrar",
  );
  const [email, setEmail] = React.useState("");
  const [contrasena, setContrasena] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [enviando, setEnviando] = React.useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const respuesta = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modo, email, contrasena }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) throw new Error(datos.error ?? "No se pudo completar la operación.");
      router.replace(volver);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la operación.");
      setEnviando(false);
    }
  }

  return (
    <div className="w-full max-w-[420px]">
      <p className="flex items-center gap-3 etiqueta text-smoke">
        <span aria-hidden className="h-px w-8 bg-current" />
        {modo === "entrar" ? "Tu estudio" : "Cuenta nueva"}
      </p>
      <h1 className="mt-5 display-lg">
        {modo === "entrar" ? "Entra a tu cuenta" : "Crea tu cuenta"}
      </h1>
      <p className="mt-4 cuerpo-lg text-smoke">
        {modo === "entrar"
          ? "Tus campañas te esperan donde las dejaste."
          : `Empiezas con ${CREDITOS_BIENVENIDA} créditos gratis. No pedimos tarjeta.`}
      </p>

      <form onSubmit={enviar} className="mt-8 flex flex-col gap-5">
        <Campo
          id="email"
          etiqueta="Correo"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
        />
        <Campo
          id="contrasena"
          etiqueta="Contraseña"
          type="password"
          autoComplete={modo === "entrar" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          ayuda={modo === "registro" ? "Mínimo 8 caracteres." : undefined}
        />

        {error && (
          <p role="alert" aria-live="polite" className="cuerpo text-[var(--danger)]">
            {error}
          </p>
        )}

        <Boton
          type="submit"
          variante="heat"
          tamano="lg"
          cargando={enviando}
          textoCargando={modo === "entrar" ? "Entrando…" : "Creando la cuenta…"}
        >
          {modo === "entrar" ? "Entrar" : "Crear cuenta"}
        </Boton>
      </form>

      <p className="mt-6 cuerpo text-smoke">
        {modo === "entrar" ? "¿Todavía no tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
        <button
          type="button"
          onClick={() => {
            setModo(modo === "entrar" ? "registro" : "entrar");
            setError(null);
          }}
          className={cn(
            "text-ash underline underline-offset-[0.2em] decoration-1",
            "transition-colors duration-[140ms] ease-[var(--ease-out)] hf:text-[var(--heat)]",
          )}
        >
          {modo === "entrar" ? "Créala aquí" : "Entra aquí"}
        </button>
      </p>
    </div>
  );
}
