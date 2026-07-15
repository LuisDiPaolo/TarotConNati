import "server-only";

import { claimPushEvent, markPushEventStatus, sendPushToSubscribers, type PushPayload } from "@/lib/push/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function isPushEnabled(businessId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("features")
    .select("enabled")
    .eq("business_id", businessId)
    .eq("feature_key", "push_enabled")
    .maybeSingle();

  if (error) return false;
  return data?.enabled !== false;
}

export async function sendTransactionalPush(input: {
  businessId: string;
  eventKey: string;
  eventType: string;
  sourceTable?: string;
  sourceId?: string | null;
  surface: "public" | "panel";
  customerId?: string;
  appointmentId?: string;
  serviceRequestId?: string;
  payload: Omit<PushPayload, "eventId" | "type">;
}) {
  const enabled = await isPushEnabled(input.businessId);
  if (!enabled) return;

  const claimed = await claimPushEvent({
    businessId: input.businessId,
    eventKey: input.eventKey,
    eventType: input.eventType,
    sourceTable: input.sourceTable,
    sourceId: input.sourceId,
    payload: input.payload,
  });

  if (claimed.duplicate || claimed.error) return;

  try {
    const result = await sendPushToSubscribers({
      businessId: input.businessId,
      surface: input.surface,
      customerId: input.customerId,
      appointmentId: input.appointmentId,
      serviceRequestId: input.serviceRequestId,
      payload: {
        ...input.payload,
        type: input.eventType,
        eventId: input.eventKey,
      },
    });

    if (!result.ok) {
      await markPushEventStatus(input.eventKey, "failed", result.error);
      return;
    }

    if (result.subscriptions === 0) {
      await markPushEventStatus(input.eventKey, "skipped", "No active subscriptions");
      return;
    }

    await markPushEventStatus(input.eventKey, result.failed > 0 ? "partial" : "sent");
  } catch (error) {
    await markPushEventStatus(input.eventKey, "failed", error instanceof Error ? error.message : "Unknown push error");
  }
}
