export type FeaturePack = "esencial" | "profesional" | "comercial";

export type FeatureCatalogItem = {
  key: `${string}_enabled`;
  pack: FeaturePack;
  requiresMigration: boolean;
  governedTables: readonly string[];
};

export const FEATURE_CATALOG = [
  { key: "full_payments_enabled", pack: "profesional", requiresMigration: false, governedTables: ["payments"] },
  { key: "analytics_enabled", pack: "profesional", requiresMigration: false, governedTables: [] },
  { key: "customer_history_enabled", pack: "profesional", requiresMigration: false, governedTables: ["customers", "appointments", "payments"] },
  { key: "reports_enabled", pack: "profesional", requiresMigration: false, governedTables: [] },
  { key: "products_enabled", pack: "profesional", requiresMigration: true, governedTables: ["products"] },
  { key: "portfolio_enabled", pack: "profesional", requiresMigration: true, governedTables: ["portfolio_items"] },
  { key: "promotions_enabled", pack: "profesional", requiresMigration: true, governedTables: ["promotions"] },
  { key: "inquiries_enabled", pack: "esencial", requiresMigration: true, governedTables: ["inquiries"] },
  { key: "push_enabled", pack: "profesional", requiresMigration: true, governedTables: ["push_subscriptions", "push_delivery_events"] },
  { key: "push_campaigns_enabled", pack: "comercial", requiresMigration: true, governedTables: ["push_campaigns"] },
  { key: "campaigns_enabled", pack: "comercial", requiresMigration: true, governedTables: ["campaigns"] },
  { key: "coupons_enabled", pack: "comercial", requiresMigration: true, governedTables: ["coupons"] },
  { key: "gift_cards_enabled", pack: "comercial", requiresMigration: true, governedTables: ["gift_cards"] },
  { key: "packages_enabled", pack: "comercial", requiresMigration: true, governedTables: ["packages"] },
  { key: "segmentation_enabled", pack: "comercial", requiresMigration: false, governedTables: [] },
  { key: "advanced_reports_enabled", pack: "comercial", requiresMigration: false, governedTables: [] },
  { key: "multi_staff_enabled", pack: "comercial", requiresMigration: true, governedTables: ["staff_members"] },
  { key: "multi_location_enabled", pack: "comercial", requiresMigration: true, governedTables: ["business_locations"] },
  { key: "waitlist_enabled", pack: "comercial", requiresMigration: true, governedTables: ["waitlist_entries"] },
  { key: "memberships_enabled", pack: "comercial", requiresMigration: true, governedTables: ["memberships"] },
] as const satisfies readonly FeatureCatalogItem[];

export type FeatureKey = (typeof FEATURE_CATALOG)[number]["key"];

export function isFeatureKey(value: string): value is FeatureKey {
  return FEATURE_CATALOG.some((feature) => feature.key === value);
}
