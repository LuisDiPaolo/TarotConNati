export type DiscountType = "percent" | "fixed_amount";

export type DiscountInput = {
  type: DiscountType;
  value: number;
};

export function clampQuantity(value: unknown, options: { min?: number; max?: number } = {}) {
  const min = options.min ?? 1;
  const max = options.max ?? 99;
  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < min || quantity > max) {
    throw new Error("INVALID_QUANTITY");
  }

  return quantity;
}

export function toCents(amount: number) {
  return Math.round(amount * 100);
}

export function fromCents(cents: number) {
  return cents / 100;
}

export function calculateLineTotalCents(unitPriceCents: number, quantity: number) {
  return Math.max(0, Math.round(unitPriceCents) * clampQuantity(quantity));
}

export function calculateDiscountCents(subtotalCents: number, discount: DiscountInput | null | undefined) {
  const subtotal = Math.max(0, Math.round(subtotalCents));
  if (!discount) return 0;

  if (discount.type === "percent") {
    const percent = Math.max(0, Math.min(100, discount.value));
    return Math.min(subtotal, Math.round(subtotal * (percent / 100)));
  }

  const fixed = Math.max(0, Math.round(discount.value));
  return Math.min(subtotal, fixed);
}

export function calculateTotalCents(subtotalCents: number, discount?: DiscountInput | null) {
  const subtotal = Math.max(0, Math.round(subtotalCents));
  return subtotal - calculateDiscountCents(subtotal, discount);
}

export function calculateDepositCents(totalCents: number, input: { mode: "none" | "fixed_amount" | "percent"; value?: number }) {
  const total = Math.max(0, Math.round(totalCents));
  if (input.mode === "none") return 0;
  if (input.mode === "percent") return Math.min(total, Math.round(total * (Math.max(0, Math.min(100, input.value ?? 0)) / 100)));
  return Math.min(total, Math.max(0, Math.round(input.value ?? 0)));
}
