import { Images } from "lucide-react";
import { PanelShell } from "@/components/panel/PanelShell";
import { PortfolioManager } from "@/components/panel/PortfolioManager";
import { getPanelPortfolioItems } from "@/lib/operations/panel-portfolio";
import { requirePanelSession } from "@/lib/panel/auth";

export default async function PanelPortfolioPage() {
  await requirePanelSession();
  const { enabled, items } = await getPanelPortfolioItems();
  const visibleCount = items.filter((item) => item.active).length;

  return (
    <PanelShell>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Presencia</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Portfolio</h1>
        </div>
      </header>

      {enabled ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="surface p-5">
              <Images aria-hidden="true" className="h-6 w-6 text-accent" />
              <h2 className="mt-4 text-lg font-bold">Items cargados</h2>
              <p className="mt-2 text-3xl font-black">{items.length}</p>
            </article>
            <article className="surface p-5">
              <Images aria-hidden="true" className="h-6 w-6 text-accent" />
              <h2 className="mt-4 text-lg font-bold">Publicados</h2>
              <p className="mt-2 text-3xl font-black">{visibleCount}</p>
            </article>
            <article className="surface p-5">
              <Images aria-hidden="true" className="h-6 w-6 text-accent" />
              <h2 className="mt-4 text-lg font-bold">Borradores</h2>
              <p className="mt-2 text-3xl font-black">{items.length - visibleCount}</p>
            </article>
          </div>

          <PortfolioManager items={items} />
        </>
      ) : (
        <section className="surface p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Modulo no habilitado</p>
          <h2 className="mt-3 text-2xl font-black">Portfolio profesional</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Este negocio todavia no tiene activo el modulo de portfolio. Cuando se habilite, vas a poder cargar trabajos, resultados y publicaciones para mostrarlos en la web publica.
          </p>
        </section>
      )}
    </PanelShell>
  );
}
