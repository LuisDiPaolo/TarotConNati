import { NextRequest, NextResponse } from "next/server";
import { weeklyScheduleSchema } from "@/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  const parsed = weeklyScheduleSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Revisa el horario.");

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("business_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (!adminUser) return apiError(401, "UNAUTHORIZED", "Admin no encontrado.");

  const input = parsed.data;
  const { data, error } = await supabase
    .from("schedules")
    .insert({
      business_id: adminUser.business_id,
      weekday: input.weekday,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      break_starts_at: input.breakStartsAt || null,
      break_ends_at: input.breakEndsAt || null,
      active: input.active,
    })
    .select("id")
    .single();

  if (error || !data) return apiError(400, "VALIDATION_ERROR", "No se pudo crear el horario.");

  return NextResponse.json({ id: data.id });
}
