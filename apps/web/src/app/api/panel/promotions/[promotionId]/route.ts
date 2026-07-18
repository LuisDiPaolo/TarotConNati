import { NextResponse, type NextRequest } from "next/server";
import { apiError, promotionSettingsSchema } from "@/shared";
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
    p_feature_key: "promotions_enabled",
  });

  return { supabase, businessId: businessId as string, enabled: Boolean(enabled) };
}

function toDateValue(value: string | undefined) {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "invalid";
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ promotionId: string }> }) {
  const { promotionId } = await context.params;
  const parsed = promotionSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(apiError("VALIDATION_ERROR", "Revisa los datos de la promocion."), { status: 400 });

  const { supabase, businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Promociones no esta activo para este negocio."), { status: 403 });

  const input = parsed.data;
  const startsAt = toDateValue(input.startsAt);
  const endsAt = toDateValue(input.endsAt);
  if (startsAt === "invalid" || endsAt === "invalid") return NextResponse.json(apiError("VALIDATION_ERROR", "Revisa las fechas de vigencia."), { status: 400 });

  const { error } = await supabase
    .from("promotions")
    .update({
      title: input.title,
      description: input.description || null,
      discount_type: input.discountType,
      discount_value: input.discountValue,
      starts_at: startsAt,
      ends_at: endsAt,
      active: input.active,
    })
    .eq("id", promotionId)
    .eq("business_id", businessId);

  if (error) return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo guardar la promocion."), { status: 400 });

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ promotionId: string }> }) {
  const { promotionId } = await context.params;
  const { supabase, businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Promociones no esta activo para este negocio."), { status: 403 });

  const { error } = await supabase
    .from("promotions")
    .delete()
    .eq("id", promotionId)
    .eq("business_id", businessId);

  if (error) return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo quitar la promocion."), { status: 400 });

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
