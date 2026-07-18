import { NextResponse, type NextRequest } from "next/server";
import { apiError, publicInquirySchema } from "@/shared";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { sendTransactionalPush } from "@/lib/push/transactional";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const RATE_LIMIT_WINDOW_MS = 10 * 60_000;
const RATE_LIMIT_MAX = 5;
const inquiryAttempts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

function enforceRateLimit(key: string) {
  const now = Date.now();
  const current = inquiryAttempts.get(key);
  if (!current || current.resetAt <= now) {
    inquiryAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) return false;
  current.count += 1;
  return true;
}

export async function POST(request: NextRequest) {
  const business = await resolveBusinessForRequest(request);
  if (!business) {
    return NextResponse.json(apiError("NOT_FOUND", "No se encontro el negocio para esta consulta."), { status: 404 });
  }

  const rateLimitKey = `${business.id}:inquiry:${getClientIp(request)}`;
  if (!enforceRateLimit(rateLimitKey)) {
    return NextResponse.json(apiError("RATE_LIMITED", "Demasiadas consultas. Proba de nuevo en unos minutos."), { status: 429 });
  }

  const parsed = publicInquirySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Revisa los datos de contacto."), { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const { data: enabled, error: featureError } = await supabase.rpc("has_feature", {
    p_business_id: business.id,
    p_feature_key: "inquiries_enabled",
  });

  if (featureError) {
    return NextResponse.json(apiError("INTERNAL_ERROR", "No se pudo validar consultas."), { status: 500 });
  }

  if (!enabled) {
    return NextResponse.json(apiError("FEATURE_NOT_ENABLED", "Las consultas no estan activas para este negocio."), { status: 403 });
  }

  const input = parsed.data;
  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .insert({
      business_id: business.id,
      name: input.name,
      phone: input.phone || null,
      email: input.email || null,
      message: input.message,
      source: input.source,
      status: "new",
    })
    .select("id")
    .single();

  if (error || !inquiry) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo registrar la consulta."), { status: 400 });
  }

  await sendTransactionalPush({
    businessId: business.id,
    eventKey: `inquiry.created.${inquiry.id}`,
    eventType: "inquiry.created",
    sourceTable: "inquiries",
    sourceId: inquiry.id,
    surface: "panel",
    payload: {
      title: "Nueva consulta",
      body: `${input.name} envio una consulta desde la web publica.`,
      url: "/consultas",
      tag: "inquiry-created",
    },
  });

  return NextResponse.json({ data: { id: inquiry.id, status: "new" } }, { headers: { "Cache-Control": "no-store" } });
}
