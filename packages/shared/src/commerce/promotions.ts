import type { DiscountInput } from "./pricing";

export type PromotionConfig = {
  title: string;
  discount: DiscountInput;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
};

export type CouponValidationInput = {
  code: string;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  usedCount?: number | null;
};

export function normalizeCouponCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "-").slice(0, 40);
}

export function isWithinWindow(now: Date, startsAt?: string | null, endsAt?: string | null) {
  const start = startsAt ? new Date(startsAt) : null;
  const end = endsAt ? new Date(endsAt) : null;

  if (start && Number.isFinite(start.getTime()) && now < start) return false;
  if (end && Number.isFinite(end.getTime()) && now > end) return false;
  return true;
}

export function canUseCoupon(input: CouponValidationInput, now = new Date()) {
  if (!normalizeCouponCode(input.code)) return false;
  if (!input.active) return false;
  if (!isWithinWindow(now, input.startsAt, input.endsAt)) return false;

  const usageLimit = input.usageLimit ?? null;
  const usedCount = input.usedCount ?? 0;
  if (usageLimit !== null && usedCount >= usageLimit) return false;

  return true;
}

export function normalizePromotionConfig(value: unknown): PromotionConfig | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title.trim().slice(0, 120) : "";
  const type = raw.discountType === "fixed_amount" ? "fixed_amount" : raw.discountType === "percent" ? "percent" : null;
  const discountValue = Number(raw.discountValue);

  if (!title || !type || !Number.isFinite(discountValue) || discountValue <= 0) return null;

  return {
    title,
    discount: { type, value: discountValue },
    startsAt: typeof raw.startsAt === "string" ? raw.startsAt : null,
    endsAt: typeof raw.endsAt === "string" ? raw.endsAt : null,
    usageLimit: Number.isInteger(raw.usageLimit) ? Number(raw.usageLimit) : null,
  };
}
