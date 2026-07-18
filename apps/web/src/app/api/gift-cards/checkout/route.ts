import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { apiError, publicGiftCardCheckoutSchema } from "@/shared";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { getRequestBaseUrl } from "@/lib/http/base-url";
import { createMercadoPagoPreference } from "@/lib/payments/mercado-pago";
import { sendTransactionalPush } from "@/lib/push/transactional";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT_MAX = 6;
const giftCardAttempts = new Map<string, { count: number; resetAt: number }>();

type ServiceRow = {
  id: string;
  name: string;
  price_pesos: number;
};

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function enforceRateLimit(key: string) {
  const now = Date.now();
  const current = giftCardAttempts.get(key);
  if (!current || current.resetAt <= now) {
    giftCardAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) return false;
  current.count += 1;
  return true;
}

function createGiftCardCode() {
  return `GC-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const business = await resolveBusinessForRequest(request);
  if (!business) return NextResponse.json(apiError("NOT_FOUND", "No se encontro el negocio para esta solicitud."), { status: 404 });

  const rateLimitKey = `${business.id}:gift-card:${getClientIp(request)}`;
  if (!enforceRateLimit(rateLimitKey)) {
    return NextResponse.json(apiError("RATE_LIMITED", "Demasiados intentos de compra. Proba de nuevo en unos minutos."), { status: 429 });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(apiError("PAYMENT_PROVIDER_NOT_CONFIGURED", "El pago online no esta configurado para gift cards."), { status: 503 });
  }

  const parsed = publicGiftCardCheckoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(apiError("VALIDATION_ERROR", "Revisa los datos de la gift card."), { status: 400 });

  const supabase = createSupabaseAdminClient();
  const { data: enabled } = await supabase.rpc("has_feature", {
    p_business_id: business.id,
    p_feature_key: "gift_cards_enabled",
  });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Gift cards no esta activo para este negocio."), { status: 403 });

  const input = parsed.data;
  const { data: serviceData, error: serviceError } = await supabase
    .from("services")
    .select("id, name, price_pesos")
    .eq("business_id", business.id)
    .eq("id", input.serviceId)
    .eq("active", true)
    .maybeSingle();

  if (serviceError || !serviceData) return NextResponse.json(apiError("NOT_FOUND", "El servicio elegido no esta disponible."), { status: 404 });
  const service = serviceData as ServiceRow;
  if (service.price_pesos <= 0) return NextResponse.json(apiError("VALIDATION_ERROR", "Este servicio no tiene precio para emitir gift card."), { status: 400 });

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      business_id: business.id,
      full_name: input.purchaser.fullName,
      phone: input.purchaser.phone,
      email: input.purchaser.email || null,
      notes: input.message || null,
    })
    .select("id")
    .single();

  if (customerError || !customer) return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo registrar al comprador."), { status: 500 });

  let giftCardId: string | null = null;
  let giftCardCode = "";
  for (let attempt = 0; attempt < 3 && !giftCardId; attempt += 1) {
    giftCardCode = createGiftCardCode();
    const { data: giftCard, error: giftCardError } = await supabase
      .from("gift_cards")
      .insert({
        business_id: business.id,
        service_id: service.id,
        purchaser_customer_id: customer.id,
        purchaser_name: input.purchaser.fullName,
        purchaser_phone: input.purchaser.phone,
        purchaser_email: input.purchaser.email || null,
        recipient_name: input.recipient.fullName,
        recipient_phone: input.recipient.phone || null,
        recipient_email: input.recipient.email || null,
        message: input.message || null,
        code: giftCardCode,
        amount_pesos: service.price_pesos,
        currency: business.currency,
        status: "pending_payment",
      })
      .select("id")
      .single();

    if (giftCard) giftCardId = giftCard.id;
    else if (giftCardError?.code !== "23505") break;
  }

  if (!giftCardId) return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo crear la gift card."), { status: 500 });

  const externalReference = `gift_card:${giftCardId}`;
  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .insert({
      business_id: business.id,
      gift_card_id: giftCardId,
      amount_pesos: service.price_pesos,
      currency: business.currency,
      status: "pending",
      external_reference: externalReference,
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    await supabase.from("gift_cards").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", giftCardId).eq("business_id", business.id);
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo registrar el pago."), { status: 500 });
  }

  await supabase.from("gift_cards").update({ payment_id: payment.id }).eq("id", giftCardId).eq("business_id", business.id);

  try {
    const origin = getRequestBaseUrl(request);
    const preference = await createMercadoPagoPreference({
      accessToken,
      title: `Gift card - ${service.name}`,
      quantity: 1,
      unitPrice: service.price_pesos,
      externalReference,
      notificationUrl: `${origin}/api/webhooks/mercado-pago`,
      backUrls: {
        success: `${origin}/?giftcard=success`,
        failure: `${origin}/?giftcard=failure`,
        pending: `${origin}/?giftcard=pending`,
      },
    });

    const checkoutUrl = preference.init_point ?? preference.sandbox_init_point ?? null;
    await supabase
      .from("payments")
      .update({ provider_preference_id: preference.id, checkout_url: checkoutUrl })
      .eq("id", payment.id)
      .eq("business_id", business.id);

    await sendTransactionalPush({
      businessId: business.id,
      eventKey: `gift_card.created.${giftCardId}`,
      eventType: "gift_card.created",
      sourceTable: "gift_cards",
      sourceId: giftCardId,
      surface: "panel",
      payload: {
        title: "Gift card pendiente de pago",
        body: `${service.name} - ${input.purchaser.fullName}`,
        url: "/promociones",
        tag: "gift-card-created",
      },
    });

    return NextResponse.json({ data: { giftCardId, code: giftCardCode, checkoutUrl } }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await supabase.from("payments").update({ status: "cancelled" }).eq("id", payment.id).eq("business_id", business.id);
    await supabase.from("gift_cards").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", giftCardId).eq("business_id", business.id);
    return NextResponse.json(apiError("PAYMENT_PROVIDER_ERROR", "No se pudo iniciar el pago."), { status: 502 });
  }
}
