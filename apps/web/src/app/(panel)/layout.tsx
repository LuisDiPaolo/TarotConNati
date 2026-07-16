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

  return <div style={buildBrandStyle(business)}>{children}</div>;
}
