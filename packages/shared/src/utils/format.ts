export const DEFAULT_TIME_ZONE = "America/Argentina/Buenos_Aires";
export const DEFAULT_LOCALE = "es-AR";
export const DEFAULT_CURRENCY = "ARS";

export function formatARS(value: number) {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: "currency",
    currency: DEFAULT_CURRENCY,
  }).format(value);
}
