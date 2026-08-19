"use client";

import * as React from "react";
import { Campo, AreaTexto } from "@/components/ui/campo";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Chip } from "@/components/ui/piezas";
import { Boton } from "@/components/ui/boton";
import {
  Dialogo,
  DialogoCierre,
  DialogoContenido,
  DialogoDisparador,
} from "@/components/ui/dialogo";

/** Las primitivas que necesitan estado, para poder tocarlas en el kit. */
export function KitInteractivo() {
  const [texto, setTexto] = React.useState("");
  const [area, setArea] = React.useState("");
  const [chip, setChip] = React.useState("uno");

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="flex flex-col gap-5">
        <Campo
          id="kit-normal"
          etiqueta="Campo normal"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribe algo"
          ayuda="El texto de ayuda vive debajo, en --text-lo."
        />
        <Campo
          id="kit-error"
          etiqueta="Campo con error"
          defaultValue="valor@invalido"
          error="El correo o la contraseña no coinciden."
        />
        <Campo id="kit-off" etiqueta="Campo deshabilitado" disabled defaultValue="Bloqueado" />
        <AreaTexto
          id="kit-area"
          etiqueta="Área de texto con contador"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          limite={120}
          placeholder="Describe tu producto en una línea"
        />
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="etiqueta text-mid">Select</span>
          <Select defaultValue="hero">
            <SelectTrigger aria-label="Tipología">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hero">Hero</SelectItem>
              <SelectItem value="beneficios">Beneficios</SelectItem>
              <SelectItem value="antes-despues">Antes / Después</SelectItem>
              <SelectItem value="testimonios">Testimonios</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-[0.8125rem] text-lo">
            Escala desde el disparador, no desde el centro.
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="etiqueta text-mid">Chips</span>
          <div className="flex flex-wrap gap-2">
            {["uno", "dos", "tres"].map((c) => (
              <Chip key={c} activo={chip === c} onClick={() => setChip(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="etiqueta text-mid">Diálogo</span>
          <Dialogo>
            <DialogoDisparador asChild>
              <Boton variante="peligro" className="self-start">
                Eliminar la campaña
              </Boton>
            </DialogoDisparador>
            <DialogoContenido
              titulo="Eliminar «Colágeno Verisol»"
              descripcion="Se borran la campaña y sus prompts. No se puede deshacer, y los créditos que ya gastaste no vuelven."
            >
              <div className="flex justify-end gap-2">
                <DialogoCierre asChild>
                  <Boton variante="secundario">Conservar</Boton>
                </DialogoCierre>
                <DialogoCierre asChild>
                  <Boton variante="peligro">Eliminar la campaña</Boton>
                </DialogoCierre>
              </div>
            </DialogoContenido>
          </Dialogo>
          <span className="text-[0.8125rem] text-lo">
            El único modal del producto: destructivo y con foco protegido.
          </span>
        </div>
      </div>
    </div>
  );
}
