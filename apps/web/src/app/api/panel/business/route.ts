import { NextRequest, NextResponse } from "next/server";
import { businessSettingsSchema } from "@turnos/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function PATCH(request: NextRequest) {
  const parsed = businessSettingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Revisa la configuracion del negocio.");

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("business_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !adminUser) return apiError(401, "UNAUTHORIZED", "Admin no encontrado.");

  const input = parsed.data;
  const { error } = await supabase
    .from("business")
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      whatsapp_phone: input.whatsappPhone || null,
      public_domain: input.publicDomain || null,
      brand_primary: input.brandPrimary,
      brand_accent: input.brandAccent,
      brand_radius: input.brandRadius,
    })
    .eq("id", adminUser.business_id);

  if (error) return apiError(400, "VALIDATION_ERROR", "No se pudo actualizar el negocio.");

  return NextResponse.json({ ok: true });
}
