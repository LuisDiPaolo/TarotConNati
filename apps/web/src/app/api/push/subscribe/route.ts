import { apiError } from "@turnos/shared";
import { NextResponse, type NextRequest } from "next/server";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { hashPushEndpoint, isValidPushSubscription, resolvePushSurface } from "@/lib/push/subscription";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { subscription?: unknown; surface?: unknown } | null;
  const subscription = body?.subscription;

  if (!isValidPushSubscription(subscription)) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Suscripcion push invalida."), { status: 400 });
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

  const endpointHash = hashPushEndpoint(subscription.endpoint);
  const { error } = await supabase.from("push_subscriptions").upsert({
    business_id: business.id,
    surface: resolvePushSurface(body?.surface),
    endpoint: subscription.endpoint,
    endpoint_hash: endpointHash,
    subscription,
    user_agent: request.headers.get("user-agent") ?? "",
    last_seen_at: new Date().toISOString(),
    disabled_at: null,
  }, { onConflict: "endpoint_hash" });

  if (error) {
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo guardar la suscripcion push."), { status: 500 });
  }

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
