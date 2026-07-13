import { headers } from "next/headers";
import { BusinessQrCard } from "@/components/panel/BusinessQrCard";
import { BusinessSettingsForm } from "@/components/panel/BusinessSettingsForm";
import { PanelShell } from "@/components/panel/PanelShell";
import { getPanelBusinessSettings } from "@/lib/operations/panel-settings";
import { requirePanelSession } from "@/lib/panel/auth";

export default async function PanelConfigurationPage() {
  await requirePanelSession();
  const [business, headerStore] = await Promise.all([
    getPanelBusinessSettings(),
    headers(),
  ]);
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const fallbackOrigin = host ? `${protocol}://${host}` : "";

  return (
    <PanelShell>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Configuracion</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">Negocio y marca</h1>
      </header>

      {business ? (
        <>
          <BusinessSettingsForm business={business} />
          <BusinessQrCard business={business} fallbackOrigin={fallbackOrigin} />
        </>
      ) : (
        <section className="surface p-6">
          <p className="font-semibold">No se encontro un negocio asociado a esta sesion.</p>
        </section>
      )}
    </PanelShell>
  );
}
