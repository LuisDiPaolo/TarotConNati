import { describe, expect, it } from "vitest";
import { businessSettingsSchema, scheduleOverrideSchema, serviceSettingsSchema, weeklyScheduleSchema } from "./configuration";

describe("businessSettingsSchema", () => {
  it("accepts valid white-label business settings", () => {
    expect(businessSettingsSchema.safeParse({
      name: "Barberia Centro",
      slug: "barberia-centro",
      description: "Turnos con sena online.",
      whatsappPhone: "+5493510000000",
      publicDomain: "reservas.negocio.com.ar",
      brandPrimary: "#101820",
      brandAccent: "#00A878",
      themeBackground: "#101820",
      brandRadius: "8px",
      defaultThemeMode: "brand",
    }).success).toBe(true);
  });

  it("rejects unsafe slug formats", () => {
    expect(businessSettingsSchema.safeParse({
      name: "Barberia Centro",
      slug: "Barberia Centro",
      brandPrimary: "#101820",
      brandAccent: "#00A878",
      themeBackground: "#101820",
      brandRadius: "8px",
      defaultThemeMode: "light",
    }).success).toBe(false);
  });
});

describe("serviceSettingsSchema", () => {
  it("rejects deposits greater than the service price", () => {
    expect(serviceSettingsSchema.safeParse({
      name: "Corte",
      description: "",
      category: "General",
      durationMinutes: 45,
      pricePesos: 5000,
      depositPesos: 6000,
      paymentMode: "deposit",
      active: true,
      sortOrder: 1,
    }).success).toBe(false);
  });
});

describe("weeklyScheduleSchema", () => {
  it("accepts a valid workday with break", () => {
    expect(weeklyScheduleSchema.safeParse({
      weekday: 1,
      startsAt: "09:00",
      endsAt: "18:00",
      breakStartsAt: "13:00",
      breakEndsAt: "14:00",
      active: true,
    }).success).toBe(true);
  });

  it("rejects breaks outside the workday", () => {
    expect(weeklyScheduleSchema.safeParse({
      weekday: 1,
      startsAt: "09:00",
      endsAt: "18:00",
      breakStartsAt: "08:00",
      breakEndsAt: "09:30",
      active: true,
    }).success).toBe(false);
  });
});

describe("scheduleOverrideSchema", () => {
  it("accepts a closed date without times", () => {
    expect(scheduleOverrideSchema.safeParse({
      overrideDate: "2026-08-17",
      startsAt: "",
      endsAt: "",
      closed: true,
      reason: "Feriado",
    }).success).toBe(true);
  });

  it("accepts exceptional opening times", () => {
    expect(scheduleOverrideSchema.safeParse({
      overrideDate: "2026-08-17",
      startsAt: "10:00",
      endsAt: "15:00",
      closed: false,
      reason: "Horario reducido",
    }).success).toBe(true);
  });

  it("rejects partial exceptional times", () => {
    expect(scheduleOverrideSchema.safeParse({
      overrideDate: "2026-08-17",
      startsAt: "10:00",
      endsAt: "",
      closed: false,
      reason: "Horario reducido",
    }).success).toBe(false);
  });
});
