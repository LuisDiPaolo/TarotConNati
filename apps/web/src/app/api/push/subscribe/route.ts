import { apiError } from "@/shared";
import { NextResponse, type NextRequest } from "next/server";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { hashPushEndpoint, isValidPushSubscription, resolvePushSurface } from "@/lib/push/subscription";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PushTarget = {
  appointmentId?: unknown;
  serviceRequestId?: unknown;
};

function readId(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { subscription?: unknown; surface?: unknown; target?: PushTarget } | null;
  const subscription = body?.subscription;

  if (!isValidPushSubscription(subscription)) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Suscripcion push invalida."), { status: 400 });
  }

  const business = await resolveBusinessForRequest(request);
  if (!business) {
    return NextResponse.json(apiError("NOT_FOUND", "No se encontro el negocio para este hostname."), { status: 404 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: pushFeature, error: featureError } = await supabase
    .from("features")
    .select("enabled")
    .eq("business_id", business.id)
    .eq("feature_key", "push_enabled")
    .maybeSingle();

  if (featureError) {
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo validar el modulo push."), { status: 500 });
  }

  if (pushFeature?.enabled === false) {
    return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "El servicio de notificaciones esta desactivado para este negocio."), { status: 403 });
  }

  const surface = resolvePushSurface(body?.surface);
  const appointmentId = readId(body?.target?.appointmentId);
  const serviceRequestId = readId(body?.target?.serviceRequestId);
  let customerId: string | null = null;
  let linkedAppointmentId: string | null = null;
  let linkedServiceRequestId: string | null = null;

  if (surface === "public" && appointmentId) {
    const { data: appointment } = await supabase
      .from("appointments")
      .select("id, customer_id")
      .eq("business_id", business.id)
      .eq("id", appointmentId)
      .maybeSingle();

    if (appointment?.id && appointment.customer_id) {
      linkedAppointmentId = appointment.id;
      customerId = appointment.customer_id;
    }
  }

  if (surface === "public" && serviceRequestId) {
    const { data: serviceRequest } = await supabase
      .from("service_requests")
      .select("id, customer_id")
      .eq("business_id", business.id)
      .eq("id", serviceRequestId)
      .maybeSingle();

    if (serviceRequest?.id && serviceRequest.customer_id) {
      linkedServiceRequestId = serviceRequest.id;
      customerId = serviceRequest.customer_id;
    }
  }

  const endpointHash = hashPushEndpoint(subscription.endpoint);
  if (!customerId && !linkedAppointmentId && !linkedServiceRequestId) {
    const { data: existingSubscription } = await supabase
      .from("push_subscriptions")
      .select("customer_id, appointment_id, service_request_id")
      .eq("endpoint_hash", endpointHash)
      .maybeSingle();

    customerId = existingSubscription?.customer_id ?? null;
    linkedAppointmentId = existingSubscription?.appointment_id ?? null;
    linkedServiceRequestId = existingSubscription?.service_request_id ?? null;
  }

  const { error } = await supabase.from("push_subscriptions").upsert({
    business_id: business.id,
    surface,
    endpoint: subscription.endpoint,
    endpoint_hash: endpointHash,
    subscription,
    customer_id: customerId,
    appointment_id: linkedAppointmentId,
    service_request_id: linkedServiceRequestId,
    user_agent: request.headers.get("user-agent") ?? "",
    last_seen_at: new Date().toISOString(),
    disabled_at: null,
  }, { onConflict: "endpoint_hash" });

  if (error) {
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo guardar la suscripcion push."), { status: 500 });
  }

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
