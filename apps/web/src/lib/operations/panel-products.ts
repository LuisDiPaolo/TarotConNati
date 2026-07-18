import "server-only";

import { buildBrandAssetUrl } from "@/lib/storage/public-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentPanelBusinessId } from "./panel-auth";

export type PanelProduct = {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl: string;
  pricePesos: number;
  stockQuantity: number | null;
  active: boolean;
  sortOrder: number;
};

export type PanelProductOrder = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  status: "pending_payment" | "paid" | "cancelled" | "fulfilled";
  totalPesos: number;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPricePesos: number;
    totalPesos: number;
  }>;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  price_pesos: number;
  stock_quantity: number | null;
  active: boolean;
  sort_order: number;
};

type ProductOrderRow = {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  notes: string | null;
  status: PanelProductOrder["status"];
  total_pesos: number;
  created_at: string;
  product_order_items: Array<{
    id: string;
    product_snapshot: { name?: string } | null;
    quantity: number;
    unit_price_pesos: number;
    total_pesos: number;
  }> | null;
};

export async function getPanelProducts(): Promise<{ enabled: boolean; products: PanelProduct[]; orders: PanelProductOrder[] }> {
  const supabase = await createSupabaseServerClient();
  const businessId = await getCurrentPanelBusinessId(supabase);
  if (!businessId) return { enabled: false, products: [], orders: [] };

  const { data: enabled } = await supabase.rpc("has_feature", {
    p_business_id: businessId,
    p_feature_key: "products_enabled",
  });

  if (!enabled) return { enabled: false, products: [], orders: [] };

  const [{ data: productsData }, { data: ordersData }] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, description, category, image_url, price_pesos, stock_quantity, active, sort_order")
      .eq("business_id", businessId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("product_orders")
      .select("id, customer_name, customer_phone, customer_email, notes, status, total_pesos, created_at, product_order_items(id, product_snapshot, quantity, unit_price_pesos, total_pesos)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  const products = ((productsData ?? []) as ProductRow[]).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description ?? "",
    category: product.category ?? "",
    imageUrl: buildBrandAssetUrl(product.image_url),
    pricePesos: product.price_pesos,
    stockQuantity: product.stock_quantity,
    active: product.active,
    sortOrder: product.sort_order,
  }));

  const orders = ((ordersData ?? []) as ProductOrderRow[]).map((order) => ({
    id: order.id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    customerEmail: order.customer_email ?? "",
    notes: order.notes ?? "",
    status: order.status,
    totalPesos: order.total_pesos,
    createdAt: order.created_at,
    items: (order.product_order_items ?? []).map((item) => ({
      id: item.id,
      productName: item.product_snapshot?.name ?? "Producto",
      quantity: item.quantity,
      unitPricePesos: item.unit_price_pesos,
      totalPesos: item.total_pesos,
    })),
  }));

  return { enabled: true, products, orders };
}
