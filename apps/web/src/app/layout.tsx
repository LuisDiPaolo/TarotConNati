import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { PanelPwaManager } from "@/components/pwa/PanelPwaManager";
import { PublicPwaManager } from "@/components/pwa/PublicPwaManager";
import { OrientationGuard } from "@/components/layout/OrientationGuard";
import { ViewportRuntime } from "@/components/layout/ViewportRuntime";

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
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.style.setProperty('--app-height',window.innerHeight+'px');document.documentElement.style.setProperty('--app-width',window.innerWidth+'px');}catch(e){}})();`,
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
        {children}
      </body>
    </html>
  );
}
