import { describe, expect, it } from "vitest";
import { resolveEffectiveSchedulesForDate } from "./slot-availability";

const mondaySchedule = { weekday: 1, startsAt: "09:00", endsAt: "18:00", breakStartsAt: "13:00", breakEndsAt: "14:00" };
const tuesdaySchedule = { weekday: 2, startsAt: "10:00", endsAt: "17:00", breakStartsAt: null, breakEndsAt: null };
const weeklySchedules = [mondaySchedule, tuesdaySchedule];

describe("resolveEffectiveSchedulesForDate", () => {
  it("returns weekly schedules when there is no override", () => {
    expect(resolveEffectiveSchedulesForDate({
      dateKey: "2026-07-13",
      weekday: 1,
      schedules: weeklySchedules,
      overrides: [],
    })).toEqual([mondaySchedule]);
  });

  it("closes a date when the override is closed", () => {
    expect(resolveEffectiveSchedulesForDate({
      dateKey: "2026-07-13",
      weekday: 1,
      schedules: weeklySchedules,
      overrides: [{ overrideDate: "2026-07-13", startsAt: null, endsAt: null, closed: true }],
    })).toEqual([]);
  });

  it("replaces weekly schedules with exceptional hours", () => {
    expect(resolveEffectiveSchedulesForDate({
      dateKey: "2026-07-13",
      weekday: 1,
      schedules: weeklySchedules,
      overrides: [{ overrideDate: "2026-07-13", startsAt: "11:00", endsAt: "15:00", closed: false }],
    })).toEqual([{ weekday: 1, startsAt: "11:00", endsAt: "15:00", breakStartsAt: null, breakEndsAt: null }]);
  });
});
