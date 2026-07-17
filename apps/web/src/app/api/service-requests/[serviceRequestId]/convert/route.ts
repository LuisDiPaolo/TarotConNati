import { NextResponse } from "next/server";
import { calculateAppointmentEnd } from "@/shared";
import { sendTransactionalPush } from "@/lib/push/transactional";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(_request: Request, context: { params: Promise<{ serviceRequestId: string }> }) {
  const { serviceRequestId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { data: serviceRequest, error: readError } = await supabase
    .from("service_requests")
    .select("id, business_id, customer_id, service_id, status, customer_notes, preferred_date, services(duration_minutes, name)")
    .eq("id", serviceRequestId)
    .maybeSingle();

  if (readError || !serviceRequest) return apiError(404, "NOT_FOUND", "Solicitud no encontrada.");
  if (serviceRequest.status === "converted") return apiError(400, "VALIDATION_ERROR", "La solicitud ya fue convertida.");
  if (serviceRequest.status === "cancelled" || serviceRequest.status === "closed") {
    return apiError(400, "VALIDATION_ERROR", "Solo se pueden convertir solicitudes activas.");
  }

  const serviceJoin = Array.isArray(serviceRequest.services) ? serviceRequest.services[0] : serviceRequest.services;
  const durationMinutes = Number(serviceJoin?.duration_minutes ?? 30);
  const startsAt = new Date();
  const endsAt = calculateAppointmentEnd(startsAt, durationMinutes);

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      business_id: serviceRequest.business_id,
      customer_id: serviceRequest.customer_id,
      service_id: serviceRequest.service_id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      calendar_starts_at: startsAt.toISOString(),
      calendar_ends_at: endsAt.toISOString(),
      status: "confirmed",
      notes: serviceRequest.customer_notes || "Convertido desde solicitud sin horario.",
    })
    .select("id")
    .single();

  if (appointmentError || !appointment) return apiError(400, "VALIDATION_ERROR", "No se pudo crear el turno operativo.");

  const { data: intakeRows } = await supabase
    .from("service_request_intake_responses")
    .select("business_id, form_id, form_snapshot, response")
    .eq("service_request_id", serviceRequestId);

  if ((intakeRows ?? []).length > 0) {
    await supabase.from("appointment_intake_responses").insert((intakeRows ?? []).map((row) => ({
      business_id: row.business_id,
      appointment_id: appointment.id,
      form_id: row.form_id,
      form_snapshot: row.form_snapshot,
      response: row.response,
    })));
  }

  const { error: updateError } = await supabase
    .from("service_requests")
    .update({
      status: "converted",
      converted_appointment_id: appointment.id,
      admin_notes: "Convertida en turno operativo sin bloqueo de agenda.",
    })
    .eq("id", serviceRequestId);

  if (updateError) return apiError(400, "VALIDATION_ERROR", "No se pudo marcar la solicitud como convertida.");

  await sendTransactionalPush({
    businessId: serviceRequest.business_id,
    eventKey: `service_request.converted.panel.${serviceRequestId}.${appointment.id}`,
    eventType: "service_request.converted",
    sourceTable: "service_requests",
    sourceId: serviceRequestId,
    surface: "panel",
    payload: {
      title: "Solicitud convertida",
      body: `Turno operativo creado para ${String(serviceJoin?.name ?? "servicio")}`,
      url: "/",
      tag: "service-request-converted",
    },
  });

  await sendTransactionalPush({
    businessId: serviceRequest.business_id,
    eventKey: `service_request.converted.public.${serviceRequestId}.${appointment.id}`,
    eventType: "service_request.converted",
    sourceTable: "service_requests",
    sourceId: serviceRequestId,
    surface: "public",
    customerId: serviceRequest.customer_id,
    serviceRequestId,
    payload: {
      title: "Tu solicitud ya tiene turno",
      body: `Turno creado para ${String(serviceJoin?.name ?? "servicio")}`,
      url: "/?tab=history",
      tag: "service-request-converted",
    },
  });

  return NextResponse.json({ appointmentId: appointment.id, status: "converted" });
}
