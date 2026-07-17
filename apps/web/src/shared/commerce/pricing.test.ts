import { describe, expect, it } from "vitest";
import { calculateDepositCents, calculateDiscountCents, calculateLineTotalCents, calculateTotalCents } from "./pricing";

describe("pricing helpers", () => {
  it("calculates line totals and discounts", () => {
    expect(calculateLineTotalCents(1000, 3)).toBe(3000);
    expect(calculateDiscountCents(10000, { type: "percent", value: 15 })).toBe(1500);
    expect(calculateDiscountCents(10000, { type: "fixed_amount", value: 12000 })).toBe(10000);
    expect(calculateTotalCents(10000, { type: "fixed_amount", value: 2500 })).toBe(7500);
  });

  it("caps deposits to total", () => {
    expect(calculateDepositCents(10000, { mode: "percent", value: 30 })).toBe(3000);
    expect(calculateDepositCents(10000, { mode: "fixed_amount", value: 12000 })).toBe(10000);
    expect(calculateDepositCents(10000, { mode: "none" })).toBe(0);
  });
});
