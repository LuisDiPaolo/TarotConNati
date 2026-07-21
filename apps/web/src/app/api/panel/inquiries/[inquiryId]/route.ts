import { NextResponse, type NextRequest } from "next/server";
import { apiError, updateInquirySchema } from "@/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedTransitions: Record<string, string[]> = {
  new: ["read", "answered_panel", "answered_whatsapp", "archived"],
  read: ["new", "answered_panel", "answered_whatsapp", "archived"],
  answered_panel: ["read", "answered_whatsapp", "converted", "archived"],
  answered_whatsapp: ["read", "answered_panel", "converted", "archived"],
  converted: ["archived"],
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

  const currentStatus = String(inquiry.status) === "routed_whatsapp" ? "answered_whatsapp" : String(inquiry.status);
  const nextStatus = parsed.data.status;
  if (currentStatus !== nextStatus && !allowedTransitions[currentStatus]?.includes(nextStatus)) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Transicion de estado no permitida."), { status: 400 });
  }

  const now = new Date().toISOString();
  const patch: Record<string, string | null> = {
    status: nextStatus,
    admin_notes: parsed.data.adminNotes || null,
  };

  if (["read", "answered_panel", "answered_whatsapp", "converted", "archived"].includes(nextStatus)) {
    patch.read_at = now;
  }

  if (nextStatus === "answered_panel" || nextStatus === "answered_whatsapp") {
    patch.answered_at = now;
    patch.answered_channel = nextStatus === "answered_whatsapp" ? "whatsapp" : "panel";
  }

  if (nextStatus === "archived") patch.archived_at = now;
  if (nextStatus === "new") {
    patch.read_at = null;
    patch.archived_at = null;
  }

  const { error: updateError } = await supabase
    .from("inquiries")
    .update(patch)
    .eq("id", inquiryId)
    .eq("business_id", businessId);

  if (updateError && nextStatus === "answered_whatsapp") {
    const legacy = await supabase
      .from("inquiries")
      .update({
        status: "routed_whatsapp",
        admin_notes: parsed.data.adminNotes || null,
        routed_whatsapp_at: now,
      })
      .eq("id", inquiryId)
      .eq("business_id", businessId);

    if (!legacy.error) return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
  }

  if (updateError) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo actualizar la consulta."), { status: 400 });
  }

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
