import { NextResponse, type NextRequest } from "next/server";
import { apiError, updateInquirySchema } from "@/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedTransitions: Record<string, string[]> = {
  new: ["read", "routed_whatsapp", "archived"],
  read: ["new", "routed_whatsapp", "archived"],
  routed_whatsapp: ["read", "archived"],
  archived: ["new", "read"],
};

async function getAdminContext() {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { supabase, businessId: null, enabled: false };

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("business_id")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  const businessId = adminUser?.business_id ?? null;
  if (!businessId) return { supabase, businessId: null, enabled: false };

  const { data: enabled } = await supabase.rpc("has_feature", {
    p_business_id: businessId,
    p_feature_key: "inquiries_enabled",
  });

  return { supabase, businessId: businessId as string, enabled: Boolean(enabled) };
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ inquiryId: string }> }) {
  const { inquiryId } = await context.params;
  const parsed = updateInquirySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Estado invalido."), { status: 400 });
  }

  const { supabase, businessId, enabled } = await getAdminContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });
  if (!enabled) return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Consultas no esta activo para este negocio."), { status: 403 });

  const { data: inquiry, error: readError } = await supabase
    .from("inquiries")
    .select("id, status")
    .eq("id", inquiryId)
    .eq("business_id", businessId)
    .maybeSingle();

  if (readError || !inquiry) {
    return NextResponse.json(apiError("NOT_FOUND", "Consulta no encontrada."), { status: 404 });
  }

  const currentStatus = String(inquiry.status);
  const nextStatus = parsed.data.status;
  if (currentStatus !== nextStatus && !allowedTransitions[currentStatus]?.includes(nextStatus)) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Transicion de estado no permitida."), { status: 400 });
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("inquiries")
    .update({
      status: nextStatus,
      admin_notes: parsed.data.adminNotes || null,
      routed_whatsapp_at: nextStatus === "routed_whatsapp" ? now : null,
      archived_at: nextStatus === "archived" ? now : null,
    })
    .eq("id", inquiryId)
    .eq("business_id", businessId);

  if (updateError) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo actualizar la consulta."), { status: 400 });
  }

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
