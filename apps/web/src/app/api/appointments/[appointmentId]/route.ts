import { NextRequest, NextResponse } from "next/server";
import { canTransitionAppointment, updateAppointmentStatusSchema, type AppointmentStatus } from "@turnos/shared";
import { sendTransactionalPush } from "@/lib/push/transactional";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
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
    .select("id, business_id, status")
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

  await sendTransactionalPush({
    businessId: appointment.business_id,
    eventKey: `appointment.status.${appointmentId}.${parsed.data.status}`,
    eventType: "appointment.status_changed",
    sourceTable: "appointments",
    sourceId: appointmentId,
    surface: "panel",
    payload: {
      title: "Turno actualizado",
      body: `Estado: ${parsed.data.status}`,
      url: "/panel",
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
