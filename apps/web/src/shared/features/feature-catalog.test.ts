import { describe, expect, it } from "vitest";
import { FEATURE_CATALOG, isFeatureKey } from "./feature-catalog";

describe("FEATURE_CATALOG", () => {
  it("keeps feature keys snake_case and ending in _enabled", () => {
    expect(FEATURE_CATALOG.length).toBeGreaterThan(0);
    for (const feature of FEATURE_CATALOG) {
      expect(feature.key).toMatch(/^[a-z0-9_]+_enabled$/);
    }
  });

  it("has no duplicate feature keys", () => {
    const keys = FEATURE_CATALOG.map((feature) => feature.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("validates known feature keys", () => {
    expect(isFeatureKey("products_enabled")).toBe(true);
    expect(isFeatureKey("products")).toBe(false);
  });
});
