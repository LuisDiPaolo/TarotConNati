import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentPanelBusinessId } from "./panel-auth";

export type PanelGiftCardStatus = "pending_payment" | "active" | "redeemed" | "cancelled" | "expired";

export type PanelGiftCard = {
  id: string;
  serviceId: string;
  serviceName: string;
  purchaserName: string;
  purchaserPhone: string;
  purchaserEmail: string;
  recipientName: string;
  recipientPhone: string;
  recipientEmail: string;
  message: string;
  code: string;
  amountPesos: number;
  status: PanelGiftCardStatus;
  activatedAt: string;
  redeemedAt: string;
  cancelledAt: string;
  expiresAt: string;
  createdAt: string;
};

export type PanelGiftCardService = {
  id: string;
  name: string;
  pricePesos: number;
};

type ServiceJoin = { name: string };

function firstJoin<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getPanelGiftCards(): Promise<{ enabled: boolean; giftCards: PanelGiftCard[]; services: PanelGiftCardService[] }> {
  const supabase = await createSupabaseServerClient();
  const businessId = await getCurrentPanelBusinessId(supabase);
  if (!businessId) return { enabled: false, giftCards: [], services: [] };

  const { data: enabled } = await supabase.rpc("has_feature", {
    p_business_id: businessId,
    p_feature_key: "gift_cards_enabled",
  });

  if (!enabled) return { enabled: false, giftCards: [], services: [] };

  const [{ data: giftCardsData }, { data: servicesData }] = await Promise.all([
    supabase
      .from("gift_cards")
      .select("id, service_id, purchaser_name, purchaser_phone, purchaser_email, recipient_name, recipient_phone, recipient_email, message, code, amount_pesos, status, activated_at, redeemed_at, cancelled_at, expires_at, created_at, services(name)")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("services")
      .select("id, name, price_pesos")
      .eq("business_id", businessId)
      .eq("active", true)
      .gt("price_pesos", 0)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  const giftCards = ((giftCardsData ?? []) as Array<{
    id: string;
    service_id: string;
    purchaser_name: string;
    purchaser_phone: string;
    purchaser_email: string | null;
    recipient_name: string;
    recipient_phone: string | null;
    recipient_email: string | null;
    message: string | null;
    code: string;
    amount_pesos: number;
    status: PanelGiftCardStatus;
    activated_at: string | null;
    redeemed_at: string | null;
    cancelled_at: string | null;
    expires_at: string | null;
    created_at: string;
    services: ServiceJoin | ServiceJoin[] | null;
  }>).map((giftCard) => ({
    id: giftCard.id,
    serviceId: giftCard.service_id,
    serviceName: firstJoin(giftCard.services)?.name ?? "Servicio",
    purchaserName: giftCard.purchaser_name,
    purchaserPhone: giftCard.purchaser_phone,
    purchaserEmail: giftCard.purchaser_email ?? "",
    recipientName: giftCard.recipient_name,
    recipientPhone: giftCard.recipient_phone ?? "",
    recipientEmail: giftCard.recipient_email ?? "",
    message: giftCard.message ?? "",
    code: giftCard.code,
    amountPesos: giftCard.amount_pesos,
    status: giftCard.status,
    activatedAt: giftCard.activated_at ?? "",
    redeemedAt: giftCard.redeemed_at ?? "",
    cancelledAt: giftCard.cancelled_at ?? "",
    expiresAt: giftCard.expires_at ?? "",
    createdAt: giftCard.created_at,
  }));

  const services = ((servicesData ?? []) as Array<{ id: string; name: string; price_pesos: number }>).map((service) => ({
    id: service.id,
    name: service.name,
    pricePesos: service.price_pesos,
  }));

  return { enabled: true, giftCards, services };
}
