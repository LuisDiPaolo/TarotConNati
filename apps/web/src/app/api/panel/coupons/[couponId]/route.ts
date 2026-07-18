import { NextResponse, type NextRequest } from "next/server";
import { apiError, couponSettingsSchema, normalizeCouponCode, type CouponSettingsInput } from "@/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getAdminContext() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { supabase, businessId: null, enabled: false };

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("business_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  const businessId = adminUser?.business_id ?? null;
  if (!businessId) return { supabase, businessId: null, enabled: false };

  const { data: enabled } = await supabase.rpc("has_feature", {
    p_business_id: businessId,
    p_feature_key: "coupons_enabled",
  });

  return { supabase, businessId: businessId as string, enabled: Boolean(enabled) };
}

function couponPayload(input: CouponSettingsInput) {
  return {
    code: normalizeCouponCode(input.code),
    description: input.description || null,
    discount_type: input.discountType,
    discount_value: input.discountType === "two_for_one" ? 0 : input.discountValue,
    applies_to_services: input.appliesToServices,
    applies_to_products: input.appliesToProducts,
    validity_type: input.validityType,
    valid_on_date: input.validityType === "single_date" ? input.validOnDate : null,
    valid_weekdays: input.validityType === "weekly" ? Array.from(new Set(input.validWeekdays)).sort((a, b) => a - b) : [],
    starts_on: input.validityType === "range" ? input.startsOn : null,
    ends_on: input.validityType === "range" ? input.endsOn : null,
    starts_at: null,
    ends_at: null,
    usage_limit: input.usageLimit ?? null,
    active: input.active,
  };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ couponId: string }> }) {
  const { couponId } = await context.params;
  const parsed = couponSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(apiError("VALIDATION_ERROR", "Revisa los datos del cupon."), { status: 400 });

  const { supabase, businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Cupones no esta activo para este negocio."), { status: 403 });

  const payload = couponPayload(parsed.data);
  if (!payload.code) return NextResponse.json(apiError("VALIDATION_ERROR", "Codigo de cupon requerido."), { status: 400 });

  const { error } = await supabase
    .from("coupons")
    .update(payload)
    .eq("id", couponId)
    .eq("business_id", businessId);

  if (error?.code === "23505") return NextResponse.json(apiError("VALIDATION_ERROR", "Ya existe un cupon con ese codigo."), { status: 409 });
  if (error) return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo guardar el cupon."), { status: 400 });

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ couponId: string }> }) {
  const { couponId } = await context.params;
  const { supabase, businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Cupones no esta activo para este negocio."), { status: 403 });

  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", couponId)
    .eq("business_id", businessId);

  if (error) return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo borrar el cupon."), { status: 400 });

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
