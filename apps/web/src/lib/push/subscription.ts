import { createHash } from "crypto";

export type StoredPushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export function hashPushEndpoint(endpoint: string): string {
  return createHash("sha256").update(endpoint).digest("hex");
}

export function isValidPushSubscription(value: unknown): value is StoredPushSubscription {
  if (!value || typeof value !== "object") return false;

  const subscription = value as {
    endpoint?: unknown;
    keys?: {
      p256dh?: unknown;
      auth?: unknown;
    };
  };

  return (
    typeof subscription.endpoint === "string" &&
    subscription.endpoint.startsWith("https://") &&
    typeof subscription.keys?.p256dh === "string" &&
    subscription.keys.p256dh.length > 0 &&
    typeof subscription.keys?.auth === "string" &&
    subscription.keys.auth.length > 0
  );
}

export function resolvePushSurface(value: unknown): "public" | "panel" {
  return value === "panel" ? "panel" : "public";
}
