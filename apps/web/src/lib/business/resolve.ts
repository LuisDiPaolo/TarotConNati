import "server-only";

import type { NextRequest } from "next/server";
import { buildBrandAssetUrl } from "@/lib/storage/public-url";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ResolvedBusiness = {
  id: string;
  timezone: string;
  currency: string;
  locale: string;
  brandPrimary: string;
  brandAccent: string;
  themeBackground: string;
  brandRadius: string;
  defaultThemeMode: "light" | "brand" | "dark";
  logoUrl?: string | null;
  logoLightUrl?: string | null;
  logoDarkUrl?: string | null;
  publicAppIconUrl?: string | null;
  panelAppIconUrl?: string | null;
  maskableIconUrl?: string | null;
  appleTouchIconUrl?: string | null;
};

function normalizeHostname(value: string | null) {
  const raw = value ?? "";
  const [hostname = ""] = raw.split(":");
  return hostname.toLowerCase();
}

export function getRequestHostname(request: NextRequest) {
  return normalizeHostname(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
}

type BusinessRow = {
  id: string;
  timezone: string;
  currency: string;
  locale: string;
  brand_primary: string;
  brand_accent: string;
  theme_background?: string | null;
  brand_radius: string;
  default_theme_mode?: "light" | "brand" | "dark" | null;
  logo_url?: string | null;
  logo_light_url?: string | null;
  logo_dark_url?: string | null;
  public_app_icon_url?: string | null;
  panel_app_icon_url?: string | null;
  maskable_icon_url?: string | null;
  apple_touch_icon_url?: string | null;
};

function mapBusiness(row: BusinessRow): ResolvedBusiness {
  return {
    id: row.id,
    timezone: row.timezone,
    currency: row.currency,
    locale: row.locale,
    brandPrimary: row.brand_primary,
    brandAccent: row.brand_accent,
    themeBackground: row.theme_background ?? row.brand_primary,
    brandRadius: row.brand_radius,
    defaultThemeMode: row.default_theme_mode ?? "light",
    logoUrl: buildBrandAssetUrl(row.logo_url),
    logoLightUrl: buildBrandAssetUrl(row.logo_light_url),
    logoDarkUrl: buildBrandAssetUrl(row.logo_dark_url),
    publicAppIconUrl: buildBrandAssetUrl(row.public_app_icon_url),
    panelAppIconUrl: buildBrandAssetUrl(row.panel_app_icon_url),
    maskableIconUrl: buildBrandAssetUrl(row.maskable_icon_url),
    appleTouchIconUrl: buildBrandAssetUrl(row.apple_touch_icon_url),
  };
}

export async function resolveBusinessForHostname(hostname: string): Promise<ResolvedBusiness | null> {
  const normalizedHostname = normalizeHostname(hostname);
  const supabase = createSupabaseAdminClient();

  const { data: exactMatch, error: exactError } = await supabase
    .from("business")
    .select("id, timezone, currency, locale, brand_primary, brand_accent, theme_background, brand_radius, default_theme_mode, logo_url, logo_light_url, logo_dark_url, public_app_icon_url, panel_app_icon_url, maskable_icon_url, apple_touch_icon_url")
    .or(`public_domain.eq.${normalizedHostname},panel_domain.eq.${normalizedHostname}`)
    .maybeSingle();

  if (!exactError && exactMatch) return mapBusiness(exactMatch as BusinessRow);

  const { data: fallback, error: fallbackError } = await supabase
    .from("business")
    .select("id, timezone, currency, locale, brand_primary, brand_accent, theme_background, brand_radius, default_theme_mode, logo_url, logo_light_url, logo_dark_url, public_app_icon_url, panel_app_icon_url, maskable_icon_url, apple_touch_icon_url")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallbackError || !fallback) return null;
  return mapBusiness(fallback as BusinessRow);
}

export async function resolveBusinessForRequest(request: NextRequest): Promise<ResolvedBusiness | null> {
  return resolveBusinessForHostname(getRequestHostname(request));
}
