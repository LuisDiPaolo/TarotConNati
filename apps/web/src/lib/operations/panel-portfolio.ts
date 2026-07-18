import "server-only";

import { buildBrandAssetUrl } from "@/lib/storage/public-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentPanelBusinessId } from "./panel-auth";

export type PanelPortfolioItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  instagramUrl: string;
  active: boolean;
  sortOrder: number;
};

type PortfolioQueryRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  instagram_url: string | null;
  active: boolean;
  sort_order: number;
};

function mapPortfolioRow(row: PortfolioQueryRow): PanelPortfolioItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    category: row.category ?? "",
    imageUrl: buildBrandAssetUrl(row.image_url),
    instagramUrl: row.instagram_url ?? "",
    active: row.active,
    sortOrder: row.sort_order,
  };
}

export async function getPanelPortfolioItems(): Promise<{ enabled: boolean; items: PanelPortfolioItem[] }> {
  const supabase = await createSupabaseServerClient();
  const businessId = await getCurrentPanelBusinessId(supabase);
  if (!businessId) return { enabled: false, items: [] };

  const { data: enabled } = await supabase.rpc("has_feature", {
    p_business_id: businessId,
    p_feature_key: "portfolio_enabled",
  });

  if (!enabled) return { enabled: false, items: [] };

  const { data, error } = await supabase
    .from("portfolio_items")
    .select("id, title, description, category, image_url, instagram_url, active, sort_order")
    .eq("business_id", businessId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error || !data) return { enabled: true, items: [] };
  return { enabled: true, items: (data as PortfolioQueryRow[]).map(mapPortfolioRow) };
}
