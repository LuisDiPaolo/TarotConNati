import { NextResponse, type NextRequest } from "next/server";
import { apiError, portfolioItemSchema } from "@/shared";
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

export async function PATCH(request: NextRequest, context: { params: Promise<{ portfolioItemId: string }> }) {
  const { portfolioItemId } = await context.params;
  const parsed = portfolioItemSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Revisa los datos del item."), { status: 400 });
  }

  const { supabase, businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Portfolio no esta activo para este negocio."), { status: 403 });

  const input = parsed.data;
  const { error } = await supabase
    .from("portfolio_items")
    .update({
      title: input.title || null,
      description: input.description || null,
      category: input.category || null,
      instagram_url: input.instagramUrl || null,
      active: input.active,
      sort_order: input.sortOrder,
    })
    .eq("id", portfolioItemId)
    .eq("business_id", businessId);

  if (error) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo guardar el item de portfolio."), { status: 400 });
  }

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ portfolioItemId: string }> }) {
  const { portfolioItemId } = await context.params;
  const { supabase, businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Portfolio no esta activo para este negocio."), { status: 403 });

  const { error } = await supabase
    .from("portfolio_items")
    .delete()
    .eq("id", portfolioItemId)
    .eq("business_id", businessId);

  if (error) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo quitar el item de portfolio."), { status: 400 });
  }

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
