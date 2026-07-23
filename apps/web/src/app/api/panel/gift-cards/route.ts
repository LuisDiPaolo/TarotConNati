import { randomUUID } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError } from "@/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const panelGiftCardSchema = z.object({
  serviceId: z.string().uuid(),
  purchaserName: z.string().trim().min(2).max(120),
  purchaserPhone: z.string().trim().min(6).max(40),
  purchaserEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
  recipientName: z.string().trim().min(2).max(120),
  recipientPhone: z.string().trim().max(40).optional().or(z.literal("")),
  recipientEmail: z.string().trim().email().max(160).optional().or(z.literal("")),
  message: z.string().trim().max(500).optional().or(z.literal("")),
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

function createGiftCardCode() {
  return `GC-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const parsed = panelGiftCardSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(apiError("VALIDATION_ERROR", "Revisa los datos de la gift card."), { status: 400 });

  const { supabase, businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Gift cards no esta activo para este negocio."), { status: 403 });

  const input = parsed.data;
  const { data: service } = await supabase
    .from("services")
    .select("id, price_pesos")
    .eq("id", input.serviceId)
    .eq("business_id", businessId)
    .eq("active", true)
    .maybeSingle();

  if (!service || service.price_pesos <= 0) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Selecciona un servicio activo con precio."), { status: 400 });
  }

  let giftCardId = "";
  let giftCardCode = "";
  for (let attempt = 0; attempt < 4 && !giftCardId; attempt += 1) {
    const code = createGiftCardCode();
    const { data, error } = await supabase
      .from("gift_cards")
      .insert({
        business_id: businessId,
        service_id: input.serviceId,
        purchaser_name: input.purchaserName,
        purchaser_phone: input.purchaserPhone,
        purchaser_email: input.purchaserEmail || null,
        recipient_name: input.recipientName,
        recipient_phone: input.recipientPhone || null,
        recipient_email: input.recipientEmail || null,
        message: input.message || null,
        code,
        amount_pesos: service.price_pesos,
        status: "active",
        activated_at: new Date().toISOString(),
        expires_at: input.expiresAt || null,
      })
      .select("id, code")
      .single();

    if (!error && data?.id) {
      giftCardId = data.id;
      giftCardCode = data.code;
    }
  }

  if (!giftCardId) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo crear la gift card."), { status: 400 });
  }

  return NextResponse.json({ data: { id: giftCardId, code: giftCardCode } }, { headers: { "Cache-Control": "no-store" } });
}
