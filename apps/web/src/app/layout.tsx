import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { PanelPwaManager } from "@/components/pwa/PanelPwaManager";
import { PublicPwaManager } from "@/components/pwa/PublicPwaManager";
import { OrientationGuard } from "@/components/layout/OrientationGuard";
import { ViewportRuntime } from "@/components/layout/ViewportRuntime";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export const metadata: Metadata = {
  title: "Turnos",
  description: "Plataforma modular de turnos y reservas.",
  manifest: "/api/pwa/public-manifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Turnos",
  },
  icons: {
    icon: [{ url: "/pwa/public/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/pwa/public/icon.svg" }],
  },
};

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var root=document.documentElement;root.style.setProperty('--app-height',window.innerHeight+'px');root.style.setProperty('--app-width',window.innerWidth+'px');var stored=window.localStorage.getItem('turnos-theme');var theme=stored==='light'||stored==='dark'?stored:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');root.dataset.theme=theme;root.classList.toggle('dark',theme==='dark');root.style.colorScheme=theme;}catch(e){}})();`,
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
