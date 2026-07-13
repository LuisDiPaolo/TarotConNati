import { describe, expect, it } from "vitest";
import { canUseCoupon, normalizeCouponCode, normalizePromotionConfig } from "./promotions";

describe("promotion helpers", () => {
  it("normalizes coupon codes", () => {
    expect(normalizeCouponCode(" promo verano ")).toBe("PROMO-VERANO");
  });

  it("validates coupon windows and usage", () => {
    const now = new Date("2026-01-10T12:00:00.000Z");
    expect(canUseCoupon({ code: "A", active: true, startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2026-02-01T00:00:00.000Z" }, now)).toBe(true);
    expect(canUseCoupon({ code: "A", active: false }, now)).toBe(false);
    expect(canUseCoupon({ code: "A", active: true, usageLimit: 2, usedCount: 2 }, now)).toBe(false);
  });

  it("normalizes promotion config", () => {
    expect(normalizePromotionConfig({ title: "Promo", discountType: "percent", discountValue: 10 })).toEqual({
      title: "Promo",
      discount: { type: "percent", value: 10 },
      startsAt: null,
      endsAt: null,
      usageLimit: null,
    });
  });
});
