import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/shared";
import { assertPushCampaignsEnabled, sanitizePushAlertText, sanitizePushAlertUrl, sendPushAlertCampaign, validateScheduledAt, type PushAlertCampaignRow } from "@/lib/operations/push-alert-campaigns";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminContext = {
  supabase: ReturnType<typeof createSupabaseAdminClient>;
  businessId: string;
  adminUserId: string;
};

type PushAlertPayload = {
  title?: unknown;
  message?: unknown;
  targetUrl?: unknown;
  mode?: unknown;
  scheduledAt?: unknown;
};

async function getAdminContext(): Promise<AdminContext | null> {
  const sessionSupabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await sessionSupabase.auth.getUser();
  if (userError || !userData.user) return null;

  const supabase = createSupabaseAdminClient();
  const { data: adminUser, error: adminError } = await supabase
    .from("admin_users")
    .select("id, business_id, role")
    .eq("auth_user_id", userData.user.id)
    .maybeSingle();

  if (adminError || !adminUser?.business_id || !["owner", "admin"].includes(String(adminUser.role))) return null;
  return { supabase, businessId: adminUser.business_id as string, adminUserId: adminUser.id as string };
}

function mapCampaign(row: PushAlertCampaignRow) {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    targetUrl: row.target_url,
    status: row.status,
    scheduledAt: row.scheduled_at,
    subscriptionsCount: Number(row.subscriptions_count ?? 0),
    deliveredCount: Number(row.delivered_count ?? 0),
    removedCount: Number(row.removed_count ?? 0),
    failedCount: Number(row.failed_count ?? 0),
    errorMessage: row.error_message,
    createdAt: row.created_at,
    sentAt: row.sent_at,
    cancelledAt: row.cancelled_at,
  };
}

export async function GET() {
  const context = await getAdminContext();
  if (!context) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });

  const enabled = await assertPushCampaignsEnabled(context.supabase, context.businessId);
  if (!enabled.ok) {
    const message = enabled.reason === "push_disabled" ? "Notificaciones push no esta activo." : enabled.reason === "campaigns_disabled" ? "Alertas push no esta activo." : "No se pudo validar alertas push.";
    const status = enabled.reason === "internal_error" ? 500 : 403;
    return NextResponse.json(apiError(enabled.reason === "internal_error" ? "INTERNAL_ERROR" : "FEATURE_NOT_ENABLED", message), { status });
  }

  const { data, error } = await context.supabase
    .from("push_alert_campaigns")
    .select("id, business_id, title, message, target_url, status, scheduled_at, subscriptions_count, delivered_count, removed_count, failed_count, error_message, created_at, sent_at, cancelled_at")
    .eq("business_id", context.businessId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudieron cargar las alertas."), { status: 500 });
  return NextResponse.json({ data: { campaigns: ((data ?? []) as PushAlertCampaignRow[]).map(mapCampaign) } }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const context = await getAdminContext();
  if (!context) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });

  const enabled = await assertPushCampaignsEnabled(context.supabase, context.businessId);
  if (!enabled.ok) {
    const message = enabled.reason === "push_disabled" ? "Notificaciones push no esta activo." : enabled.reason === "campaigns_disabled" ? "Alertas push no esta activo." : "No se pudo validar alertas push.";
    const status = enabled.reason === "internal_error" ? 500 : 403;
    return NextResponse.json(apiError(enabled.reason === "internal_error" ? "INTERNAL_ERROR" : "FEATURE_NOT_ENABLED", message), { status });
  }

  const body = await request.json().catch(() => null) as PushAlertPayload | null;
  const title = sanitizePushAlertText(body?.title, 70);
  const message = sanitizePushAlertText(body?.message, 180);
  const targetUrl = sanitizePushAlertUrl(body?.targetUrl);
  const mode = body?.mode === "scheduled" ? "scheduled" : "now";
  const scheduledAt = mode === "scheduled" ? validateScheduledAt(body?.scheduledAt) : null;

  if (!title || !message) return NextResponse.json(apiError("VALIDATION_ERROR", "Titulo y mensaje son requeridos."), { status: 400 });
  if (mode === "scheduled" && (!scheduledAt || scheduledAt.getTime() <= Date.now() + 60_000)) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Elegí una fecha futura para programar."), { status: 400 });
  }

  const { data: inserted, error: insertError } = await context.supabase
    .from("push_alert_campaigns")
    .insert({
      business_id: context.businessId,
      title,
      message,
      target_url: targetUrl,
      status: mode === "scheduled" ? "scheduled" : "draft",
      scheduled_at: scheduledAt?.toISOString() ?? null,
      created_by: context.adminUserId,
    })
    .select("id, business_id, title, message, target_url, status, scheduled_at, subscriptions_count, delivered_count, removed_count, failed_count, error_message, created_at, sent_at, cancelled_at")
    .single();

  if (insertError || !inserted) return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo crear la alerta."), { status: 500 });

  if (mode === "now") {
    const sent = await sendPushAlertCampaign({ supabase: context.supabase, businessId: context.businessId, campaignId: inserted.id });
    if (!sent.ok) return NextResponse.json(apiError("INTERNAL_ERROR", sent.error), { status: 500 });
  }

  const { data: current } = await context.supabase
    .from("push_alert_campaigns")
    .select("id, business_id, title, message, target_url, status, scheduled_at, subscriptions_count, delivered_count, removed_count, failed_count, error_message, created_at, sent_at, cancelled_at")
    .eq("business_id", context.businessId)
    .eq("id", inserted.id)
    .single();

  return NextResponse.json({ data: { campaign: mapCampaign((current ?? inserted) as PushAlertCampaignRow) } }, { headers: { "Cache-Control": "no-store" } });
}
