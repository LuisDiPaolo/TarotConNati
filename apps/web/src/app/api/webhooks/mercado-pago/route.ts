import { apiError } from "@/shared";
import { NextResponse, type NextRequest } from "next/server";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { confirmCheckoutCoupon, releaseCheckoutCoupon } from "@/lib/commerce/coupons";
import { getMercadoPagoPayment, verifyMercadoPagoWebhookSignature } from "@/lib/payments/mercado-pago";
import { sendTransactionalPush } from "@/lib/push/transactional";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type MercadoPagoWebhookPayload = {
  id?: string | number;
  type?: string;
  action?: string;
  topic?: string;
  data?: { id?: string | number };
};

type PaymentRow = {
  id: string;
  business_id: string;
  appointment_id: string | null;
  product_order_id: string | null;
  gift_card_id: string | null;
  amount_pesos: number;
  currency: string;
  status: string;
};

type StockOperationResult = {
  ok?: boolean;
  code?: string;
};

type CouponLinkedRow = {
  id: string;
  customer_id: string | null;
  coupon_id: string | null;
  discount_pesos: number | null;
};

function stringifyPaymentId(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function extractPaymentId(request: NextRequest, payload: MercadoPagoWebhookPayload): string | null {
  return stringifyPaymentId(request.nextUrl.searchParams.get("id")) ||
    stringifyPaymentId(payload.data?.id) ||
    stringifyPaymentId(payload.id);
}

function getEventType(request: NextRequest, payload: MercadoPagoWebhookPayload) {
  return payload.action || payload.type || payload.topic || request.nextUrl.searchParams.get("topic") || "payment";
}

function normalizePaymentStatus(status: string): PaymentRow["status"] | null {
  if (status === "approved") return "approved";
  if (status === "rejected") return "rejected";
  if (status === "cancelled") return "cancelled";
  if (status === "refunded" || status === "charged_back") return "refunded";
  return null;
}

export async function POST(request: NextRequest) {
  if (!process.env.MP_WEBHOOK_SECRET || !process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json(apiError("INTERNAL_ERROR", "Mercado Pago no esta configurado."), { status: 503 });
  }

  const payload = await request.json().catch(() => ({})) as MercadoPagoWebhookPayload;
  const dataId = extractPaymentId(request, payload);
  if (!dataId) return NextResponse.json({ data: { ok: true, ignored: true } });

  const xSignature = request.headers.get("x-signature") ?? "";
  const xRequestId = request.headers.get("x-request-id") ?? "";
  const validSignature = verifyMercadoPagoWebhookSignature({
    xSignature,
    xRequestId,
    dataId,
    secret: process.env.MP_WEBHOOK_SECRET,
  });

  if (!validSignature) {
    return NextResponse.json(apiError("PAYMENT_WEBHOOK_INVALID_SIGNATURE", "Firma invalida."), { status: 401 });
  }

  const business = await resolveBusinessForRequest(request);
  if (!business) {
    return NextResponse.json(apiError("NOT_FOUND", "No se encontro el negocio para este hostname."), { status: 404 });
  }

  const supabase = createSupabaseAdminClient();
  const eventType = getEventType(request, payload);
  const eventKey = `mercado_pago:${eventType}:${xRequestId || "no_request"}:${dataId}`;

  const { error: insertError } = await supabase.from("payment_webhook_events").insert({
    business_id: business.id,
    provider: "mercado_pago",
    event_key: eventKey,
    external_id: dataId,
    request_id: xRequestId || null,
    event_type: eventType,
    payload,
    processed: false,
  });

  if (insertError?.code === "23505") {
    return NextResponse.json({ data: { ok: true, duplicate: true } });
  }

  if (insertError) {
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo registrar el webhook."), { status: 500 });
  }

  const mercadoPagoPayment = await getMercadoPagoPayment(dataId, process.env.MP_ACCESS_TOKEN);
  const externalReference = mercadoPagoPayment.external_reference;
  const nextStatus = normalizePaymentStatus(mercadoPagoPayment.status);

  if (!externalReference || !nextStatus) {
    await supabase.from("payment_webhook_events").update({ processed: true, processed_at: new Date().toISOString() }).eq("event_key", eventKey);
    return NextResponse.json({ data: { ok: true, ignored: true } });
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, business_id, appointment_id, product_order_id, gift_card_id, amount_pesos, currency, status")
    .eq("business_id", business.id)
    .eq("external_reference", externalReference)
    .maybeSingle();

  if (paymentError || !payment) {
    await supabase.from("payment_webhook_events").update({ error: "payment_not_found" }).eq("event_key", eventKey);
    return NextResponse.json({ data: { ok: true, ignored: true } });
  }

  const typedPayment = payment as PaymentRow;
  const amountMatches = typedPayment.amount_pesos === Math.round(mercadoPagoPayment.transaction_amount);
  const currencyMatches = typedPayment.currency === mercadoPagoPayment.currency_id;

  if (!amountMatches || !currencyMatches) {
    await supabase.from("payment_webhook_events").update({ error: "payment_mismatch" }).eq("event_key", eventKey);
    return NextResponse.json({ data: { ok: true, ignored: true } });
  }

  await supabase
    .from("payments")
    .update({ status: nextStatus, provider_payment_id: String(mercadoPagoPayment.id) })
    .eq("id", typedPayment.id)
    .eq("business_id", business.id);

  if (typedPayment.appointment_id) {
    const { data: linkedAppointment } = await supabase
      .from("appointments")
      .select("id, customer_id, coupon_id, discount_pesos")
      .eq("id", typedPayment.appointment_id)
      .eq("business_id", business.id)
      .maybeSingle();
    const appointmentCoupon = linkedAppointment as CouponLinkedRow | null;

    if (nextStatus === "approved") {
      await supabase
        .from("appointments")
        .update({ status: "confirmed" })
        .eq("id", typedPayment.appointment_id)
        .eq("business_id", business.id)
        .eq("status", "pending");

      if (appointmentCoupon?.coupon_id && (appointmentCoupon.discount_pesos ?? 0) > 0) {
        await confirmCheckoutCoupon({
          supabase,
          businessId: business.id,
          couponId: appointmentCoupon.coupon_id,
          appointmentId: typedPayment.appointment_id,
        });
      }
    }

    if ((nextStatus === "cancelled" || nextStatus === "rejected" || nextStatus === "refunded") && appointmentCoupon?.coupon_id) {
      await releaseCheckoutCoupon({
        supabase,
        businessId: business.id,
        couponId: appointmentCoupon.coupon_id,
        appointmentId: typedPayment.appointment_id,
      });
    }
  }

  if (typedPayment.product_order_id) {
    const { data: linkedOrder } = await supabase
      .from("product_orders")
      .select("id, customer_id, coupon_id, discount_pesos")
      .eq("id", typedPayment.product_order_id)
      .eq("business_id", business.id)
      .maybeSingle();
    const orderCoupon = linkedOrder as CouponLinkedRow | null;
    const shouldCancelOrder = nextStatus === "cancelled" || nextStatus === "rejected" || nextStatus === "refunded";
    let orderStatus = nextStatus === "approved" ? "paid" : shouldCancelOrder ? "cancelled" : "pending_payment";

    if (nextStatus === "approved") {
      const { data: stockResult, error: stockError } = await supabase.rpc("confirm_product_order_stock", {
        p_business_id: business.id,
        p_order_id: typedPayment.product_order_id,
      });
      const typedStockResult = stockResult as StockOperationResult | null;
      if (stockError || !typedStockResult?.ok) {
        orderStatus = "stock_conflict";
        await supabase.from("payment_webhook_events").update({ error: typedStockResult?.code ?? "stock_confirmation_failed" }).eq("event_key", eventKey);
      } else if (orderCoupon?.coupon_id && (orderCoupon.discount_pesos ?? 0) > 0) {
        await confirmCheckoutCoupon({
          supabase,
          businessId: business.id,
          couponId: orderCoupon.coupon_id,
          productOrderId: typedPayment.product_order_id,
        });
      }
    }

    if (shouldCancelOrder) {
      await supabase.rpc("release_product_order_stock", {
        p_business_id: business.id,
        p_order_id: typedPayment.product_order_id,
      });

      if (orderCoupon?.coupon_id) {
        await releaseCheckoutCoupon({
          supabase,
          businessId: business.id,
          couponId: orderCoupon.coupon_id,
          productOrderId: typedPayment.product_order_id,
        });
      }
    }

    await supabase
      .from("product_orders")
      .update({ status: orderStatus, cancelled_at: shouldCancelOrder ? new Date().toISOString() : null })
      .eq("id", typedPayment.product_order_id)
      .eq("business_id", business.id);
  }

  if (typedPayment.gift_card_id) {
    const shouldCancelGiftCard = nextStatus === "cancelled" || nextStatus === "rejected" || nextStatus === "refunded";
    if (nextStatus === "approved") {
      await supabase
        .from("gift_cards")
        .update({ status: "active", activated_at: new Date().toISOString(), cancelled_at: null })
        .eq("id", typedPayment.gift_card_id)
        .eq("business_id", business.id)
        .eq("status", "pending_payment");
    }

    if (shouldCancelGiftCard) {
      await supabase
        .from("gift_cards")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", typedPayment.gift_card_id)
        .eq("business_id", business.id)
        .in("status", ["pending_payment", "active"]);
    }
  }

  const { data: appointment } = typedPayment.appointment_id ? await supabase
    .from("appointments")
    .select("id, customer_id")
    .eq("business_id", business.id)
    .eq("id", typedPayment.appointment_id)
    .maybeSingle() : { data: null };

  const panelUrl = typedPayment.appointment_id ? `/turnos/${typedPayment.appointment_id}` : typedPayment.gift_card_id ? "/promociones" : "/productos";
  const publicUrl = typedPayment.appointment_id ? "/?tab=history" : typedPayment.gift_card_id ? "/?giftcard=status" : "/?purchase=status";
  const paymentTitle = nextStatus === "approved" ? "Pago aprobado" : "Pago actualizado";

  await sendTransactionalPush({
    businessId: business.id,
    eventKey: `payment.status.panel.${typedPayment.id}.${nextStatus}`,
    eventType: "payment.status_changed",
    sourceTable: "payments",
    sourceId: typedPayment.id,
    surface: "panel",
    payload: {
      title: paymentTitle,
      body: `Estado de pago: ${nextStatus}`,
      url: panelUrl,
      tag: "payment-status",
    },
  });

  if (typedPayment.appointment_id) {
    await sendTransactionalPush({
      businessId: business.id,
      eventKey: `payment.status.public.${typedPayment.id}.${nextStatus}`,
      eventType: "payment.status_changed",
      sourceTable: "payments",
      sourceId: typedPayment.id,
      surface: "public",
      customerId: appointment?.customer_id,
      appointmentId: typedPayment.appointment_id,
      payload: {
        title: paymentTitle,
        body: `Estado de pago: ${nextStatus}`,
        url: publicUrl,
        tag: "payment-status",
      },
    });
  }

  await supabase
    .from("payment_webhook_events")
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq("event_key", eventKey);

  return NextResponse.json({ data: { ok: true } });
}
