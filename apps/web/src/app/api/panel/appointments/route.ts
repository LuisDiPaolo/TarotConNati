import { NextRequest, NextResponse } from "next/server";
import { calculateAppointmentEnd, createPanelAppointmentSchema } from "@turnos/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function getAdminBusinessId() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { supabase, businessId: null };

  const { data } = await supabase
    .from("admin_users")
    .select("business_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  return { supabase, businessId: data?.business_id ?? null };
}

export async function POST(request: NextRequest) {
  const parsed = createPanelAppointmentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Revisa los datos del turno.");

  const { supabase, businessId } = await getAdminBusinessId();
  if (!businessId) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const input = parsed.data;
  const startsAt = new Date(input.startsAt);
  if (Number.isNaN(startsAt.getTime())) return apiError(400, "VALIDATION_ERROR", "Fecha invalida.");

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, duration_minutes, buffer_before_minutes, buffer_after_minutes, blocks_calendar")
    .eq("business_id", businessId)
    .eq("id", input.serviceId)
    .maybeSingle();

  if (serviceError || !service) return apiError(404, "NOT_FOUND", "Servicio no encontrado.");

  const endsAt = calculateAppointmentEnd(startsAt, Number(service.duration_minutes));
  const blocksCalendar = service.blocks_calendar ?? true;
  const calendarStartsAt = blocksCalendar ? new Date(startsAt.getTime() - Number(service.buffer_before_minutes ?? 0) * 60_000) : startsAt;
  const calendarEndsAt = blocksCalendar ? new Date(endsAt.getTime() + Number(service.buffer_after_minutes ?? 0) * 60_000) : endsAt;

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      business_id: businessId,
      full_name: input.customer.fullName,
      phone: input.customer.phone,
      email: input.customer.email || null,
      notes: input.customer.notes || null,
    })
    .select("id")
    .single();

  if (customerError || !customer) return apiError(400, "VALIDATION_ERROR", "No se pudo crear el cliente.");

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      business_id: businessId,
      customer_id: customer.id,
      service_id: service.id,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      calendar_starts_at: calendarStartsAt.toISOString(),
      calendar_ends_at: calendarEndsAt.toISOString(),
      status: input.status,
      notes: input.customer.notes || null,
    })
    .select("id")
    .single();

  if (appointmentError || !appointment) return apiError(400, "VALIDATION_ERROR", "No se pudo crear el turno.");

  return NextResponse.json({ id: appointment.id });
}
