import { NextRequest, NextResponse } from "next/server";
import { updateServiceRequestSchema } from "@turnos/shared";
import { sendTransactionalPush } from "@/lib/push/transactional";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedTransitions: Record<string, string[]> = {
  pending_review: ["pending_coordination", "closed", "cancelled"],
  pending_coordination: ["pending_review", "closed", "cancelled"],
  converted: [],
  closed: ["pending_review"],
  cancelled: ["pending_review"],
};

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function getServiceRequestStatusLabel(status: string) {
  if (status === "pending_review") return "en revision";
  if (status === "pending_coordination") return "en coordinacion";
  if (status === "converted") return "convertida en turno";
  if (status === "closed") return "cerrada";
  if (status === "cancelled") return "cancelada";
  return status;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ serviceRequestId: string }> }) {
  const { serviceRequestId } = await context.params;
  const parsed = updateServiceRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Estado invalido.");

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { data: serviceRequest, error: readError } = await supabase
    .from("service_requests")
    .select("id, business_id, customer_id, service_id, status, services(name)")
    .eq("id", serviceRequestId)
    .maybeSingle();

  if (readError || !serviceRequest) return apiError(404, "NOT_FOUND", "Solicitud no encontrada.");

  const currentStatus = String(serviceRequest.status);
  const nextStatus = parsed.data.status;
  if (currentStatus !== nextStatus && !allowedTransitions[currentStatus]?.includes(nextStatus)) {
    return apiError(400, "VALIDATION_ERROR", "Transicion de estado no permitida.");
  }

  const { error: updateError } = await supabase
    .from("service_requests")
    .update({
      status: nextStatus,
      admin_notes: parsed.data.adminNotes || null,
    })
    .eq("id", serviceRequestId);

  if (updateError) return apiError(400, "VALIDATION_ERROR", "No se pudo actualizar la solicitud.");

  const serviceJoin = Array.isArray(serviceRequest.services) ? serviceRequest.services[0] : serviceRequest.services;
  const statusLabel = getServiceRequestStatusLabel(nextStatus);
  const serviceName = String(serviceJoin?.name ?? "solicitud");

  await sendTransactionalPush({
    businessId: serviceRequest.business_id,
    eventKey: `service_request.status.panel.${serviceRequestId}.${nextStatus}`,
    eventType: "service_request.status_changed",
    sourceTable: "service_requests",
    sourceId: serviceRequestId,
    surface: "panel",
    payload: {
      title: "Solicitud actualizada",
      body: `${serviceName}: ${statusLabel}`,
      url: "/solicitudes",
      tag: "service-request-status",
    },
  });

  await sendTransactionalPush({
    businessId: serviceRequest.business_id,
    eventKey: `service_request.status.public.${serviceRequestId}.${nextStatus}`,
    eventType: "service_request.status_changed",
    sourceTable: "service_requests",
    sourceId: serviceRequestId,
    surface: "public",
    customerId: serviceRequest.customer_id,
    serviceRequestId,
    payload: {
      title: "Tu solicitud fue actualizada",
      body: `${serviceName}: ${statusLabel}`,
      url: "/?tab=notifications",
      tag: "service-request-status",
    },
  });

  return NextResponse.json({ ok: true });
}
