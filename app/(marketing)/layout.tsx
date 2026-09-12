import { Nav } from "@/components/marketing/nav";
import { Pie } from "@/components/marketing/pie";
import { Asistente } from "@/components/asistente/asistente";
import { Pelicula } from "@/components/motion/pelicula";
import { traductor } from "@/lib/i18n/servidor";

/** Chrome público: barra, pie y el widget del asistente (§6.1). */
export default async function LayoutMarketing({ children }: { children: React.ReactNode }) {
  const t = await traductor();
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-[10px] focus:bg-[var(--anvil-hi)] focus:px-4 focus:py-2 focus:text-ash"
      >
        {t("Saltar al contenido")}
      </a>
      <Pelicula />
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
