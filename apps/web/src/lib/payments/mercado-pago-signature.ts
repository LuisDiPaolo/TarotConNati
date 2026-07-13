import { createHmac, timingSafeEqual } from "crypto";

function parseSignatureHeader(value: string) {
  const parts = Object.fromEntries(value.split(",").map((part) => {
    const [key = "", rawValue = ""] = part.trim().split("=");
    return [key, rawValue];
  }));

  return { ts: parts.ts, v1: parts.v1 };
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a, "hex");
  const bBuffer = Buffer.from(b, "hex");
  return aBuffer.length === bBuffer.length && timingSafeEqual(aBuffer, bBuffer);
}

export function buildMercadoPagoSignatureManifest(input: { dataId: string; xRequestId: string; ts: string }) {
  return `id:${input.dataId};request-id:${input.xRequestId};ts:${input.ts};`;
}

export function signMercadoPagoManifest(manifest: string, secret: string) {
  return createHmac("sha256", secret).update(manifest).digest("hex");
}

export function verifyMercadoPagoWebhookSignature(input: {
  xSignature: string;
  xRequestId: string;
  dataId: string;
  secret: string;
}) {
  const { ts, v1 } = parseSignatureHeader(input.xSignature);
  if (!ts || !v1 || !input.xRequestId || !input.dataId || !input.secret) return false;

  const manifest = buildMercadoPagoSignatureManifest({ dataId: input.dataId, xRequestId: input.xRequestId, ts });
  const expected = signMercadoPagoManifest(manifest, input.secret);
  return safeEqual(expected, v1);
}
