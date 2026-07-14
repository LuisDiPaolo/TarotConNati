import { NextRequest, NextResponse } from "next/server";
import { buildBusinessManifest } from "@/lib/pwa/business-manifest";

export async function GET(request: NextRequest) {
  const manifest = await buildBusinessManifest(request, "panel");

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "no-store" },
  });
}
