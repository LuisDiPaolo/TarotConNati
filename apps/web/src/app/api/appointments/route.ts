import { NextRequest, NextResponse } from "next/server";
import { calculateAppointmentEnd, publicReservationSchema } from "@turnos/shared";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { buildValidatedIntakePayload, type IntakeLinkRow } from "@/lib/operations/intake-validation";
import { getRequestBaseUrl } from "@/lib/http/base-url";
import { createMercadoPagoPreference } from "@/lib/payments/mercado-pago";
import { sendTransactionalPush } from "@/lib/push/transactional";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT_MAX = 6;
const reservationAttempts = new Map<string, { count: number; resetAt: number }>();

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function enforceRateLimit(key: string) {
  const now = Date.now();
  const current = reservationAttempts.get(key);
  if (!current || current.resetAt <= now) {
    reservationAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) return false;
  current.count += 1;
  return true;
}

function overlaps(candidate: { startsAt: Date; endsAt: Date }, existing: Array<{ starts_at: string; ends_at: string; calendar_starts_at?: string | null; calendar_ends_at?: string | null }>) {
  return existing.some((appointment) => {
    const startsAt = new Date(appointment.calendar_starts_at ?? appointment.starts_at);
    const endsAt = new Date(appointment.calendar_ends_at ?? appointment.ends_at);
    return candidate.startsAt < endsAt && startsAt < candidate.endsAt;
  });
}

function calculateCalendarRange(input: { startsAt: Date; durationMinutes: number; bufferBeforeMinutes: number; bufferAfterMinutes: number }) {
  return {
    startsAt: new Date(input.startsAt.getTime() - input.bufferBeforeMinutes * 60_000),
    endsAt: new Date(input.startsAt.getTime() + (input.durationMinutes + input.bufferAfterMinutes) * 60_000),
  };
}

export async function POST(request: NextRequest) {
  const business = await resolveBusinessForRequest(request);
  if (!business) return apiError(404, "NOT_FOUND", "No se encontro el negocio para esta solicitud.");

  const rateLimitKey = `${business.id}:${getClientIp(request)}`;
  if (!enforceRateLimit(rateLimitKey)) {
    return apiError(429, "RATE_LIMITED", "Demasiados intentos de reserva. Probá de nuevo en unos minutos.");
  }

  const parsed = publicReservationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Revisá los datos de la reserva.");

  const supabase = createSupabaseAdminClient();
  const { serviceId, startsAt, customer } = parsed.data;
  const startsAtDate = new Date(startsAt);
  if (startsAtDate <= new Date()) return apiError(400, "VALIDATION_ERROR", "El horario elegido ya no está disponible.");

  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name, service_modality, scheduling_policy, duration_minutes, buffer_before_minutes, buffer_after_minutes, blocks_calendar, requires_manual_confirmation, deposit_cents, price_cents, payment_mode")
    .eq("business_id", business.id)
    .eq("id", serviceId)
    .eq("active", true)
    .maybeSingle();

  if (serviceError || !service) return apiError(404, "NOT_FOUND", "El servicio elegido no está disponible.");
  if ((service.scheduling_policy ?? "scheduled") !== "scheduled") {
    return apiError(400, "VALIDATION_ERROR", "Este servicio requiere coordinacion previa y no admite reserva automatica.");
  }

  const { data: intakeFormsData } = await supabase
    .from("service_intake_forms")
    .select("form_id, intake_forms(id, name, description, active, deleted_at, intake_form_fields(field_key, label, help_text, field_type, required, options, sort_order))")
    .eq("business_id", business.id)
    .eq("service_id", serviceId)
    .eq("active", true);

  const intakePayload = buildValidatedIntakePayload((intakeFormsData ?? []) as unknown as IntakeLinkRow[], parsed.data.intakeResponses ?? {});
  if (!intakePayload) return apiError(400, "VALIDATION_ERROR", "Revisa la informacion adicional de la reserva.");

  const endsAtDate = calculateAppointmentEnd(startsAtDate, Number(service.duration_minutes));
  const blocksCalendar = service.blocks_calendar ?? true;
  const calendarRange = blocksCalendar
    ? calculateCalendarRange({
      startsAt: startsAtDate,
      durationMinutes: Number(service.duration_minutes),
      bufferBeforeMinutes: Number(service.buffer_before_minutes ?? 0),
      bufferAfterMinutes: Number(service.buffer_after_minutes ?? 0),
    })
    : { startsAt: startsAtDate, endsAt: endsAtDate };
  const { data: existingAppointments } = await supabase
    .from("appointments")
    .select("starts_at, ends_at, calendar_starts_at, calendar_ends_at")
    .eq("business_id", business.id)
    .is("deleted_at", null)
    .neq("status", "cancelled")
    .lt("calendar_starts_at", calendarRange.endsAt.toISOString())
    .gt("calendar_ends_at", calendarRange.startsAt.toISOString());

  if (blocksCalendar && overlaps(calendarRange, existingAppointments ?? [])) {
    return apiError(409, "VALIDATION_ERROR", "Ese horario acaba de ocuparse. Elegí otro turno.");
  }

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

  const paymentMode = service.payment_mode ?? "deposit";
  const amountCents = paymentMode === "full"
    ? Number(service.price_cents)
    : paymentMode === "deposit"
      ? Number(service.deposit_cents)
      : 0;

  const { data: appointment, error: appointmentError } = await supabase
    .from("appointments")
    .insert({
      business_id: business.id,
      customer_id: createdCustomer.id,
      service_id: service.id,
      starts_at: startsAtDate.toISOString(),
      ends_at: endsAtDate.toISOString(),
      calendar_starts_at: calendarRange.startsAt.toISOString(),
      calendar_ends_at: calendarRange.endsAt.toISOString(),
      status: amountCents > 0 || service.requires_manual_confirmation ? "pending" : "confirmed",
      notes: customer.notes || null,
    })
    .select("id")
    .single();

  if (appointmentError || !appointment) return apiError(500, "VALIDATION_ERROR", "No se pudo crear el turno.");

  if (intakePayload.length > 0) {
    const { error: intakeError } = await supabase.from("appointment_intake_responses").insert(intakePayload.map((item) => ({
      business_id: business.id,
      appointment_id: appointment.id,
      form_id: item.formId,
      form_snapshot: item.formSnapshot,
      response: item.response,
    })));

    if (intakeError) return apiError(500, "VALIDATION_ERROR", "No se pudo guardar la informacion adicional.");
  }

  let checkoutUrl: string | null = null;

  if (amountCents > 0) {
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        business_id: business.id,
        appointment_id: appointment.id,
        amount_cents: amountCents,
        currency: business.currency,
        status: "pending",
        external_reference: appointment.id,
      })
      .select("id")
      .single();

    if (paymentError || !payment) return apiError(500, "VALIDATION_ERROR", "No se pudo registrar el pago.");

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (accessToken) {
      const origin = getRequestBaseUrl(request);
      const preference = await createMercadoPagoPreference({
        accessToken,
        title: `${paymentMode === "full" ? "Pago total" : "Seña"} - ${String(service.name)}`,
        quantity: 1,
        unitPrice: amountCents / 100,
        externalReference: appointment.id,
        notificationUrl: `${origin}/api/webhooks/mercado-pago`,
        backUrls: {
          success: `${origin}/?payment=success`,
          failure: `${origin}/?payment=failure`,
          pending: `${origin}/?payment=pending`,
        },
      });

      checkoutUrl = preference.init_point ?? preference.sandbox_init_point ?? null;
      await supabase
        .from("payments")
        .update({ provider_preference_id: preference.id, checkout_url: checkoutUrl })
        .eq("id", payment.id);
    }
  }

  await sendTransactionalPush({
    businessId: business.id,
    eventKey: `appointment.created.${appointment.id}`,
    eventType: "appointment.created",
    sourceTable: "appointments",
    sourceId: appointment.id,
    surface: "panel",
    payload: {
      title: amountCents > 0 ? "Reserva pendiente de pago" : "Nueva reserva",
      body: `${String(service.name)} - ${customer.fullName}`,
      url: `/panel/turnos/${appointment.id}`,
      tag: "appointment-created",
    },
  });

  return NextResponse.json({
    appointmentId: appointment.id,
    checkoutUrl,
    status: amountCents > 0 ? "pending_payment" : "confirmed",
  });
}
