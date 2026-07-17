export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";

const VALID_APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "no_show", "cancelled"],
  cancelled: [],
  completed: [],
  no_show: [],
};

export function canTransitionAppointment(from: AppointmentStatus, to: AppointmentStatus) {
  return (VALID_APPOINTMENT_TRANSITIONS[from] ?? []).includes(to);
}

export function assertAppointmentTransition(from: AppointmentStatus, to: AppointmentStatus) {
  if (!canTransitionAppointment(from, to)) {
    throw new Error("INVALID_APPOINTMENT_TRANSITION");
  }
}

export function calculateAppointmentEnd(startsAt: Date, durationMinutes: number) {
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new Error("INVALID_DURATION");
  }

  return new Date(startsAt.getTime() + durationMinutes * 60_000);
}

export function overlapsRange(a: { startsAt: Date; endsAt: Date }, b: { startsAt: Date; endsAt: Date }) {
  return a.startsAt < b.endsAt && b.startsAt < a.endsAt;
}
