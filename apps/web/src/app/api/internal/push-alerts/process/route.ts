import { NextResponse, type NextRequest } from "next/server";
import { apiError } from "@/shared";
import { assertPushCampaignsEnabled, sendPushAlertCampaign, type PushAlertCampaignRow } from "@/lib/operations/push-alert-campaigns";
import { isValidInternalSecret } from "@/lib/push/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
  return isValidInternalSecret(request.headers.get("x-internal-key"))
    || Boolean(process.env.CRON_SECRET && bearer === process.env.CRON_SECRET)
    || Boolean(process.env.INTERNAL_API_SECRET && bearer === process.env.INTERNAL_API_SECRET);
}

async function processDuePushAlerts(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(apiError("UNAUTHORIZED", "No autorizado."), { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("push_alert_campaigns")
    .select("id, business_id")
    .eq("status", "scheduled")
    .lte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(20);

  if (error) return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudieron cargar alertas programadas."), { status: 500 });

  const dueCampaigns = (data ?? []) as Pick<PushAlertCampaignRow, "id" | "business_id">[];
  const results = [];
  for (const campaign of dueCampaigns) {
    const enabled = await assertPushCampaignsEnabled(supabase, campaign.business_id);
    if (!enabled.ok) {
      results.push({ id: campaign.id, ok: false, duplicate: false, skipped: enabled.reason });
      continue;
    }

    const result = await sendPushAlertCampaign({ supabase, businessId: campaign.business_id, campaignId: campaign.id });
    results.push({ id: campaign.id, ok: result.ok, duplicate: result.ok ? result.duplicate : false });
  }

  return NextResponse.json({ data: { processed: results.length, results } }, { headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: NextRequest) {
  return processDuePushAlerts(request);
}

export async function POST(request: NextRequest) {
  return processDuePushAlerts(request);
}
