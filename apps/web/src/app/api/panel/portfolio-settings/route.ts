import { NextResponse, type NextRequest } from "next/server";
import { apiError, portfolioSectionSettingsSchema } from "@/shared";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
    p_feature_key: "portfolio_enabled",
  });

  return { supabase, businessId: businessId as string, enabled: Boolean(enabled) };
}

export async function PATCH(request: NextRequest) {
  const parsed = portfolioSectionSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Revisa el titulo de la seccion."), { status: 400 });
  }

  const { businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Portfolio no esta activo para este negocio."), { status: 403 });

  const adminSupabase = createSupabaseAdminClient();
  const { error } = await adminSupabase
    .from("business")
    .update({ portfolio_section_title: parsed.data.title })
    .eq("id", businessId);

  if (error) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo guardar el titulo de portfolio."), { status: 400 });
  }

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
