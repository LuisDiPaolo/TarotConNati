import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentPanelBusinessId } from "./panel-auth";

export type PanelPromotion = {
  id: string;
  title: string;
  description: string;
  discountType: "percent" | "fixed_amount";
  discountValue: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

type PromotionRow = {
  id: string;
  title: string;
  description: string | null;
  discount_type: PanelPromotion["discountType"];
  discount_value: number;
  starts_at: string | null;
  ends_at: string | null;
  active: boolean;
};

export async function getPanelPromotions(): Promise<{ enabled: boolean; promotions: PanelPromotion[] }> {
  const supabase = await createSupabaseServerClient();
  const businessId = await getCurrentPanelBusinessId(supabase);
  if (!businessId) return { enabled: false, promotions: [] };

  const { data: enabled } = await supabase.rpc("has_feature", {
    p_business_id: businessId,
    p_feature_key: "promotions_enabled",
  });

  if (!enabled) return { enabled: false, promotions: [] };

  const { data, error } = await supabase
    .from("promotions")
    .select("id, title, description, discount_type, discount_value, starts_at, ends_at, active")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error || !data) return { enabled: true, promotions: [] };

  return {
    enabled: true,
    promotions: (data as PromotionRow[]).map((promotion) => ({
      id: promotion.id,
      title: promotion.title,
      description: promotion.description ?? "",
      discountType: promotion.discount_type,
      discountValue: promotion.discount_value,
      startsAt: promotion.starts_at ?? "",
      endsAt: promotion.ends_at ?? "",
      active: promotion.active,
    })),
  };
}
