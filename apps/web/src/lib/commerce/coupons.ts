import "server-only";
import { normalizeCouponCode } from "@/shared";

type QueryChain<T> = {
  eq: (column: string, value: unknown) => QueryChain<T>;
  or: (filter: string) => QueryChain<T>;
  maybeSingle: () => Promise<{ data: T | null; error: unknown }>;
};

type SupabaseClientLike = {
  rpc: (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
  from: (table: string) => {
    select: (columns: string) => unknown;
  };
};

export type CouponScope = "services" | "products";

export type CheckoutCouponRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed_amount" | "two_for_one";
  discount_value: number;
  applies_to_services: boolean;
  applies_to_products: boolean;
  usage_limit: number | null;
  used_count: number;
  validity_type: "always" | "single_date" | "weekly" | "range";
  valid_on_date: string | null;
  valid_weekdays: number[] | null;
  starts_on: string | null;
  ends_on: string | null;
};

export type CheckoutCouponResult = {
  coupon: CheckoutCouponRow;
  discountPesos: number;
  finalTotalPesos: number;
};

export type CouponLookupResult =
  | { ok: true; data: CheckoutCouponResult }
  | { ok: false; code: "feature_disabled" | "not_found" | "invalid_scope" | "expired" | "used_up" | "internal_error"; message: string };

function queryBuilder<T>(value: unknown) {
  return value as QueryChain<T>;
}

export function getBusinessDateKey(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : date.toISOString().slice(0, 10);
}

export function isCouponValidForDate(coupon: CheckoutCouponRow, targetDate: string) {
  if (coupon.validity_type === "always") return true;
  if (coupon.validity_type === "single_date") return coupon.valid_on_date === targetDate;

  if (coupon.validity_type === "weekly") {
    const date = new Date(`${targetDate}T00:00:00Z`);
    if (!Number.isFinite(date.getTime())) return false;
    const weekday = date.getUTCDay() === 0 ? 7 : date.getUTCDay();
    return (coupon.valid_weekdays ?? []).includes(weekday);
  }

  return Boolean(coupon.starts_on && coupon.ends_on && coupon.starts_on <= targetDate && targetDate <= coupon.ends_on);
}

export function calculateCouponDiscountPesos(coupon: CheckoutCouponRow, subtotalPesos: number, quantity: number) {
  const subtotal = Math.max(0, Math.round(subtotalPesos));
  const safeQuantity = Math.max(1, Math.round(quantity));
  if (subtotal <= 0) return 0;

  if (coupon.discount_type === "percent") {
    return Math.min(subtotal, Math.round(subtotal * (Math.min(100, Math.max(1, coupon.discount_value)) / 100)));
  }

  if (coupon.discount_type === "fixed_amount") {
    return Math.min(subtotal, Math.max(0, Math.round(coupon.discount_value)));
  }

  if (safeQuantity < 2) return 0;
  return Math.min(subtotal, Math.floor(safeQuantity / 2) * Math.round(subtotal / safeQuantity));
}

export async function resolveCheckoutCoupon(input: {
  supabase: SupabaseClientLike;
  businessId: string;
  code: string;
  scope: CouponScope;
  subtotalPesos: number;
  quantity: number;
  targetDate: string;
}): Promise<CouponLookupResult> {
  const code = normalizeCouponCode(input.code);
  if (!code) return { ok: false, code: "not_found", message: "Codigo de cupon requerido." };

  const { data: enabled, error: featureError } = await input.supabase.rpc("has_feature", {
    p_business_id: input.businessId,
    p_feature_key: "coupons_enabled",
  });
  if (featureError) return { ok: false, code: "internal_error", message: "No se pudo validar el cupon." };
  if (!enabled) return { ok: false, code: "feature_disabled", message: "Cupones no esta habilitado para este negocio." };

  const selected = queryBuilder<CheckoutCouponRow>(input.supabase
    .from("coupons")
    .select("id, code, description, discount_type, discount_value, applies_to_services, applies_to_products, usage_limit, used_count, validity_type, valid_on_date, valid_weekdays, starts_on, ends_on"))
    .eq("business_id", input.businessId)
    .eq("code", code)
    .eq("active", true)
    .eq(input.scope === "products" ? "applies_to_products" : "applies_to_services", true);
  const { data, error } = await selected
    .or(`starts_at.is.null,starts_at.lte.${new Date().toISOString()}`)
    .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
    .maybeSingle();

  if (error) return { ok: false, code: "internal_error", message: "No se pudo validar el cupon." };
  if (!data) return { ok: false, code: "not_found", message: "Cupon no disponible." };
  if (input.scope === "products" && !data.applies_to_products) return { ok: false, code: "invalid_scope", message: "El cupon no aplica a productos." };
  if (input.scope === "services" && !data.applies_to_services) return { ok: false, code: "invalid_scope", message: "El cupon no aplica a reservas." };
  if (!isCouponValidForDate(data, input.targetDate)) return { ok: false, code: "expired", message: "El cupon no esta vigente para esa fecha." };
  if (data.usage_limit !== null && data.used_count >= data.usage_limit) return { ok: false, code: "used_up", message: "El cupon ya alcanzo su limite de usos." };

  const discountPesos = calculateCouponDiscountPesos(data, input.subtotalPesos, input.quantity);
  return {
    ok: true,
    data: {
      coupon: data,
      discountPesos,
      finalTotalPesos: Math.max(0, Math.round(input.subtotalPesos) - discountPesos),
    },
  };
}

export async function reserveCheckoutCoupon(input: {
  supabase: SupabaseClientLike;
  businessId: string;
  couponId: string;
  customerId: string;
  appointmentId?: string | null;
  productOrderId?: string | null;
  purchaserName: string;
  purchaserPhone?: string | null;
  purchaserEmail?: string | null;
  recipientName?: string | null;
  recipientPhone?: string | null;
  recipientEmail?: string | null;
  discountPesos: number;
  expiresAt: string;
  metadata?: Record<string, unknown>;
}) {
  return await input.supabase.rpc("reserve_coupon_for_checkout", {
    p_business_id: input.businessId,
    p_coupon_id: input.couponId,
    p_customer_id: input.customerId,
    p_appointment_id: input.appointmentId ?? null,
    p_product_order_id: input.productOrderId ?? null,
    p_purchaser_name: input.purchaserName,
    p_purchaser_phone: input.purchaserPhone ?? null,
    p_purchaser_email: input.purchaserEmail ?? null,
    p_recipient_name: input.recipientName ?? input.purchaserName,
    p_recipient_phone: input.recipientPhone ?? input.purchaserPhone ?? null,
    p_recipient_email: input.recipientEmail ?? input.purchaserEmail ?? null,
    p_discount_pesos: Math.max(0, Math.round(input.discountPesos)),
    p_expires_at: input.expiresAt,
    p_metadata: input.metadata ?? {},
  });
}

export async function confirmCheckoutCoupon(input: {
  supabase: SupabaseClientLike;
  businessId: string;
  couponId: string;
  appointmentId?: string | null;
  productOrderId?: string | null;
}) {
  return await input.supabase.rpc("confirm_coupon_for_checkout", {
    p_business_id: input.businessId,
    p_coupon_id: input.couponId,
    p_appointment_id: input.appointmentId ?? null,
    p_product_order_id: input.productOrderId ?? null,
  });
}

export async function releaseCheckoutCoupon(input: {
  supabase: SupabaseClientLike;
  businessId: string;
  couponId: string;
  appointmentId?: string | null;
  productOrderId?: string | null;
}) {
  return await input.supabase.rpc("release_coupon_for_checkout", {
    p_business_id: input.businessId,
    p_coupon_id: input.couponId,
    p_appointment_id: input.appointmentId ?? null,
    p_product_order_id: input.productOrderId ?? null,
  });
}
