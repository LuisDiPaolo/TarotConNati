import { NextRequest, NextResponse } from "next/server";
import { canTransitionAppointment, updateAppointmentStatusSchema, type AppointmentStatus } from "@/shared";
import { sendTransactionalPush } from "@/lib/push/transactional";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function getAppointmentStatusLabel(status: string) {
  if (status === "confirmed") return "confirmado";
  if (status === "pending") return "pendiente";
  if (status === "cancelled") return "cancelado";
  if (status === "completed") return "realizado";
  if (status === "no_show") return "ausente";
  return status;
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await context.params;
  const parsed = updateAppointmentStatusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Estado invalido.");

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { data: appointment, error: readError } = await supabase
    .from("appointments")
    .select("id, business_id, customer_id, status, services(name)")
    .eq("id", appointmentId)
    .maybeSingle();

  if (readError || !appointment) return apiError(404, "NOT_FOUND", "Turno no encontrado.");

  if (!canTransitionAppointment(appointment.status as AppointmentStatus, parsed.data.status)) {
    return apiError(400, "VALIDATION_ERROR", "Transicion de estado no permitida.");
  }

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: parsed.data.status })
    .eq("id", appointmentId);

  if (updateError) return apiError(400, "VALIDATION_ERROR", "No se pudo actualizar el turno.");

  await supabase.from("appointment_status_events").insert({
    business_id: appointment.business_id,
    appointment_id: appointmentId,
    from_status: appointment.status,
    to_status: parsed.data.status,
    reason: parsed.data.reason || null,
    created_by: userData.user.id,
  });

  const serviceJoin = Array.isArray(appointment.services) ? appointment.services[0] : appointment.services;
  const statusLabel = getAppointmentStatusLabel(parsed.data.status);
  const serviceName = String(serviceJoin?.name ?? "turno");

  await sendTransactionalPush({
    businessId: appointment.business_id,
    eventKey: `appointment.status.panel.${appointmentId}.${parsed.data.status}`,
    eventType: "appointment.status_changed",
    sourceTable: "appointments",
    sourceId: appointmentId,
    surface: "panel",
    payload: {
      title: "Turno actualizado",
      body: `${serviceName}: ${statusLabel}`,
      url: "/",
      tag: "appointment-status",
    },
  });

  await sendTransactionalPush({
    businessId: appointment.business_id,
    eventKey: `appointment.status.public.${appointmentId}.${parsed.data.status}`,
    eventType: "appointment.status_changed",
    sourceTable: "appointments",
    sourceId: appointmentId,
    surface: "public",
    customerId: appointment.customer_id,
    appointmentId,
    payload: {
      title: "Tu turno fue actualizado",
      body: `${serviceName}: ${statusLabel}`,
      url: "/?tab=history",
      tag: "appointment-status",
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ appointmentId: string }> }) {
  const { appointmentId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { error } = await supabase
    .from("appointments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (error) return apiError(400, "VALIDATION_ERROR", "No se pudo borrar el turno.");

  return NextResponse.json({ ok: true });
}
