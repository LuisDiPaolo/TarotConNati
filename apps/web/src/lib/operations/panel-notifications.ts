import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export async function getPanelNotificationRecords(): Promise<PanelNotificationRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("push_notification_records")
    .select("id, surface, event_type, title, body, url, delivered_count, failed_count, created_at")
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
