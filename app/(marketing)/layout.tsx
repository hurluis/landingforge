import { Nav } from "@/components/marketing/nav";
import { Pie } from "@/components/marketing/pie";
import { Asistente } from "@/components/asistente/asistente";
import { CampoDeLuz } from "@/components/motion/campo-de-luz";
import { SaltarAlContenido } from "@/components/ui/saltar";

/** Chrome público: barra, pie y el widget del asistente (§6.1). */
export default function LayoutMarketing({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SaltarAlContenido />
      <CampoDeLuz />
      <Nav />
      <main id="contenido" className="relative z-10 flex-1 pt-16">
        {children}
      </main>
      <div className="relative z-10">
        <Pie />
      </div>
      <Asistente />
    </>
  );
}
