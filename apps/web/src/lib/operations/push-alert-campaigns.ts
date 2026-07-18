import "server-only";

import { claimPushEvent, markPushEventStatus, sendPushToSubscribers } from "@/lib/push/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type PushAlertStatus = "draft" | "scheduled" | "sending" | "sent" | "partial" | "skipped" | "failed" | "cancelled";

export type PushAlertCampaignRow = {
  id: string;
  business_id: string;
  title: string;
  message: string;
  target_url: string;
  status: PushAlertStatus;
  scheduled_at: string | null;
  subscriptions_count: number | null;
  delivered_count: number | null;
  removed_count: number | null;
  failed_count: number | null;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
  cancelled_at: string | null;
};

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

export function sanitizePushAlertText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

export function sanitizePushAlertUrl(value: unknown) {
  const url = sanitizePushAlertText(value, 160) || "/";
  if (!url.startsWith("/")) return "/";
  if (url.startsWith("/api/") || url.startsWith("/panel")) return "/";
  return url;
}

export function validateScheduledAt(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date;
}

export function pushAlertStatusFromDelivery(result: { delivered: number; failed: number }) {
  if (result.failed > 0 && result.delivered > 0) return "partial" as const;
  if (result.delivered > 0) return "sent" as const;
  if (result.failed > 0) return "failed" as const;
  return "skipped" as const;
}

export async function assertPushCampaignsEnabled(supabase: SupabaseAdminClient, businessId: string) {
  const [{ data: pushEnabled, error: pushError }, { data: campaignsEnabled, error: campaignError }] = await Promise.all([
    supabase.rpc("has_feature", { p_business_id: businessId, p_feature_key: "push_enabled" }),
    supabase.rpc("has_feature", { p_business_id: businessId, p_feature_key: "push_campaigns_enabled" }),
  ]);

  if (pushError || campaignError) return { ok: false as const, reason: "internal_error" as const };
  if (!pushEnabled) return { ok: false as const, reason: "push_disabled" as const };
  if (!campaignsEnabled) return { ok: false as const, reason: "campaigns_disabled" as const };
  return { ok: true as const };
}

export async function sendPushAlertCampaign(input: {
  supabase: SupabaseAdminClient;
  businessId: string;
  campaignId: string;
}) {
  const { supabase, businessId, campaignId } = input;
  const eventKey = `push_alert:${campaignId}`;
  const claim = await claimPushEvent({
    businessId,
    eventKey,
    eventType: "push_alert_campaign",
    sourceTable: "push_alert_campaigns",
    sourceId: campaignId,
  });

  if (claim.duplicate) return { ok: true as const, duplicate: true };
  if (claim.error) return { ok: false as const, error: "No se pudo reclamar la alerta." };

  const { data: campaign, error: campaignError } = await supabase
    .from("push_alert_campaigns")
    .select("id, title, message, target_url, status")
    .eq("business_id", businessId)
    .eq("id", campaignId)
    .in("status", ["draft", "scheduled", "failed"])
    .maybeSingle();

  if (campaignError || !campaign) {
    await markPushEventStatus(eventKey, "failed", "Alerta no disponible para enviar.");
    return { ok: false as const, error: "Alerta no disponible para enviar." };
  }

  await supabase
    .from("push_alert_campaigns")
    .update({ status: "sending", error_message: null })
    .eq("business_id", businessId)
    .eq("id", campaignId);

  const result = await sendPushToSubscribers({
    businessId,
    surface: "public",
    payload: {
      type: "push_alert_campaign",
      eventId: eventKey,
      title: campaign.title,
      body: campaign.message,
      url: campaign.target_url,
      tag: eventKey,
    },
  }).catch((error: unknown) => ({
    ok: false as const,
    error: error instanceof Error ? error.message : "No se pudo enviar la alerta push.",
  }));

  if (!result.ok) {
    await markPushEventStatus(eventKey, "failed", result.error);
    await supabase
      .from("push_alert_campaigns")
      .update({ status: "failed", error_message: result.error, sent_at: new Date().toISOString() })
      .eq("business_id", businessId)
      .eq("id", campaignId);
    return { ok: false as const, error: result.error };
  }

  const status = pushAlertStatusFromDelivery(result);
  await markPushEventStatus(eventKey, status === "partial" ? "partial" : status === "sent" ? "sent" : status === "failed" ? "failed" : "skipped");
  await supabase
    .from("push_alert_campaigns")
    .update({
      status,
      subscriptions_count: result.subscriptions,
      delivered_count: result.delivered,
      removed_count: result.removed,
      failed_count: result.failed,
      error_message: null,
      sent_at: new Date().toISOString(),
    })
    .eq("business_id", businessId)
    .eq("id", campaignId);

  return { ok: true as const, duplicate: false, result };
}
