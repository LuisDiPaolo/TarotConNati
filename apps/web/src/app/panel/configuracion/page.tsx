import { headers } from "next/headers";
import { BrandAssetsManager } from "@/components/panel/BrandAssetsManager";
import { BusinessQrCard } from "@/components/panel/BusinessQrCard";
import { BusinessSettingsForm } from "@/components/panel/BusinessSettingsForm";
import { OnboardingChecklist } from "@/components/panel/OnboardingChecklist";
import { PanelShell } from "@/components/panel/PanelShell";
import { PwaBrandPreview } from "@/components/panel/PwaBrandPreview";
import { getPanelBusinessSettings, getPanelIntakeForms, getPanelSchedules, getPanelServices } from "@/lib/operations/panel-settings";
import { requirePanelSession } from "@/lib/panel/auth";

export default async function PanelConfigurationPage() {
  await requirePanelSession();
  const [business, services, schedules, intakeForms, headerStore] = await Promise.all([
    getPanelBusinessSettings(),
    getPanelServices(),
    getPanelSchedules(),
    getPanelIntakeForms(),
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

      <OnboardingChecklist
        business={business}
        servicesCount={business ? services.length : 0}
        schedulesCount={business ? schedules.length : 0}
        formsCount={business ? intakeForms.length : 0}
      />
      <BusinessSettingsForm business={business} />
      {business ? (
        <>
          <BrandAssetsManager business={business} />
          <PwaBrandPreview business={business} />
          <BusinessQrCard business={business} fallbackOrigin={fallbackOrigin} />
        </>
      ) : null}
    </PanelShell>
  );
}
