import { NextRequest, NextResponse } from "next/server";
import { businessSettingsSchema, type BusinessSettingsInput } from "@turnos/shared";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function businessPayload(input: BusinessSettingsInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description || null,
    whatsapp_phone: input.whatsappPhone || null,
    public_domain: input.publicDomain || null,
    public_app_name: input.publicAppName || null,
    panel_app_name: input.panelAppName || null,
    public_short_name: input.publicShortName || null,
    panel_short_name: input.panelShortName || null,
    onboarding_status: input.onboardingStatus,
    brand_primary: input.brandPrimary,
    brand_accent: input.brandAccent,
    theme_background: input.themeBackground,
    brand_radius: input.brandRadius,
    default_theme_mode: input.defaultThemeMode,
    public_bottom_nav_enabled: input.publicBottomNavEnabled,
  };
}

async function syncPushNotifications(
  adminSupabase: ReturnType<typeof createSupabaseAdminClient>,
  businessId: string,
  enabled: boolean,
) {
  const { error: featureError } = await adminSupabase.from("features").upsert({
    business_id: businessId,
    feature_key: "push_enabled",
    enabled,
    pack: "profesional",
    requires_migration: true,
  }, { onConflict: "business_id,feature_key" });

  if (featureError) return featureError;

  const { error: runtimeError } = await adminSupabase.from("app_runtime_config").upsert({
    business_id: businessId,
    key: "push_enabled",
    value: enabled ? "true" : "false",
    public_readable: true,
  }, { onConflict: "business_id,key" });

  return runtimeError;
}

export async function PATCH(request: NextRequest) {
  const parsed = businessSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Revisa la configuracion del negocio.");

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const adminSupabase = createSupabaseAdminClient();
  const { data: adminUser, error: adminError } = await adminSupabase
    .from("admin_users")
    .select("id, business_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (adminError) return apiError(401, "UNAUTHORIZED", "Admin no encontrado.");

  const input = parsed.data;
  const payload = businessPayload(input);

  if (adminUser?.business_id) {
    const { error } = await adminSupabase
      .from("business")
      .update(payload)
      .eq("id", adminUser.business_id);

    if (error) return apiError(400, "VALIDATION_ERROR", "No se pudo actualizar el negocio.");

    const pushError = await syncPushNotifications(adminSupabase, adminUser.business_id, input.notificationsEnabled);
    if (pushError) return apiError(400, "VALIDATION_ERROR", "No se pudo guardar la configuracion de notificaciones.");

    return NextResponse.json({ ok: true, mode: "updated" });
  }

  const { data: business, error: createBusinessError } = await adminSupabase
    .from("business")
    .insert(payload)
    .select("id")
    .single();

  if (createBusinessError || !business) return apiError(400, "VALIDATION_ERROR", "No se pudo crear el negocio.");

  const pushError = await syncPushNotifications(adminSupabase, business.id, input.notificationsEnabled);
  if (pushError) return apiError(400, "VALIDATION_ERROR", "No se pudo guardar la configuracion de notificaciones.");

  if (adminUser?.id) {
    const { error: linkError } = await adminSupabase
      .from("admin_users")
      .update({ business_id: business.id })
      .eq("id", adminUser.id);

    if (linkError) return apiError(400, "VALIDATION_ERROR", "No se pudo asociar el negocio al admin.");
  } else {
    const { error: createAdminError } = await adminSupabase
      .from("admin_users")
      .insert({
        auth_user_id: userData.user.id,
        email: userData.user.email ?? input.name,
        full_name: typeof userData.user.user_metadata?.full_name === "string" ? userData.user.user_metadata.full_name : null,
        role: "owner",
        business_id: business.id,
      });

    if (createAdminError) return apiError(400, "VALIDATION_ERROR", "No se pudo crear el admin del negocio.");
  }

  return NextResponse.json({ ok: true, mode: "created", businessId: business.id });
}
