import { describe, expect, it } from "vitest";
import { publicReservationSchema, updateAppointmentStatusSchema } from "./reservations";

describe("publicReservationSchema", () => {
  it("accepts a valid reservation payload", () => {
    const parsed = publicReservationSchema.safeParse({
      serviceId: "00000000-0000-4000-8000-000000000001",
      startsAt: "2026-07-13T15:00:00.000Z",
      customer: {
        fullName: "Cliente Demo",
        phone: "+5493510000000",
        email: "cliente@example.com",
        notes: "Prefiere manana",
      },
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid customer data", () => {
    const parsed = publicReservationSchema.safeParse({
      serviceId: "00000000-0000-4000-8000-000000000001",
      startsAt: "2026-07-13T15:00:00.000Z",
      customer: { fullName: "A", phone: "1", email: "mal" },
    });

    expect(parsed.success).toBe(false);
  });
});

describe("updateAppointmentStatusSchema", () => {
  it("accepts known appointment statuses only", () => {
    expect(updateAppointmentStatusSchema.safeParse({ status: "confirmed" }).success).toBe(true);
    expect(updateAppointmentStatusSchema.safeParse({ status: "paid" }).success).toBe(false);
  });
});
