import { NextResponse, type NextRequest } from "next/server";
import { apiError, productSettingsSchema } from "@/shared";
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
    p_feature_key: "products_enabled",
  });

  return { supabase, businessId: businessId as string, enabled: Boolean(enabled) };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ productId: string }> }) {
  const { productId } = await context.params;
  const parsed = productSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Revisa los datos del producto."), { status: 400 });
  }

  const { supabase, businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Productos no esta activo para este negocio."), { status: 403 });

  const input = parsed.data;
  const { error } = await supabase
    .from("products")
    .update({
      name: input.name,
      description: input.description || null,
      category: input.category || null,
      price_pesos: input.pricePesos,
      stock_quantity: input.stockQuantity ?? null,
      active: input.active,
      sort_order: input.sortOrder,
    })
    .eq("id", productId)
    .eq("business_id", businessId);

  if (error) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo guardar el producto."), { status: 400 });
  }

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ productId: string }> }) {
  const { productId } = await context.params;
  const { supabase, businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Productos no esta activo para este negocio."), { status: 403 });

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("business_id", businessId);

  if (error) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo quitar el producto."), { status: 400 });
  }

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
