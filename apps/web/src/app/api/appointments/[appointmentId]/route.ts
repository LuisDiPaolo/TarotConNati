import { NextRequest, NextResponse } from "next/server";
import { canTransitionAppointment, updateAppointmentStatusSchema, type AppointmentStatus } from "@turnos/shared";
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
    .select("id, status")
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

  return NextResponse.json({ ok: true });
}
