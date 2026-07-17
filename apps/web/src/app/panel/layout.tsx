import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPanelBusinessSettings } from "@/lib/operations/panel-settings";
import { isConfiguredPanelHost } from "@/lib/business/instance";
import { buildBrandStyle } from "@/lib/theme/brand-style";

export const dynamic = "force-dynamic";

function hostnameFromHeaders(headerStore: Headers) {
  const rawHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const [hostname = ""] = rawHost.split(":");
  return hostname.toLowerCase();
}

export default async function PanelRouteGroupLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();

  if (!isConfiguredPanelHost(hostnameFromHeaders(headerStore))) {
    notFound();
  }

  const business = await getPanelBusinessSettings();

  if (!business) return children;

  const lightLogoUrl = business.logoLightUrl || business.logoUrl || business.panelAppIconUrl;
  const darkLogoUrl = business.logoDarkUrl || business.logoUrl || business.panelAppIconUrl;
  const hasLogo = Boolean(lightLogoUrl || darkLogoUrl);
  const fallbackInitial = business.name.trim().charAt(0).toUpperCase() || "T";

  return (
    <div className="panel-route-frame" style={buildBrandStyle(business)}>
      <div className="panel-safe-area-glass" aria-hidden="true" />
      <header className="panel-brand-masthead">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-foreground))]">Panel de control</p>
        {hasLogo ? (
          <div className="mx-auto mt-5 flex min-h-[96px] w-full max-w-xl items-center justify-center sm:min-h-[118px]">
            {lightLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="brand-logo-light max-h-[118px] w-auto max-w-full object-contain object-center" src={lightLogoUrl} />
            ) : null}
            {darkLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" className="brand-logo-dark hidden max-h-[118px] w-auto max-w-full object-contain object-center" src={darkLogoUrl} />
            ) : null}
          </div>
        ) : (
          <div className="panel-brand-masthead__fallback" aria-label={business.name}>{fallbackInitial}</div>
        )}
      </header>
      {children}
    </div>
  );
}
