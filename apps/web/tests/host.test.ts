import { describe, expect, it } from "vitest";
import { isPanelHostname } from "@/lib/pwa/host";

describe("isPanelHostname", () => {
  it("matches panel subdomain", () => {
    expect(isPanelHostname("panel.dominio.com.ar")).toBe(true);
    expect(isPanelHostname("panel.localhost:3000")).toBe(true);
  });

  it("does not match public domain", () => {
    expect(isPanelHostname("dominio.com.ar")).toBe(false);
    expect(isPanelHostname("www.dominio.com.ar")).toBe(false);
  });
});
