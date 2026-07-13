import { PanelShell } from "@/components/panel/PanelShell";
import { ServicesManager } from "@/components/panel/ServicesManager";
import { getPanelServices } from "@/lib/operations/panel-settings";
import { requirePanelSession } from "@/lib/panel/auth";

export default async function PanelServicesPage() {
  await requirePanelSession();
  const services = await getPanelServices();

  return (
    <PanelShell>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Catalogo</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">Servicios</h1>
      </header>

      <ServicesManager services={services} />
    </PanelShell>
  );
}
