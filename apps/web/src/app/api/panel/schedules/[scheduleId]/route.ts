import { NextRequest, NextResponse } from "next/server";
import { weeklyScheduleSchema } from "@/shared";
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

export async function PATCH(request: NextRequest, context: { params: Promise<{ scheduleId: string }> }) {
  const { scheduleId } = await context.params;
  const parsed = weeklyScheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Revisa el horario.");

  const { supabase, authorized } = await requireAdminSupabase();
  if (!authorized) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const input = parsed.data;
  const { error } = await supabase
    .from("schedules")
    .update({
      weekday: input.weekday,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      break_starts_at: input.breakStartsAt || null,
      break_ends_at: input.breakEndsAt || null,
      active: input.active,
    })
    .eq("id", scheduleId);

  if (error) return apiError(400, "VALIDATION_ERROR", "No se pudo actualizar la agenda.");

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ scheduleId: string }> }) {
  const { scheduleId } = await context.params;
  const { supabase, authorized } = await requireAdminSupabase();
  if (!authorized) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { error } = await supabase.from("schedules").delete().eq("id", scheduleId);
  if (error) return apiError(400, "VALIDATION_ERROR", "No se pudo borrar el horario.");

  return NextResponse.json({ ok: true });
}
