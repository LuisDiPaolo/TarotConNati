import { NextRequest, NextResponse } from "next/server";
import { publicServiceRequestSchema } from "@/shared";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { buildValidatedIntakePayload, type IntakeLinkRow } from "@/lib/operations/intake-validation";
import { sendTransactionalPush } from "@/lib/push/transactional";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT_MAX = 6;
const requestAttempts = new Map<string, { count: number; resetAt: number }>();

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function enforceRateLimit(key: string) {
  const now = Date.now();
  const current = requestAttempts.get(key);
  if (!current || current.resetAt <= now) {
    requestAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) return false;
  current.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const business = await resolveBusinessForRequest(request);
  if (!business) return apiError(404, "NOT_FOUND", "No se encontro el negocio para esta solicitud.");

  const rateLimitKey = `${business.id}:service-request:${getClientIp(request)}`;
  if (!enforceRateLimit(rateLimitKey)) {
    return apiError(429, "RATE_LIMITED", "Demasiados intentos. Probá de nuevo en unos minutos.");
  }

  const parsed = publicServiceRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Revisá los datos de la solicitud.");

  const supabase = createSupabaseAdminClient();
  const { serviceId, customer, preferredDate, preferredWindow, contactChannel } = parsed.data;

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name, scheduling_policy, active")
    .eq("business_id", business.id)
    .eq("id", serviceId)
    .eq("active", true)
    .maybeSingle();

  if (serviceError || !service) return apiError(404, "NOT_FOUND", "El servicio elegido no está disponible.");
  if ((service.scheduling_policy ?? "scheduled") === "scheduled") {
    return apiError(400, "VALIDATION_ERROR", "Este servicio requiere elegir un horario disponible.");
  }

  const { data: intakeFormsData } = await supabase
    .from("service_intake_forms")
    .select("form_id, intake_forms(id, name, description, active, deleted_at, intake_form_fields(field_key, label, help_text, field_type, required, options, sort_order))")
    .eq("business_id", business.id)
    .eq("service_id", serviceId)
    .eq("active", true);

  const intakePayload = buildValidatedIntakePayload((intakeFormsData ?? []) as unknown as IntakeLinkRow[], parsed.data.intakeResponses ?? {});
  if (!intakePayload) return apiError(400, "VALIDATION_ERROR", "Revisa la informacion adicional de la solicitud.");

  const { data: createdCustomer, error: customerError } = await supabase
    .from("customers")
    .insert({
      business_id: business.id,
      full_name: customer.fullName,
      phone: customer.phone,
      email: customer.email || null,
      notes: customer.notes || null,
    })
    .select("id")
    .single();

  if (customerError || !createdCustomer) return apiError(500, "VALIDATION_ERROR", "No se pudo crear el cliente.");

  const { data: serviceRequest, error: serviceRequestError } = await supabase
    .from("service_requests")
    .insert({
      business_id: business.id,
      customer_id: createdCustomer.id,
      service_id: service.id,
      status: "pending_review",
      contact_channel: contactChannel,
      preferred_date: preferredDate || null,
      preferred_window: preferredWindow || null,
      customer_notes: customer.notes || null,
    })
    .select("id")
    .single();

  if (serviceRequestError || !serviceRequest) return apiError(500, "VALIDATION_ERROR", "No se pudo crear la solicitud.");

  if (intakePayload.length > 0) {
    const { error: intakeError } = await supabase.from("service_request_intake_responses").insert(intakePayload.map((item) => ({
      business_id: business.id,
      service_request_id: serviceRequest.id,
      form_id: item.formId,
      form_snapshot: item.formSnapshot,
      response: item.response,
    })));

    if (intakeError) return apiError(500, "VALIDATION_ERROR", "No se pudo guardar la informacion adicional.");
  }

  await sendTransactionalPush({
    businessId: business.id,
    eventKey: `service_request.created.${serviceRequest.id}`,
    eventType: "service_request.created",
    sourceTable: "service_requests",
    sourceId: serviceRequest.id,
    surface: "panel",
    payload: {
      title: "Nueva solicitud",
      body: `${customer.fullName} solicito ${String(service.name)}`,
      url: "/solicitudes",
      tag: "service-request-created",
    },
  });

  return NextResponse.json({
    serviceRequestId: serviceRequest.id,
    customerId: createdCustomer.id,
    status: "pending_review",
  });
}
