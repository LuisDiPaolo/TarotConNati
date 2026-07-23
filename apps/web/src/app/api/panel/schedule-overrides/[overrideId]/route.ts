import { NextRequest, NextResponse } from "next/server";
import { scheduleOverrideSchema } from "@/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

async function requireAdminSupabase() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { supabase, authorized: false };
  return { supabase, authorized: true };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ overrideId: string }> }) {
  const { overrideId } = await context.params;
  const parsed = scheduleOverrideSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Revisa la excepcion de agenda.");

  const { supabase, authorized } = await requireAdminSupabase();
  if (!authorized) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const input = parsed.data;
  const { error } = await supabase
    .from("schedule_overrides")
    .update({
      override_date: input.overrideDate,
      starts_at: input.closed ? null : input.startsAt || null,
      ends_at: input.closed ? null : input.endsAt || null,
      closed: input.closed,
      reason: input.reason || null,
    })
    .eq("id", overrideId);

  if (error) return apiError(400, "VALIDATION_ERROR", "No se pudo actualizar la excepcion.");

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ overrideId: string }> }) {
  const { overrideId } = await context.params;
  const { supabase, authorized } = await requireAdminSupabase();
  if (!authorized) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { error } = await supabase.from("schedule_overrides").delete().eq("id", overrideId);
  if (error) return apiError(400, "VALIDATION_ERROR", "No se pudo borrar la excepcion.");

  return NextResponse.json({ ok: true });
}
