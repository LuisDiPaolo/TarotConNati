import type { Metadata } from "next";
import { getPanelBusinessSettings } from "@/lib/operations/panel-settings";
import { buildBrandStyle } from "@/lib/theme/brand-style";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Panel Turnos",
  description: "Panel operativo del negocio.",
  manifest: "/api/pwa/panel-manifest",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Panel Turnos",
  },
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const business = await getPanelBusinessSettings();

  if (!business) return children;

  return <div style={buildBrandStyle(business)}>{children}</div>;
}
