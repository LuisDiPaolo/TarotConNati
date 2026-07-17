import { apiError, DEFAULT_RESERVATION_CUTOFF_MINUTES, serializeBusinessHoursConfig } from "@/shared";
import { NextResponse, type NextRequest } from "next/server";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type RuntimeConfigRow = {
  key: string;
  value: string;
};

const DEFAULT_PUBLIC_CONFIG = {
  reservations_enabled: "true",
  public_pwa_enabled: "true",
  panel_pwa_enabled: "true",
  push_enabled: "false",
  maintenance_mode: "false",
  business_hours: serializeBusinessHoursConfig(),
  reservation_cutoff_minutes: String(DEFAULT_RESERVATION_CUTOFF_MINUTES),
} as const;

export async function GET(request: NextRequest) {
  const business = await resolveBusinessForRequest(request);
  if (!business) {
    return NextResponse.json(apiError("NOT_FOUND", "No se encontro el negocio para este hostname."), { status: 404 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: rows, error } = await supabase
    .from("app_runtime_config")
    .select("key, value")
    .eq("business_id", business.id)
    .eq("public_readable", true);

  if (error) {
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo leer runtime config."), { status: 500 });
  }

  const config: Record<string, string> = { ...DEFAULT_PUBLIC_CONFIG };
  for (const row of (rows ?? []) as RuntimeConfigRow[]) {
    config[row.key] = row.value;
  }

  return NextResponse.json({ data: config }, { headers: { "Cache-Control": "no-store" } });
}
