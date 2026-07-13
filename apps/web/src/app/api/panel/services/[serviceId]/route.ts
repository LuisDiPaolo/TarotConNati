import { NextRequest, NextResponse } from "next/server";
import { serviceSettingsSchema } from "@turnos/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await context.params;
  const parsed = serviceSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Revisa los datos del servicio.");

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const input = parsed.data;
  const { error } = await supabase
    .from("services")
    .update({
      name: input.name,
      description: input.description || null,
      category: input.category || null,
      service_modality: input.serviceModality,
      scheduling_policy: input.schedulingPolicy,
      duration_minutes: input.durationMinutes,
      buffer_before_minutes: input.bufferBeforeMinutes,
      buffer_after_minutes: input.bufferAfterMinutes,
      blocks_calendar: input.blocksCalendar,
      arrival_instructions: input.arrivalInstructions || null,
      virtual_instructions: input.virtualInstructions || null,
      requires_manual_confirmation: input.requiresManualConfirmation,
      price_cents: input.priceCents,
      deposit_cents: input.depositCents,
      payment_mode: input.paymentMode,
      active: input.active,
      sort_order: input.sortOrder,
    })
    .eq("id", serviceId);

  if (error) return apiError(400, "VALIDATION_ERROR", "No se pudo actualizar el servicio.");

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { error } = await supabase
    .from("services")
    .update({ active: false })
    .eq("id", serviceId);

  if (error) return apiError(400, "VALIDATION_ERROR", "No se pudo borrar el servicio.");

  return NextResponse.json({ ok: true });
}
