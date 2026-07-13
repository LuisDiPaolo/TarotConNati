import { describe, expect, it } from "vitest";
import { normalizeBaseUrl } from "@/lib/http/base-url";

describe("normalizeBaseUrl", () => {
  it("returns origin without trailing slash", () => {
    expect(normalizeBaseUrl("https://reservas.example.com/panel/")).toBe("https://reservas.example.com");
  });

  it("returns empty string for invalid values", () => {
    expect(normalizeBaseUrl("")).toBe("");
    expect(normalizeBaseUrl("not a url")).toBe("");
  });
});
