import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      name: "Turnos - Sitio publico",
      short_name: "Turnos",
      description: "Reserva de turnos del negocio.",
      id: "/",
      scope: "/",
      start_url: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#f8fafc",
      theme_color: "#111827",
      lang: "es-AR",
      categories: ["business", "productivity"],
      icons: [
        { src: "/pwa/public/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        { src: "/pwa/public/maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } },
  );
}
