import { describe, expect, it } from "vitest";
import { getBusinessHoursRuntime, parseBusinessHoursConfig, timeToMinutes } from "./business-hours";

describe("business hours helpers", () => {
  it("parses business times", () => {
    expect(timeToMinutes("09:30")).toBe(570);
    expect(Number.isNaN(timeToMinutes("99:99"))).toBe(true);
  });

  it("normalizes config and calculates runtime", () => {
    const config = parseBusinessHoursConfig({
      days: { monday: true },
      shifts: [{ label: "Manana", from: "09:00", to: "12:00", enabled: true }],
    });

    const runtime = getBusinessHoursRuntime({
      config,
      cutoffMinutes: 15,
      now: new Date("2026-01-05T13:30:00.000Z"),
      timeZone: "America/Argentina/Buenos_Aires",
    });

    expect(runtime.businessIsOpen).toBe(true);
    expect(runtime.reservationsAccepting).toBe(true);
    expect(runtime.reservationsUntil).toBe("11:45");
  });
});
