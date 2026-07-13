import { describe, expect, it } from "vitest";
import { hashPushEndpoint, isValidPushSubscription, resolvePushSurface } from "@/lib/push/subscription";

describe("push subscription helpers", () => {
  it("validates Web Push subscriptions", () => {
    expect(isValidPushSubscription({
      endpoint: "https://push.example/subscription/1",
      keys: { p256dh: "public-key", auth: "auth-secret" },
    })).toBe(true);

    expect(isValidPushSubscription({ endpoint: "http://insecure.example", keys: { p256dh: "x", auth: "y" } })).toBe(false);
    expect(isValidPushSubscription({ endpoint: "https://push.example" })).toBe(false);
  });

  it("hashes endpoints deterministically", () => {
    expect(hashPushEndpoint("https://push.example/subscription/1")).toBe(hashPushEndpoint("https://push.example/subscription/1"));
    expect(hashPushEndpoint("https://push.example/subscription/1")).not.toBe(hashPushEndpoint("https://push.example/subscription/2"));
  });

  it("normalizes push surface", () => {
    expect(resolvePushSurface("panel")).toBe("panel");
    expect(resolvePushSurface("anything")).toBe("public");
  });
});
