import "server-only";

import { getCurrentPanelBusinessId } from "@/lib/operations/panel-auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PanelPushAlertCampaign = {
  id: string;
  title: string;
  message: string;
  targetUrl: string;
  status: "draft" | "scheduled" | "sending" | "sent" | "partial" | "skipped" | "failed" | "cancelled";
  scheduledAt: string | null;
  subscriptionsCount: number;
  deliveredCount: number;
  removedCount: number;
  failedCount: number;
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
  cancelledAt: string | null;
};

export type PanelNotificationRecord = {
  id: string;
  surface: "public" | "panel";
  eventType: string;
  title: string;
  body: string;
  url: string;
  deliveredCount: number;
  failedCount: number;
  createdAt: string;
};

type PushAlertCampaignRow = {
  id: string;
  title: string;
  message: string;
  target_url: string;
  status: PanelPushAlertCampaign["status"];
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

type NotificationRecordRow = {
  id: string;
  surface: "public" | "panel";
  event_type: string;
  title: string;
  body: string;
  url: string | null;
  delivered_count: number | null;
  failed_count: number | null;
  created_at: string;
};

export async function getPanelPushAlertFeatureState(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const businessId = await getCurrentPanelBusinessId(supabase);
  if (!businessId) return false;

  const { data } = await supabase.rpc("has_feature", {
    p_business_id: businessId,
    p_feature_key: "push_campaigns_enabled",
  });

  return Boolean(data);
}

export async function getPanelPushAlertCampaigns(): Promise<PanelPushAlertCampaign[]> {
  const supabase = await createSupabaseServerClient();
  const businessId = await getCurrentPanelBusinessId(supabase);
  if (!businessId) return [];

  const { data, error } = await supabase
    .from("push_alert_campaigns")
    .select("id, title, message, target_url, status, scheduled_at, subscriptions_count, delivered_count, removed_count, failed_count, error_message, created_at, sent_at, cancelled_at")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) return [];

  return ((data ?? []) as PushAlertCampaignRow[]).map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    message: campaign.message,
    targetUrl: campaign.target_url,
    status: campaign.status,
    scheduledAt: campaign.scheduled_at,
    subscriptionsCount: Number(campaign.subscriptions_count ?? 0),
    deliveredCount: Number(campaign.delivered_count ?? 0),
    removedCount: Number(campaign.removed_count ?? 0),
    failedCount: Number(campaign.failed_count ?? 0),
    errorMessage: campaign.error_message,
    createdAt: campaign.created_at,
    sentAt: campaign.sent_at,
    cancelledAt: campaign.cancelled_at,
  }));
}

export async function getPanelNotificationRecords(): Promise<PanelNotificationRecord[]> {
  const supabase = await createSupabaseServerClient();
  const businessId = await getCurrentPanelBusinessId(supabase);
  if (!businessId) return [];

  const { data, error } = await supabase
    .from("push_notification_records")
    .select("id, surface, event_type, title, body, url, delivered_count, failed_count, created_at")
    .eq("business_id", businessId)
    .neq("event_type", "push_alert_campaign")
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) return [];

  return ((data ?? []) as NotificationRecordRow[]).map((record) => ({
    id: record.id,
    surface: record.surface,
    eventType: record.event_type,
    title: record.title,
    body: record.body,
    url: record.url ?? "",
    deliveredCount: Number(record.delivered_count ?? 0),
    failedCount: Number(record.failed_count ?? 0),
    createdAt: record.created_at,
  }));
}
