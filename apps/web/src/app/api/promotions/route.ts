import { apiError } from "@turnos/shared";
import { NextResponse, type NextRequest } from "next/server";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const business = await resolveBusinessForRequest(request);
  if (!business) {
    return NextResponse.json(apiError("NOT_FOUND", "No se encontro el negocio para este hostname."), { status: 404 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: enabled, error: featureError } = await supabase.rpc("has_feature", {
    p_business_id: business.id,
    p_feature_key: "promotions_enabled",
  });

  if (featureError) {
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo validar promociones."), { status: 500 });
  }

  if (!enabled) return NextResponse.json({ data: [] }, { headers: { "Cache-Control": "no-store" } });

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("promotions")
    .select("id, title, description, discount_type, discount_value, starts_at, ends_at")
    .eq("business_id", business.id)
    .eq("active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudieron leer promociones."), { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
