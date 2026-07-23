import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError } from "@/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const panelGiftCardUpdateSchema = z.object({
  purchaserName: z.string().trim().min(2).max(120),
  purchaserPhone: z.string().trim().min(6).max(40),
  purchaserEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
  recipientName: z.string().trim().min(2).max(120),
  recipientPhone: z.string().trim().max(40).optional().or(z.literal("")),
  recipientEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
  message: z.string().trim().max(500).optional().or(z.literal("")),
  status: z.enum(["pending_payment", "active", "redeemed", "cancelled", "expired"]),
  expiresAt: z.string().datetime({ offset: true }).optional().or(z.literal("")),
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
    p_feature_key: "gift_cards_enabled",
  });

  return { supabase, businessId: businessId as string, enabled: Boolean(enabled) };
}

function statusTimestamps(status: z.infer<typeof panelGiftCardUpdateSchema>["status"]) {
  const now = new Date().toISOString();
  if (status === "active") return { activated_at: now, redeemed_at: null, cancelled_at: null };
  if (status === "redeemed") return { redeemed_at: now, cancelled_at: null };
  if (status === "cancelled") return { cancelled_at: now };
  return {};
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ giftCardId: string }> }) {
  const { giftCardId } = await context.params;
  const parsed = panelGiftCardUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(apiError("VALIDATION_ERROR", "Revisa los datos de la gift card."), { status: 400 });

  const { supabase, businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Gift cards no esta activo para este negocio."), { status: 403 });

  const input = parsed.data;
  const { error } = await supabase
    .from("gift_cards")
    .update({
      purchaser_name: input.purchaserName,
      purchaser_phone: input.purchaserPhone,
      purchaser_email: input.purchaserEmail || null,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone || null,
      recipient_email: input.recipientEmail || null,
      message: input.message || null,
      status: input.status,
      expires_at: input.expiresAt || null,
      ...statusTimestamps(input.status),
    })
    .eq("id", giftCardId)
    .eq("business_id", businessId);

  if (error) return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo guardar la gift card."), { status: 400 });

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ giftCardId: string }> }) {
  const { giftCardId } = await context.params;
  const { supabase, businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Gift cards no esta activo para este negocio."), { status: 403 });

  const { error } = await supabase
    .from("gift_cards")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", giftCardId)
    .eq("business_id", businessId);

  if (error) return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo cancelar la gift card."), { status: 400 });

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
