import { NextRequest, NextResponse } from "next/server";
import { serviceSettingsSchema } from "@turnos/shared";
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
  const parsed = serviceSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Revisa los datos del servicio.");

  const { supabase, businessId } = await getAdminBusinessId();
  if (!businessId) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const input = parsed.data;
  const { data, error } = await supabase
    .from("services")
    .insert({
      business_id: businessId,
      name: input.name,
      description: input.description || null,
      category: input.category || null,
      duration_minutes: input.durationMinutes,
      price_cents: input.priceCents,
      deposit_cents: input.depositCents,
      payment_mode: input.paymentMode,
      active: input.active,
      sort_order: input.sortOrder,
    })
    .select("id")
    .single();

  if (error || !data) return apiError(400, "VALIDATION_ERROR", "No se pudo crear el servicio.");

  return NextResponse.json({ id: data.id });
}
