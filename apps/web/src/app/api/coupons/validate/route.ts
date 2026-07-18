import { apiError, normalizeCouponCode, type ApiErrorCode } from "@/shared";
import { NextResponse, type NextRequest } from "next/server";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { resolveCheckoutCoupon, type CouponScope } from "@/lib/commerce/coupons";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function parseNonNegativeInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
}

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function couponErrorCode(code: string): ApiErrorCode {
  if (code === "feature_disabled") return "FEATURE_NOT_ENABLED";
  if (code === "internal_error") return "INTERNAL_ERROR";
  return "COUPON_NOT_AVAILABLE";
}

export async function GET(request: NextRequest) {
  const code = normalizeCouponCode(request.nextUrl.searchParams.get("code") ?? "");
  if (!code) {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Codigo de cupon requerido."), { status: 400 });
  }

  const scope: CouponScope = request.nextUrl.searchParams.get("scope") === "products" ? "products" : "services";
  const subtotalPesos = parseNonNegativeInt(request.nextUrl.searchParams.get("subtotalPesos"), 0);
  const quantity = parsePositiveInt(request.nextUrl.searchParams.get("quantity"), 1);
  const targetDate = request.nextUrl.searchParams.get("targetDate") || new Date().toISOString().slice(0, 10);

  const business = await resolveBusinessForRequest(request);
  if (!business) {
    return NextResponse.json(apiError("NOT_FOUND", "No se encontro el negocio para este hostname."), { status: 404 });
  }

  const result = await resolveCheckoutCoupon({
    supabase: createSupabaseAdminClient(),
    businessId: business.id,
    code,
    scope,
    subtotalPesos,
    quantity,
    targetDate,
  });

  if (!result.ok) {
    const status = result.code === "feature_disabled" ? 403 : result.code === "internal_error" ? 500 : 404;
    return NextResponse.json(apiError(couponErrorCode(result.code), result.message), { status });
  }

  return NextResponse.json({
    data: {
      ...result.data.coupon,
      discountPesos: result.data.discountPesos,
      finalTotalPesos: result.data.finalTotalPesos,
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
