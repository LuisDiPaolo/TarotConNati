import { Tags } from "lucide-react";
import { CouponsManager } from "@/components/panel/CouponsManager";
import { PanelFeatureToggle } from "@/components/panel/PanelFeatureToggle";
import { PanelShell } from "@/components/panel/PanelShell";
import { PanelSetupRequired } from "@/components/panel/PanelSetupRequired";
import { PromotionsManager } from "@/components/panel/PromotionsManager";
import { getPanelBusinessSettings } from "@/lib/operations/panel-settings";
import { getPanelCoupons } from "@/lib/operations/panel-coupons";
import { getPanelPromotions } from "@/lib/operations/panel-promotions";
import { requirePanelSession } from "@/lib/panel/auth";

export default async function PanelPromotionsPage() {
  await requirePanelSession();
  const business = await getPanelBusinessSettings();
  const [{ enabled, promotions }, { enabled: couponsEnabled, coupons }] = business
    ? await Promise.all([getPanelPromotions(), getPanelCoupons()])
    : [{ enabled: false, promotions: [] }, { enabled: false, coupons: [] }];
  const activeCount = promotions.filter((promotion) => promotion.active).length;
  const activeCouponCount = coupons.filter((coupon) => coupon.active).length;

  return (
    <PanelShell>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Comercio</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Promociones</h1>
        </div>
        {business ? (
          <div className="flex flex-col items-start gap-3 sm:items-end">
            <PanelFeatureToggle enabled={enabled} featureKey="promotions_enabled" label="Promociones" />
            <PanelFeatureToggle enabled={couponsEnabled} featureKey="coupons_enabled" label="Cupones y descuentos" />
          </div>
        ) : null}
      </header>

      {!business ? (
        <PanelSetupRequired text="Crea el negocio para poder cargar promociones que van a aparecer en la pagina publica." />
      ) : enabled || couponsEnabled ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="surface p-5">
              <Tags aria-hidden="true" className="h-6 w-6 text-accent" />
              <h2 className="mt-4 text-lg font-bold">Promociones</h2>
              <p className="mt-2 text-3xl font-black">{promotions.length}</p>
            </article>
            <article className="surface p-5">
              <Tags aria-hidden="true" className="h-6 w-6 text-accent" />
              <h2 className="mt-4 text-lg font-bold">Publicadas</h2>
              <p className="mt-2 text-3xl font-black">{activeCount}</p>
            </article>
            <article className="surface p-5 md:col-span-2">
              <Tags aria-hidden="true" className="h-6 w-6 text-accent" />
              <h2 className="mt-4 text-lg font-bold">Cupones activos</h2>
              <p className="mt-2 text-3xl font-black">{activeCouponCount}</p>
            </article>
          </div>

          {enabled ? <PromotionsManager promotions={promotions} /> : null}
          {couponsEnabled ? <CouponsManager coupons={coupons} /> : null}
        </>
      ) : (
        <section className="surface p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Seccion desactivada</p>
          <h2 className="mt-3 text-2xl font-black">Promociones</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Este negocio todavia no tiene activo el modulo de promociones. Cuando se habilite, vas a poder publicar descuentos y precios especiales con fechas de vigencia.
          </p>
        </section>
      )}
    </PanelShell>
  );
}
