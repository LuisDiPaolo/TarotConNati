import { NextRequest, NextResponse } from "next/server";
import { FEATURE_CATALOG, apiError, isFeatureKey, type FeatureKey } from "@/shared";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ADMIN_TOGGLEABLE_FEATURES = new Set<FeatureKey>([
  "products_enabled",
  "portfolio_enabled",
  "promotions_enabled",
  "coupons_enabled",
  "gift_cards_enabled",
  "inquiries_enabled",
  "push_campaigns_enabled",
]);

function featureCatalogItem(featureKey: FeatureKey) {
  return FEATURE_CATALOG.find((feature) => feature.key === featureKey);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const featureKey = typeof body?.featureKey === "string" ? body.featureKey : "";
  const enabled = typeof body?.enabled === "boolean" ? body.enabled : null;

  if (!isFeatureKey(featureKey) || enabled === null || !ADMIN_TOGGLEABLE_FEATURES.has(featureKey)) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Modulo invalido."), { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });

  const adminSupabase = createSupabaseAdminClient();
  const { data: adminUser, error: adminError } = await adminSupabase
    .from("admin_users")
    .select("business_id, role")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !adminUser?.business_id) return NextResponse.json(apiError("UNAUTHORIZED", "Admin no encontrado."), { status: 401 });
  if (!["owner", "admin"].includes(String(adminUser.role))) {
    return NextResponse.json(apiError("UNAUTHORIZED", "No tenes permisos para cambiar modulos."), { status: 403 });
  }

  const catalogItem = featureCatalogItem(featureKey);
  if (!catalogItem) return NextResponse.json(apiError("VALIDATION_ERROR", "Modulo invalido."), { status: 400 });

  const { error } = await adminSupabase.from("features").upsert({
    business_id: adminUser.business_id,
    feature_key: featureKey,
    enabled,
    pack: catalogItem.pack,
    requires_migration: catalogItem.requiresMigration,
  }, { onConflict: "business_id,feature_key" });

  if (error) return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo actualizar el modulo."), { status: 500 });
  return NextResponse.json({ data: { featureKey, enabled } });
}
