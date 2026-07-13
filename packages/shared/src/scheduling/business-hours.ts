export type DayKey = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type BusinessShift = {
  label: string;
  from: string;
  to: string;
  enabled: boolean;
};

export type BusinessHoursConfig = {
  days: Record<DayKey, boolean>;
  shifts: BusinessShift[];
  dayShiftOverrides?: Partial<Record<DayKey, boolean[]>>;
};

export type BusinessHoursRuntime = {
  businessIsOpen: boolean;
  reservationsAccepting: boolean;
  todayHoursLabel: string;
  currentShiftLabel: string;
  reservationsUntil: string;
};

export const DEFAULT_RESERVATION_CUTOFF_MINUTES = 15;
export const DAY_ORDER: DayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
export const DAY_LABELS: Record<DayKey, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miercoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sabado",
  sunday: "Domingo",
};

export const DEFAULT_BUSINESS_HOURS: BusinessHoursConfig = {
  days: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false },
  shifts: [{ label: "Horario", from: "09:00", to: "18:00", enabled: true }],
  dayShiftOverrides: {},
};

const weekdayByIndex: DayKey[] = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$|^24:00$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isValidBusinessTime(value: string) {
  return timePattern.test(value);
}

export function timeToMinutes(value: string) {
  if (value === "24:00") return 24 * 60;
  if (!isValidBusinessTime(value)) return Number.NaN;
  const [hours = 0, minutes = 0] = value.split(":").map((part) => Number.parseInt(part, 10));
  return hours * 60 + minutes;
}

export function formatMinutesAsTime(totalMinutes: number) {
  const clamped = Math.max(0, Math.min(24 * 60, totalMinutes));
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parseReservationCutoffMinutes(value: unknown) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 180) return DEFAULT_RESERVATION_CUTOFF_MINUTES;
  return parsed;
}

export function normalizeBusinessHoursConfig(value: unknown): BusinessHoursConfig {
  if (!isRecord(value)) return DEFAULT_BUSINESS_HOURS;

  const rawDays = isRecord(value.days) ? value.days : {};
  const days = DAY_ORDER.reduce((result, day) => {
    result[day] = typeof rawDays[day] === "boolean" ? rawDays[day] : DEFAULT_BUSINESS_HOURS.days[day];
    return result;
  }, {} as Record<DayKey, boolean>);

  const rawShifts = Array.isArray(value.shifts) ? value.shifts : [];
  const shifts = rawShifts.map((shift): BusinessShift | null => {
    if (!isRecord(shift)) return null;
    const label = typeof shift.label === "string" && shift.label.trim() ? shift.label.trim().slice(0, 40) : "Horario";
    const from = typeof shift.from === "string" ? shift.from : "";
    const to = typeof shift.to === "string" ? shift.to : "";
    const enabled = typeof shift.enabled === "boolean" ? shift.enabled : true;
    return { label, from, to, enabled };
  }).filter((shift): shift is BusinessShift => Boolean(shift));

  return {
    days,
    shifts: shifts.length > 0 ? shifts : DEFAULT_BUSINESS_HOURS.shifts,
    dayShiftOverrides: isRecord(value.dayShiftOverrides) ? value.dayShiftOverrides as Partial<Record<DayKey, boolean[]>> : {},
  };
}

export function parseBusinessHoursConfig(value: unknown): BusinessHoursConfig {
  if (typeof value !== "string") return normalizeBusinessHoursConfig(value);
  try {
    return normalizeBusinessHoursConfig(JSON.parse(value));
  } catch {
    return DEFAULT_BUSINESS_HOURS;
  }
}

export function serializeBusinessHoursConfig(config: BusinessHoursConfig = DEFAULT_BUSINESS_HOURS) {
  return JSON.stringify(normalizeBusinessHoursConfig(config));
}

export function getEnabledShiftsForDay(config: BusinessHoursConfig, day: DayKey) {
  const normalized = normalizeBusinessHoursConfig(config);
  if (!normalized.days[day]) return [];

  return normalized.shifts.filter((shift, index) => {
    const enabledForDay = normalized.dayShiftOverrides?.[day]?.[index] ?? true;
    return enabledForDay && shift.enabled && isValidBusinessTime(shift.from) && isValidBusinessTime(shift.to);
  });
}

function getBusinessNowParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Sun";
  const hour = Number.parseInt(parts.find((part) => part.type === "hour")?.value ?? "0", 10);
  const minute = Number.parseInt(parts.find((part) => part.type === "minute")?.value ?? "0", 10);
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  return { day: weekdayByIndex[weekdayIndex >= 0 ? weekdayIndex : 0] ?? "sunday", minutes: (hour === 24 ? 0 : hour) * 60 + minute };
}

function isInsideShift(nowMinutes: number, fromMinutes: number, toMinutes: number) {
  if (toMinutes > fromMinutes) return nowMinutes >= fromMinutes && nowMinutes < toMinutes;
  return nowMinutes >= fromMinutes || nowMinutes < toMinutes;
}

function getCutoffEnd(fromMinutes: number, toMinutes: number, cutoffMinutes: number) {
  const normalizedTo = toMinutes > fromMinutes ? toMinutes : toMinutes + 24 * 60;
  return normalizedTo - cutoffMinutes;
}

export function getBusinessHoursRuntime(input: {
  config: unknown;
  cutoffMinutes?: unknown;
  now?: Date;
  timeZone?: string;
}): BusinessHoursRuntime {
  const config = parseBusinessHoursConfig(input.config);
  const cutoffMinutes = parseReservationCutoffMinutes(input.cutoffMinutes);
  const current = getBusinessNowParts(input.now ?? new Date(), input.timeZone ?? "America/Argentina/Buenos_Aires");
  const enabledShifts = getEnabledShiftsForDay(config, current.day);
  const todayHoursLabel = enabledShifts.length > 0 ? enabledShifts.map((shift) => `${shift.label} ${shift.from}-${shift.to}`).join(" / ") : "Cerrado";

  for (const shift of enabledShifts) {
    const fromMinutes = timeToMinutes(shift.from);
    const toMinutes = timeToMinutes(shift.to);
    if (!isInsideShift(current.minutes, fromMinutes, toMinutes)) continue;

    const effectiveNow = toMinutes > fromMinutes || current.minutes >= fromMinutes ? current.minutes : current.minutes + 24 * 60;
    const cutoffEnd = getCutoffEnd(fromMinutes, toMinutes, cutoffMinutes);

    return {
      businessIsOpen: true,
      reservationsAccepting: effectiveNow < cutoffEnd,
      todayHoursLabel,
      currentShiftLabel: shift.label,
      reservationsUntil: formatMinutesAsTime(cutoffEnd % (24 * 60)),
    };
  }

  return { businessIsOpen: false, reservationsAccepting: false, todayHoursLabel, currentShiftLabel: "", reservationsUntil: "" };
}
