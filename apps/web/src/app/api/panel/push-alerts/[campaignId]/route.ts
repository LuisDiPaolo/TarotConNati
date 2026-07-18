import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/shared";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminContext = {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  businessId: string;
};

async function getAdminContext(): Promise<AdminContext | null> {
  const sessionSupabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await sessionSupabase.auth.getUser();
  if (userError || !userData.user) return null;

  const supabase = createSupabaseAdminClient();
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("business_id, role")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !adminUser?.business_id || !["owner", "admin"].includes(String(adminUser.role))) return null;
  return { supabase, businessId: adminUser.business_id as string };
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = await context.params;
  const adminContext = await getAdminContext();
  if (!adminContext) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });

  const { data: campaign, error: readError } = await adminContext.supabase
    .from("push_alert_campaigns")
    .select("id, status")
    .eq("business_id", adminContext.businessId)
    .eq("id", campaignId)
    .maybeSingle();

  if (readError || !campaign) return NextResponse.json(apiError("NOT_FOUND", "Alerta no encontrada."), { status: 404 });
  if (String(campaign.status) === "sending") {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No se puede borrar una alerta mientras se esta enviando."), { status: 400 });
  }

  const { data: deletedCampaign, error } = await adminContext.supabase
    .from("push_alert_campaigns")
    .delete()
    .eq("business_id", adminContext.businessId)
    .eq("id", campaignId)
    .neq("status", "sending")
    .select("id")
    .maybeSingle();

  if (error) return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo borrar la alerta."), { status: 500 });
  if (!deletedCampaign) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No se puede borrar una alerta mientras se esta enviando."), { status: 400 });
  }

  const eventKey = `push_alert:${campaignId}`;
  await adminContext.supabase
    .from("push_notification_records")
    .delete()
    .eq("business_id", adminContext.businessId)
    .eq("event_type", "push_alert_campaign")
    .eq("event_key", eventKey);

  await adminContext.supabase
    .from("push_delivery_events")
    .delete()
    .eq("business_id", adminContext.businessId)
    .eq("event_type", "push_alert_campaign")
    .eq("event_key", eventKey);
  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
