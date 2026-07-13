import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json(
    {
      name: "Turnos - Panel",
      short_name: "Panel Turnos",
      description: "Panel operativo para administrar el negocio.",
      id: "/panel",
      scope: "/",
      start_url: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0f172a",
      theme_color: "#0f172a",
      lang: "es-AR",
      categories: ["business", "productivity"],
      icons: [
        { src: "/pwa/panel/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        { src: "/pwa/panel/maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }
      ],
    },
    { headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" } },
  );
}
