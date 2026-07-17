import { apiError } from "@/shared";
import { NextResponse, type NextRequest } from "next/server";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { claimPushEvent, isValidInternalSecret, markPushEventStatus, sendPushToSubscribers } from "@/lib/push/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type SendPushBody = {
  endpoint?: string;
  surface?: "public" | "panel";
  title?: string;
  message?: string;
  url?: string;
  type?: string;
  eventId?: string;
  eventKey?: string;
  tag?: string;
};

async function hasPanelSession() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    return Boolean(!error && data.user);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const authorized = isValidInternalSecret(request.headers.get("x-internal-key")) || await hasPanelSession();
  if (!authorized) {
    return NextResponse.json(apiError("UNAUTHORIZED", "No autorizado."), { status: 401 });
  }

  const body = await request.json().catch(() => null) as SendPushBody | null;
  if (!body?.title || !body.message) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "title y message son requeridos."), { status: 400 });
  }

  const business = await resolveBusinessForRequest(request);
  if (!business) {
    return NextResponse.json(apiError("NOT_FOUND", "No se encontro el negocio para este hostname."), { status: 404 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: enabled, error: featureError } = await supabase.rpc("has_feature", {
    p_business_id: business.id,
    p_feature_key: "push_enabled",
  });

  if (featureError) {
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo validar el modulo push."), { status: 500 });
  }

  if (!enabled) {
    return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "El modulo push no esta habilitado para este negocio."), { status: 403 });
  }

  const eventId = body.eventId ?? crypto.randomUUID();
  const eventKey = body.eventKey;

  if (eventKey) {
    const claim = await claimPushEvent({
      businessId: business.id,
      eventKey,
      eventType: body.type ?? "manual_push",
      sourceTable: "api_push_send",
      payload: { url: body.url, tag: body.tag },
    });

    if (claim.duplicate) return NextResponse.json({ data: { ok: true, duplicate: true } });
    if (claim.error) return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo registrar el evento push."), { status: 500 });
  }

  const result = await sendPushToSubscribers({
    businessId: business.id,
    endpoint: body.endpoint,
    surface: body.surface,
    payload: {
      type: body.type ?? "manual_push",
      eventId,
      title: body.title,
      body: body.message,
      url: body.url,
      tag: body.tag,
    },
  });

  if (!result.ok) {
    if (eventKey) await markPushEventStatus(eventKey, "failed", result.error);
    return NextResponse.json(apiError("INTERNAL_ERROR", result.error), { status: 500 });
  }

  if (eventKey) {
    const status = result.failed > 0 ? "partial" : result.delivered > 0 ? "sent" : "skipped";
    await markPushEventStatus(eventKey, status);
  }

  return NextResponse.json({
    data: {
      ok: true,
      sent: result.delivered,
      removed: result.removed,
      failed: result.failed,
      subscriptions: result.subscriptions,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
