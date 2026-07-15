import "server-only";

import webpush, { type PushSubscription } from "web-push";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StoredPushSubscription } from "@/lib/push/subscription";

export type PushPayload = {
  type: string;
  eventId: string;
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

type PushRow = {
  id: string;
  endpoint: string;
  subscription: StoredPushSubscription;
};

let vapidConfigured = false;

function configureVapid() {
  if (vapidConfigured) return;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    throw new Error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export function isValidInternalSecret(value: string | null) {
  return Boolean(process.env.INTERNAL_API_SECRET && value && value === process.env.INTERNAL_API_SECRET);
}

export async function claimPushEvent(input: {
  businessId: string;
  eventKey: string;
  eventType: string;
  sourceTable?: string;
  sourceId?: string | null;
  payload?: Record<string, unknown>;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("push_delivery_events").insert({
    business_id: input.businessId,
    event_key: input.eventKey,
    event_type: input.eventType,
    source_table: input.sourceTable ?? null,
    source_id: input.sourceId ?? null,
    payload: input.payload ?? {},
    status: "claimed",
  });

  if (error?.code === "23505") return { duplicate: true, error: null };
  return { duplicate: false, error: error ?? null };
}

export async function markPushEventStatus(eventKey: string, status: "sent" | "partial" | "failed" | "skipped", error?: string) {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("push_delivery_events")
    .update({ status, error: error ?? null })
    .eq("event_key", eventKey);
}

async function removeExpiredSubscription(id: string) {
  const supabase = createSupabaseAdminClient();
  await supabase
    .from("push_subscriptions")
    .update({ disabled_at: new Date().toISOString() })
    .eq("id", id);
}

async function recordPushNotification(input: {
  businessId: string;
  surface?: "public" | "panel";
  payload: PushPayload;
  customerId?: string;
  appointmentId?: string;
  serviceRequestId?: string;
  delivered: number;
  failed: number;
}) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("push_notification_records").insert({
    business_id: input.businessId,
    surface: input.surface ?? "panel",
    customer_id: input.customerId ?? null,
    appointment_id: input.appointmentId ?? null,
    service_request_id: input.serviceRequestId ?? null,
    event_key: input.payload.eventId,
    event_type: input.payload.type,
    title: input.payload.title,
    body: input.payload.body,
    url: input.payload.url ?? null,
    payload: input.payload,
    delivered_count: input.delivered,
    failed_count: input.failed,
  });
}

export async function sendPushToSubscribers(input: {
  businessId: string;
  payload: PushPayload;
  endpoint?: string;
  surface?: "public" | "panel";
  customerId?: string;
  appointmentId?: string;
  serviceRequestId?: string;
}) {
  configureVapid();

  const supabase = createSupabaseAdminClient();
  let query = supabase
    .from("push_subscriptions")
    .select("id, endpoint, subscription")
    .eq("business_id", input.businessId)
    .is("disabled_at", null);

  if (input.endpoint) query = query.eq("endpoint", input.endpoint);
  if (input.surface) query = query.eq("surface", input.surface);
  if (input.customerId) query = query.eq("customer_id", input.customerId);
  if (input.appointmentId) query = query.eq("appointment_id", input.appointmentId);
  if (input.serviceRequestId) query = query.eq("service_request_id", input.serviceRequestId);

  const { data, error } = await query;
  if (error) return { ok: false as const, error: error.message, delivered: 0, failed: 0, removed: 0, subscriptions: 0 };

  const rows = (data ?? []) as PushRow[];
  let delivered = 0;
  let failed = 0;
  let removed = 0;

  await Promise.all(rows.map(async (row) => {
    try {
      await webpush.sendNotification(row.subscription as PushSubscription, JSON.stringify(input.payload));
      delivered += 1;
    } catch (sendError) {
      failed += 1;
      const statusCode = typeof sendError === "object" && sendError && "statusCode" in sendError ? Number(sendError.statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) {
        removed += 1;
        await removeExpiredSubscription(row.id);
      }
    }
  }));

  await recordPushNotification({
    businessId: input.businessId,
    surface: input.surface,
    payload: input.payload,
    customerId: input.customerId,
    appointmentId: input.appointmentId,
    serviceRequestId: input.serviceRequestId,
    delivered,
    failed,
  }).catch(() => null);

  return { ok: true as const, delivered, failed, removed, subscriptions: rows.length };
}
