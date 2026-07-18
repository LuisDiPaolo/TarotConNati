import { z } from "zod";
import type { DiscountInput } from "./pricing";

export type PromotionConfig = {
  title: string;
  discount: DiscountInput;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
};

export const couponSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(40),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  discountType: z.enum(["percent", "fixed_amount", "two_for_one"]),
  discountValue: z.coerce.number().int().min(0).max(10_000_000),
  appliesToServices: z.boolean().default(true),
  appliesToProducts: z.boolean().default(false),
  validityType: z.enum(["always", "single_date", "weekly", "range"]),
  validOnDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  validWeekdays: z.array(z.coerce.number().int().min(1).max(7)).max(7).default([]),
  startsOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  endsOn: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  usageLimit: z.coerce.number().int().min(1).max(100_000).nullable().optional(),
  active: z.boolean().default(true),
}).refine((value) => value.appliesToServices || value.appliesToProducts, {
  path: ["appliesToServices"],
  message: "El cupon debe aplicar a servicios, productos o ambos.",
}).refine((value) => value.discountType !== "percent" || (value.discountValue >= 1 && value.discountValue <= 100), {
  path: ["discountValue"],
  message: "El descuento porcentual debe estar entre 1 y 100%.",
}).refine((value) => value.discountType !== "fixed_amount" || value.discountValue > 0, {
  path: ["discountValue"],
  message: "El monto fijo debe ser mayor a cero.",
}).refine((value) => value.discountType !== "two_for_one" || value.discountValue === 0, {
  path: ["discountValue"],
  message: "El descuento 2x1 no usa monto.",
}).refine((value) => value.validityType !== "single_date" || Boolean(value.validOnDate), {
  path: ["validOnDate"],
  message: "Elegí el día puntual del cupón.",
}).refine((value) => value.validityType !== "weekly" || value.validWeekdays.length > 0, {
  path: ["validWeekdays"],
  message: "Elegí al menos un día semanal.",
}).refine((value) => value.validWeekdays.length === new Set(value.validWeekdays).size, {
  path: ["validWeekdays"],
  message: "No repitas dias semanales.",
}).refine((value) => value.validityType !== "range" || Boolean(value.startsOn && value.endsOn && value.startsOn <= value.endsOn), {
  path: ["endsOn"],
  message: "Revisa el periodo de vigencia.",
});

export type CouponSettingsInput = z.infer<typeof couponSettingsSchema>;

export const promotionSettingsSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  discountType: z.enum(["percent", "fixed_amount"]),
  discountValue: z.coerce.number().int().min(1).max(10_000_000),
  startsAt: z.string().trim().optional().or(z.literal("")),
  endsAt: z.string().trim().optional().or(z.literal("")),
  active: z.boolean().default(true),
}).refine((value) => value.discountType !== "percent" || value.discountValue <= 100, {
  path: ["discountValue"],
  message: "El descuento porcentual no puede superar 100%.",
});

export type PromotionSettingsInput = z.infer<typeof promotionSettingsSchema>;

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
