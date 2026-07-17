import { NextRequest, NextResponse } from "next/server";
import { scheduleOverrideSchema } from "@/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  const parsed = scheduleOverrideSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Revisa la excepcion de agenda.");

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
    .from("schedule_overrides")
    .upsert({
      business_id: adminUser.business_id,
      override_date: input.overrideDate,
      starts_at: input.closed ? null : input.startsAt || null,
      ends_at: input.closed ? null : input.endsAt || null,
      closed: input.closed,
      reason: input.reason || null,
    }, { onConflict: "business_id,override_date" })
    .select("id")
    .single();

  if (error || !data) return apiError(400, "VALIDATION_ERROR", "No se pudo guardar la excepcion.");

  return NextResponse.json({ id: data.id });
}
