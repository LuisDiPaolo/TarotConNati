import { apiError } from "@turnos/shared";
import { NextResponse, type NextRequest } from "next/server";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
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
  appointment_id: string;
  amount_pesos: number;
  currency: string;
  status: string;
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
  const appointmentId = mercadoPagoPayment.external_reference;
  const nextStatus = normalizePaymentStatus(mercadoPagoPayment.status);

  if (!appointmentId || !nextStatus) {
    await supabase.from("payment_webhook_events").update({ processed: true, processed_at: new Date().toISOString() }).eq("event_key", eventKey);
    return NextResponse.json({ data: { ok: true, ignored: true } });
  }

  const { data: payment, error: paymentError } = await supabase
    .from("payments")
    .select("id, business_id, appointment_id, amount_pesos, currency, status")
    .eq("business_id", business.id)
    .eq("appointment_id", appointmentId)
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

  if (nextStatus === "approved") {
    await supabase
      .from("appointments")
      .update({ status: "confirmed" })
      .eq("id", typedPayment.appointment_id)
      .eq("business_id", business.id)
      .eq("status", "pending");
  }

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, customer_id")
    .eq("business_id", business.id)
    .eq("id", typedPayment.appointment_id)
    .maybeSingle();

  await sendTransactionalPush({
    businessId: business.id,
    eventKey: `payment.status.panel.${typedPayment.id}.${nextStatus}`,
    eventType: "payment.status_changed",
    sourceTable: "payments",
    sourceId: typedPayment.id,
    surface: "panel",
    payload: {
      title: nextStatus === "approved" ? "Pago aprobado" : "Pago actualizado",
      body: `Estado de pago: ${nextStatus}`,
      url: `/turnos/${typedPayment.appointment_id}`,
      tag: "payment-status",
    },
  });

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
      title: nextStatus === "approved" ? "Pago aprobado" : "Pago actualizado",
      body: `Estado de pago: ${nextStatus}`,
      url: "/?tab=history",
      tag: "payment-status",
    },
  });

  await supabase
    .from("payment_webhook_events")
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq("event_key", eventKey);

  return NextResponse.json({ data: { ok: true } });
}
