import { describe, expect, it } from "vitest";
import { calculateAppointmentEnd, canTransitionAppointment, overlapsRange } from "./appointments";

describe("appointment helpers", () => {
  it("validates status transitions", () => {
    expect(canTransitionAppointment("pending", "confirmed")).toBe(true);
    expect(canTransitionAppointment("completed", "cancelled")).toBe(false);
  });

  it("calculates end time and overlap", () => {
    const startsAt = new Date("2026-01-01T10:00:00.000Z");
    expect(calculateAppointmentEnd(startsAt, 60).toISOString()).toBe("2026-01-01T11:00:00.000Z");
    expect(overlapsRange(
      { startsAt, endsAt: new Date("2026-01-01T11:00:00.000Z") },
      { startsAt: new Date("2026-01-01T10:30:00.000Z"), endsAt: new Date("2026-01-01T11:30:00.000Z") },
    )).toBe(true);
  });
});
