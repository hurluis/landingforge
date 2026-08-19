import { Nav } from "@/components/marketing/nav";
import { Pie } from "@/components/marketing/pie";
import { Asistente } from "@/components/asistente/asistente";

/** Chrome público: barra, pie y el widget del asistente (§6.1). */
export default function LayoutMarketing({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[10px] focus:bg-[var(--anvil-hi)] focus:px-4 focus:py-2 focus:text-ash"
      >
        Saltar al contenido
      </a>
      <Nav />
      <main id="contenido" className="flex-1 pt-16">
        {children}
      </main>
      <Pie />
      <Asistente />
    </>
  );
}
