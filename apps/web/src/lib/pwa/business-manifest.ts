import "server-only";

import type { NextRequest } from "next/server";
import { getRequestHostname } from "@/lib/business/resolve";
import { buildBrandAssetUrl } from "@/lib/storage/public-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type ManifestSurface = "public" | "panel";

type BusinessManifestRow = {
  name: string;
  description: string | null;
  public_domain: string | null;
  panel_domain: string | null;
  public_app_name?: string | null;
  panel_app_name?: string | null;
  public_short_name?: string | null;
  panel_short_name?: string | null;
  brand_primary: string;
  theme_background?: string | null;
  public_app_icon_url?: string | null;
  panel_app_icon_url?: string | null;
  maskable_icon_url?: string | null;
  apple_touch_icon_url?: string | null;
};

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : value.slice(0, maxLength).trim();
}

function normalizeColor(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  return /^#[0-9A-Fa-f]{6}$/.test(value) ? value : fallback;
}

function buildIconEntry(path: string | null | undefined, fallbackPath: string, purpose: "any" | "maskable") {
  const uploadedUrl = buildBrandAssetUrl(path);

  if (uploadedUrl) {
    return { src: uploadedUrl, sizes: "512x512", type: "image/webp", purpose };
  }

  return { src: fallbackPath, sizes: "any", type: "image/svg+xml", purpose };
}

async function getBusinessForManifest(request: NextRequest): Promise<BusinessManifestRow | null> {
  const hostname = getRequestHostname(request);
  const supabase = createSupabaseAdminClient();

  const { data: exactMatch, error: exactError } = await supabase
    .from("business")
    .select("name, description, public_domain, panel_domain, public_app_name, panel_app_name, public_short_name, panel_short_name, brand_primary, theme_background, public_app_icon_url, panel_app_icon_url, maskable_icon_url, apple_touch_icon_url")
    .or(`public_domain.eq.${hostname},panel_domain.eq.${hostname}`)
    .maybeSingle();

  if (!exactError && exactMatch) return exactMatch as BusinessManifestRow;

  const { data: fallback, error: fallbackError } = await supabase
    .from("business")
    .select("name, description, public_domain, panel_domain, public_app_name, panel_app_name, public_short_name, panel_short_name, brand_primary, theme_background, public_app_icon_url, panel_app_icon_url, maskable_icon_url, apple_touch_icon_url")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallbackError || !fallback) return null;
  return fallback as BusinessManifestRow;
}

export async function buildBusinessManifest(request: NextRequest, surface: ManifestSurface) {
  const business = await getBusinessForManifest(request);
  const businessName = business?.name ?? "Turnos";
  const description = business?.description || "Reserva de turnos del negocio.";
  const themeColor = normalizeColor(business?.brand_primary, "#111827");
  const backgroundColor = normalizeColor(business?.theme_background, surface === "panel" ? "#0f172a" : "#f8fafc");
  const isPanel = surface === "panel";
  const appName = isPanel
    ? business?.panel_app_name || `${businessName} - Panel`
    : business?.public_app_name || businessName;
  const shortName = isPanel
    ? business?.panel_short_name || `Panel ${truncate(businessName, 18)}`
    : business?.public_short_name || truncate(businessName, 24);
  const iconBasePath = isPanel ? "/pwa/panel" : "/pwa/public";
  const appIconPath = isPanel ? business?.panel_app_icon_url : business?.public_app_icon_url;
  const appleTouchIconUrl = buildBrandAssetUrl(business?.apple_touch_icon_url);

  return {
    name: appName,
    short_name: shortName,
    description: isPanel ? `Panel operativo de ${businessName}.` : description,
    id: isPanel ? "/panel" : "/",
    scope: isPanel ? "/panel" : "/",
    start_url: isPanel ? "/panel" : "/",
    display: "standalone",
    orientation: "portrait",
    background_color: backgroundColor,
    theme_color: themeColor,
    lang: "es-AR",
    categories: ["business", "productivity"],
    apple_touch_icon: appleTouchIconUrl || undefined,
    icons: [
      buildIconEntry(appIconPath, `${iconBasePath}/icon.svg`, "any"),
      buildIconEntry(business?.maskable_icon_url, `${iconBasePath}/maskable.svg`, "maskable"),
    ],
  };
}
