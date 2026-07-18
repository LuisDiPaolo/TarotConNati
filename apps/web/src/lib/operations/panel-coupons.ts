import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentPanelBusinessId } from "./panel-auth";

export type PanelCoupon = {
  id: string;
  code: string;
  description: string;
  discountType: "percent" | "fixed_amount" | "two_for_one";
  discountValue: number;
  appliesToServices: boolean;
  appliesToProducts: boolean;
  validityType: "always" | "single_date" | "weekly" | "range";
  validOnDate: string;
  validWeekdays: number[];
  startsOn: string;
  endsOn: string;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
};

type CouponRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type: PanelCoupon["discountType"];
  discount_value: number;
  applies_to_services: boolean;
  applies_to_products: boolean;
  validity_type: PanelCoupon["validityType"];
  valid_on_date: string | null;
  valid_weekdays: number[] | null;
  starts_on: string | null;
  ends_on: string | null;
  usage_limit: number | null;
  used_count: number;
  active: boolean;
};

export async function getPanelCoupons(): Promise<{ enabled: boolean; coupons: PanelCoupon[] }> {
  const supabase = await createSupabaseServerClient();
  const businessId = await getCurrentPanelBusinessId(supabase);
  if (!businessId) return { enabled: false, coupons: [] };

  const { data: enabled } = await supabase.rpc("has_feature", {
    p_business_id: businessId,
    p_feature_key: "coupons_enabled",
  });
  if (!enabled) return { enabled: false, coupons: [] };

  const { data, error } = await supabase
    .from("coupons")
    .select("id, code, description, discount_type, discount_value, applies_to_services, applies_to_products, validity_type, valid_on_date, valid_weekdays, starts_on, ends_on, usage_limit, used_count, active")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error || !data) return { enabled: true, coupons: [] };

  return {
    enabled: true,
    coupons: (data as CouponRow[]).map((coupon) => ({
      id: coupon.id,
      code: coupon.code,
      description: coupon.description ?? "",
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      appliesToServices: coupon.applies_to_services,
      appliesToProducts: coupon.applies_to_products,
      validityType: coupon.validity_type,
      validOnDate: coupon.valid_on_date ?? "",
      validWeekdays: coupon.valid_weekdays ?? [],
      startsOn: coupon.starts_on ?? "",
      endsOn: coupon.ends_on ?? "",
      usageLimit: coupon.usage_limit,
      usedCount: coupon.used_count,
      active: coupon.active,
    })),
  };
}
