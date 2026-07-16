import "server-only";

import type { NextRequest } from "next/server";
import {
  isConfiguredPanelHost,
  isConfiguredPublicHost,
  isLocalBusinessHost,
  normalizeConfiguredDomain,
} from "@/lib/business/instance";
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

export function normalizeBusinessHostname(value: string | null) {
  return normalizeConfiguredDomain((value ?? "").split(",")[0]);
}

export function isSafeBusinessFallbackHost(hostname: string) {
  return isLocalBusinessHost(hostname) || isConfiguredPublicHost(hostname) || isConfiguredPanelHost(hostname);
}

export function getRequestHostname(request: NextRequest) {
  return normalizeBusinessHostname(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
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

const BUSINESS_SELECT = "id, timezone, currency, locale, brand_primary, brand_accent, theme_background, brand_radius, default_theme_mode, logo_url, logo_light_url, logo_dark_url, public_app_icon_url, panel_app_icon_url, maskable_icon_url, apple_touch_icon_url";

export async function resolveBusinessForHostname(hostname: string): Promise<ResolvedBusiness | null> {
  const normalizedHostname = normalizeBusinessHostname(hostname);
  const supabase = createSupabaseAdminClient();

  if (!isSafeBusinessFallbackHost(normalizedHostname)) return null;

  const { data: fallbackRows, error: fallbackError } = await supabase
    .from("business")
    .select(BUSINESS_SELECT)
    .order("created_at", { ascending: true })
    .limit(2);

  if (fallbackError || !fallbackRows?.length) return null;

  const rows = fallbackRows as BusinessRow[];
  if (rows.length === 1) return mapBusiness(rows[0]!);

  return null;
}

export async function resolveBusinessForRequest(request: NextRequest): Promise<ResolvedBusiness | null> {
  return resolveBusinessForHostname(getRequestHostname(request));
}
