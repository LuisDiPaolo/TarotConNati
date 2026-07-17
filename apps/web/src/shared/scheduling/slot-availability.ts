export type WeeklyAvailabilitySchedule = {
  weekday: number;
  startsAt: string;
  endsAt: string;
  breakStartsAt?: string | null;
  breakEndsAt?: string | null;
};

export type DateAvailabilityOverride = {
  overrideDate: string;
  startsAt?: string | null;
  endsAt?: string | null;
  closed: boolean;
};

export function resolveEffectiveSchedulesForDate(input: {
  dateKey: string;
  weekday: number;
  schedules: WeeklyAvailabilitySchedule[];
  overrides: DateAvailabilityOverride[];
}): WeeklyAvailabilitySchedule[] {
  const override = input.overrides.find((item) => item.overrideDate === input.dateKey);
  if (override?.closed) return [];

  if (override?.startsAt && override.endsAt) {
    return [{
      weekday: input.weekday,
      startsAt: override.startsAt,
      endsAt: override.endsAt,
      breakStartsAt: null,
      breakEndsAt: null,
    }];
  }

  return input.schedules.filter((schedule) => schedule.weekday === input.weekday);
}
