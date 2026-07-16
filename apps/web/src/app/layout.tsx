import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "@/styles/globals.css";
import { PanelPwaManager } from "@/components/pwa/PanelPwaManager";
import { PublicPwaManager } from "@/components/pwa/PublicPwaManager";
import { OrientationGuard } from "@/components/layout/OrientationGuard";
import { ViewportRuntime } from "@/components/layout/ViewportRuntime";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { isConfiguredPanelHost } from "@/lib/business/instance";
import { resolveBusinessForHostname } from "@/lib/business/resolve";
import { buildBrandStyle } from "@/lib/theme/brand-style";

function hostnameFromHeaders(headerStore: Headers) {
  const rawHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
  const [hostname = ""] = rawHost.split(":");
  return hostname.toLowerCase();
}

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const isPanelHost = isConfiguredPanelHost(hostnameFromHeaders(headerStore));

  return {
    title: isPanelHost ? "Panel Turnos" : "Turnos",
    description: isPanelHost ? "Panel operativo del negocio." : "Plataforma modular de turnos y reservas.",
    manifest: isPanelHost ? "/api/pwa/panel-manifest" : "/api/pwa/public-manifest",
    robots: isPanelHost ? { index: false, follow: false } : undefined,
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: isPanelHost ? "Panel Turnos" : "Turnos",
    },
    icons: {
      icon: [{ url: isPanelHost ? "/pwa/panel/icon.svg" : "/pwa/public/icon.svg", type: "image/svg+xml" }],
      apple: [{ url: isPanelHost ? "/pwa/panel/icon.svg" : "/pwa/public/icon.svg" }],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const business = await resolveBusinessForHostname(headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "");
  const defaultThemeMode = business?.defaultThemeMode ?? "light";

  return (
    <html lang="es-AR" data-default-theme={defaultThemeMode} style={business ? buildBrandStyle(business) : undefined} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var root=document.documentElement;root.style.setProperty('--app-height',window.innerHeight+'px');root.style.setProperty('--app-width',window.innerWidth+'px');var stored=window.localStorage.getItem('turnos-theme');var fallback=root.dataset.defaultTheme;var valid={light:true,brand:true,dark:true};var theme=valid[stored]?stored:(valid[fallback]?fallback:'light');root.dataset.theme=theme;root.classList.toggle('dark',theme==='dark');root.style.colorScheme=theme==='dark'?'dark':'light';}catch(e){}})();`,
          }}
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <ViewportRuntime />
        <OrientationGuard />
        <PublicPwaManager />
        <PanelPwaManager />
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
