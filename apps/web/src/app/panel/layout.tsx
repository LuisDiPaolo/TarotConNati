import type { Metadata } from "next";

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

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
