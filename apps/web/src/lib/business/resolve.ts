import "server-only";

import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ResolvedBusiness = {
  id: string;
  timezone: string;
  currency: string;
  locale: string;
};

function normalizeHostname(value: string | null) {
  const raw = value ?? "";
  const [hostname = ""] = raw.split(":");
  return hostname.toLowerCase();
}

export function getRequestHostname(request: NextRequest) {
  return normalizeHostname(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
}

export async function resolveBusinessForHostname(hostname: string): Promise<ResolvedBusiness | null> {
  const normalizedHostname = normalizeHostname(hostname);
  const supabase = createSupabaseAdminClient();

  const { data: exactMatch, error: exactError } = await supabase
    .from("business")
    .select("id, timezone, currency, locale")
    .or(`public_domain.eq.${normalizedHostname},panel_domain.eq.${normalizedHostname}`)
    .maybeSingle();

  if (!exactError && exactMatch) return exactMatch as ResolvedBusiness;

  const { data: fallback, error: fallbackError } = await supabase
    .from("business")
    .select("id, timezone, currency, locale")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (fallbackError || !fallback) return null;
  return fallback as ResolvedBusiness;
}

export async function resolveBusinessForRequest(request: NextRequest): Promise<ResolvedBusiness | null> {
  return resolveBusinessForHostname(getRequestHostname(request));
}
