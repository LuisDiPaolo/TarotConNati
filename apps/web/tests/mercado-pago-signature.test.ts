import { describe, expect, it } from "vitest";
import {
  buildMercadoPagoSignatureManifest,
  signMercadoPagoManifest,
  verifyMercadoPagoWebhookSignature,
} from "@/lib/payments/mercado-pago-signature";

describe("Mercado Pago webhook signature", () => {
  it("validates the expected x-signature", () => {
    const secret = "test-secret";
    const ts = "1710000000";
    const dataId = "123456";
    const xRequestId = "request-1";
    const manifest = buildMercadoPagoSignatureManifest({ dataId, xRequestId, ts });
    const v1 = signMercadoPagoManifest(manifest, secret);

    expect(verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId,
      dataId,
      secret,
    })).toBe(true);

    expect(verifyMercadoPagoWebhookSignature({
      xSignature: `ts=${ts},v1=${v1}`,
      xRequestId: "other-request",
      dataId,
      secret,
    })).toBe(false);
  });
});
