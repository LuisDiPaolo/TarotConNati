import "server-only";

export { verifyMercadoPagoWebhookSignature } from "@/lib/payments/mercado-pago-signature";

export type MercadoPagoPayment = {
  id: number | string;
  status: string;
  currency_id: string;
  transaction_amount: number;
  external_reference?: string | null;
};

export type MercadoPagoPreference = {
  id: string;
  init_point?: string;
  sandbox_init_point?: string;
};

export async function getMercadoPagoPayment(paymentId: string, accessToken: string): Promise<MercadoPagoPayment> {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago payment lookup failed: ${response.status}`);
  }

  return await response.json() as MercadoPagoPayment;
}

export async function createMercadoPagoPreference(input: {
  accessToken: string;
  title: string;
  quantity: number;
  unitPrice: number;
  externalReference: string;
  notificationUrl?: string;
  backUrls?: {
    success: string;
    failure: string;
    pending: string;
  };
}): Promise<MercadoPagoPreference> {
  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      items: [
        {
          title: input.title,
          quantity: input.quantity,
          unit_price: input.unitPrice,
          currency_id: "ARS",
        },
      ],
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
      back_urls: input.backUrls,
      auto_return: "approved",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Mercado Pago preference creation failed: ${response.status}`);
  }

  return await response.json() as MercadoPagoPreference;
}

export function toCents(amount: number) {
  return Math.round(amount * 100);
}
