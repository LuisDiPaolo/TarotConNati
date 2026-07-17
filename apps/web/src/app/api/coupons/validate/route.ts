import { apiError, normalizeCouponCode } from "@/shared";
import { NextResponse, type NextRequest } from "next/server";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const code = normalizeCouponCode(request.nextUrl.searchParams.get("code") ?? "");
  if (!code) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Codigo de cupon requerido."), { status: 400 });
  }

  const business = await resolveBusinessForRequest(request);
  if (!business) {
    return NextResponse.json(apiError("NOT_FOUND", "No se encontro el negocio para este hostname."), { status: 404 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: enabled, error: featureError } = await supabase.rpc("has_feature", {
    p_business_id: business.id,
    p_feature_key: "coupons_enabled",
  });

  if (featureError) {
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo validar cupones."), { status: 500 });
  }

  if (!enabled) {
    return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Cupones no esta habilitado para este negocio."), { status: 403 });
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, description, discount_type, discount_value, starts_at, ends_at, usage_limit, used_count")
    .eq("business_id", business.id)
    .eq("code", code)
    .eq("active", true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .maybeSingle();

  if (error) {
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo validar el cupon."), { status: 500 });
  }

  if (!data || (data.usage_limit !== null && data.used_count >= data.usage_limit)) {
    return NextResponse.json(apiError("NOT_FOUND", "Cupon no disponible."), { status: 404 });
  }

  return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
}
