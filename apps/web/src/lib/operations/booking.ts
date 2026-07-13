import "server-only";

import { calculateAppointmentEnd, formatARS, resolveEffectiveSchedulesForDate } from "@turnos/shared";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { ResolvedBusiness } from "@/lib/business/resolve";
import type { PublicBookingData, PublicService, PublicSlot } from "@/lib/operations/booking.types";

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  timezone: string;
  currency: string;
  locale: string;
  brand_primary: string;
  brand_accent: string;
  brand_radius: string;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  duration_minutes: number;
  price_cents: number;
  deposit_cents: number;
  payment_mode: "deposit" | "full" | "none";
  sort_order: number;
};

type ScheduleRow = {
  weekday: number;
  starts_at: string;
  ends_at: string;
  break_starts_at: string | null;
  break_ends_at: string | null;
};

type EffectiveSchedule = {
  weekday: number;
  startsAt: string;
  endsAt: string;
  breakStartsAt: string | null;
  breakEndsAt: string | null;
};

type ScheduleOverrideRow = {
  override_date: string;
  starts_at: string | null;
  ends_at: string | null;
  closed: boolean;
};

type AppointmentRow = {
  starts_at: string;
  ends_at: string;
};


function toMoneyLabel(cents: number) {
  return formatARS(cents / 100);
}

function timeToMinutes(value: string) {
  const [hours = "0", minutes = "0"] = value.slice(0, 5).split(":");
  return Number.parseInt(hours, 10) * 60 + Number.parseInt(minutes, 10);
}

function localDateKey(parts: { year: number; month: number; day: number }) {
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function formatSlotLabel(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getWeekdayIndex(date: Date, timeZone: string) {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return Math.max(0, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday));
}

function getLocalDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value ?? date.getUTCFullYear()),
    month: Number(parts.find((part) => part.type === "month")?.value ?? date.getUTCMonth() + 1),
    day: Number(parts.find((part) => part.type === "day")?.value ?? date.getUTCDate()),
  };
}

function zonedTimeToUtc(input: { year: number; month: number; day: number; hour: number; minute: number; timeZone: string }) {
  const guess = new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute));
  const actual = getLocalDateParts(guess, input.timeZone);
  const actualStart = Date.UTC(actual.year, actual.month - 1, actual.day, input.hour, input.minute);
  const expectedStart = Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute);
  const offset = actualStart - expectedStart;
  return new Date(guess.getTime() - offset);
}

function overlaps(candidate: { startsAt: Date; endsAt: Date }, appointments: AppointmentRow[]) {
  return appointments.some((appointment) => {
    const startsAt = new Date(appointment.starts_at);
    const endsAt = new Date(appointment.ends_at);
    return candidate.startsAt < endsAt && startsAt < candidate.endsAt;
  });
}

async function getBusiness(businessId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("business")
    .select("id, name, slug, description, timezone, currency, locale, brand_primary, brand_accent, brand_radius")
    .eq("id", businessId)
    .maybeSingle();

  if (error || !data) return null;
  return data as BusinessRow;
}

export async function getPublicBookingData(resolvedBusiness: ResolvedBusiness): Promise<PublicBookingData | null> {
  const supabase = createSupabaseAdminClient();
  const business = await getBusiness(resolvedBusiness.id);
  if (!business) return null;

  const now = new Date();
  const todayParts = getLocalDateParts(now, business.timezone);
  const untilParts = getLocalDateParts(new Date(now.getTime() + 13 * 24 * 60 * 60_000), business.timezone);

  const [{ data: servicesData }, { data: schedulesData }, { data: overridesData }, { data: appointmentsData }] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, description, category, duration_minutes, price_cents, deposit_cents, payment_mode, sort_order")
      .eq("business_id", business.id)
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("schedules")
      .select("weekday, starts_at, ends_at, break_starts_at, break_ends_at")
      .eq("business_id", business.id)
      .eq("active", true),
    supabase
      .from("schedule_overrides")
      .select("override_date, starts_at, ends_at, closed")
      .eq("business_id", business.id)
      .gte("override_date", localDateKey(todayParts))
      .lte("override_date", localDateKey(untilParts)),
    supabase
      .from("appointments")
      .select("starts_at, ends_at")
      .eq("business_id", business.id)
      .is("deleted_at", null)
      .neq("status", "cancelled")
      .gte("starts_at", now.toISOString()),
  ]);

  const services = ((servicesData ?? []) as ServiceRow[]).map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description ?? "",
    category: service.category ?? "General",
    durationMinutes: service.duration_minutes,
    priceCents: service.price_cents,
    depositCents: service.deposit_cents,
    paymentMode: service.payment_mode,
    priceLabel: toMoneyLabel(service.price_cents),
    depositLabel: toMoneyLabel(service.deposit_cents),
  }));

  const schedules: EffectiveSchedule[] = ((schedulesData ?? []) as ScheduleRow[]).map((schedule) => ({
    weekday: schedule.weekday,
    startsAt: schedule.starts_at,
    endsAt: schedule.ends_at,
    breakStartsAt: schedule.break_starts_at,
    breakEndsAt: schedule.break_ends_at,
  }));
  const overrides = ((overridesData ?? []) as ScheduleOverrideRow[]).map((override) => ({
    overrideDate: override.override_date,
    startsAt: override.starts_at,
    endsAt: override.ends_at,
    closed: override.closed,
  }));
  const appointments = (appointmentsData ?? []) as AppointmentRow[];
  const slotsByService: Record<string, PublicSlot[]> = {};

  for (const service of services) {
    const slots: PublicSlot[] = [];

    for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
      const cursor = new Date(now.getTime() + dayOffset * 24 * 60 * 60_000);
      const localParts = getLocalDateParts(cursor, business.timezone);
      const localNoon = zonedTimeToUtc({ ...localParts, hour: 12, minute: 0, timeZone: business.timezone });
      const weekday = getWeekdayIndex(localNoon, business.timezone);
      const daySchedules = resolveEffectiveSchedulesForDate({
        dateKey: localDateKey(localParts),
        weekday,
        schedules,
        overrides,
      });

      for (const schedule of daySchedules) {
        const startMinutes = timeToMinutes(schedule.startsAt);
        const endMinutes = timeToMinutes(schedule.endsAt);
        const breakStart = schedule.breakStartsAt ? timeToMinutes(schedule.breakStartsAt) : null;
        const breakEnd = schedule.breakEndsAt ? timeToMinutes(schedule.breakEndsAt) : null;

        for (let minute = startMinutes; minute + service.durationMinutes <= endMinutes; minute += 30) {
          if (breakStart !== null && breakEnd !== null && minute < breakEnd && minute + service.durationMinutes > breakStart) continue;

          const startsAt = zonedTimeToUtc({
            ...localParts,
            hour: Math.floor(minute / 60),
            minute: minute % 60,
            timeZone: business.timezone,
          });
          const endsAt = calculateAppointmentEnd(startsAt, service.durationMinutes);
          if (startsAt <= now) continue;
          if (overlaps({ startsAt, endsAt }, appointments)) continue;

          slots.push({ serviceId: service.id, startsAt: startsAt.toISOString(), label: formatSlotLabel(startsAt, business.timezone) });
          if (slots.length >= 12) break;
        }

        if (slots.length >= 12) break;
      }

      if (slots.length >= 12) break;
    }

    slotsByService[service.id] = slots;
  }

  return {
    business: {
      id: business.id,
      name: business.name,
      slug: business.slug,
      description: business.description ?? "",
      timezone: business.timezone,
      brandPrimary: business.brand_primary,
      brandAccent: business.brand_accent,
      brandRadius: business.brand_radius,
    },
    services,
    slotsByService,
  };
}
