import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError } from "@/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const updateProductOrderSchema = z.object({
  status: z.enum(["paid", "cancelled", "fulfilled"]),
});

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

export async function PATCH(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params;
  const parsed = updateProductOrderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Estado invalido."), { status: 400 });
  }

  const { supabase, businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Productos no esta activo para este negocio."), { status: 403 });

  const status = parsed.data.status;
  if (status === "paid" || status === "fulfilled") {
    const { data: stockResult, error: stockError } = await supabase.rpc("confirm_product_order_stock", {
      p_business_id: businessId,
      p_order_id: orderId,
    });
    const typedStockResult = stockResult as { ok?: boolean; code?: string } | null;
    if (stockError || !typedStockResult?.ok) {
      return NextResponse.json(apiError("VALIDATION_ERROR", typedStockResult?.code === "insufficient_stock" ? "No hay stock suficiente para marcar esta compra." : "No se pudo validar el stock de la compra."), { status: 409 });
    }
  }

  if (status === "cancelled") {
    await supabase.rpc("release_product_order_stock", {
      p_business_id: businessId,
      p_order_id: orderId,
    });
  }

  const { error } = await supabase
    .from("product_orders")
    .update({
      status,
      fulfilled_at: status === "fulfilled" ? new Date().toISOString() : null,
      cancelled_at: status === "cancelled" ? new Date().toISOString() : null,
    })
    .eq("id", orderId)
    .eq("business_id", businessId);

  if (error) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo actualizar la compra."), { status: 400 });
  }

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
