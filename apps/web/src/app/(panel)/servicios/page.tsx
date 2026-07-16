import { PanelShell } from "@/components/panel/PanelShell";
import { PanelSetupRequired } from "@/components/panel/PanelSetupRequired";
import { ServicesManager } from "@/components/panel/ServicesManager";
import { getPanelBusinessSettings, getPanelServices } from "@/lib/operations/panel-settings";
import { requirePanelSession } from "@/lib/panel/auth";

export default async function PanelServicesPage() {
  await requirePanelSession();
  const business = await getPanelBusinessSettings();
  const services = business ? await getPanelServices() : [];

  return (
    <PanelShell>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Catalogo</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">Servicios</h1>
      </header>

      {business ? (
        <ServicesManager services={services} />
      ) : (
        <PanelSetupRequired text="Crea el negocio para poder cargar los servicios que van a aparecer en la pagina publica." />
      )}
    </PanelShell>
  );
}
