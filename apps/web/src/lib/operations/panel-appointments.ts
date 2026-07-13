import "server-only";

import { formatARS } from "@turnos/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PanelAppointmentIntakeResponse = {
  formName: string;
  answers: Array<{ label: string; value: string }>;
};

export type PanelAppointment = {
  id: string;
  startsAt: string;
  endsAt: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  notes: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceName: string;
  paymentStatus: string;
  paymentAmount: string;
  intakeResponses: PanelAppointmentIntakeResponse[];
};

type CustomerJoin = { full_name: string; phone: string | null; email: string | null };
type ServiceJoin = { name: string };

type AppointmentIntakeJoin = {
  form_snapshot: {
    name?: string;
    fields?: Array<{ fieldKey?: string; label?: string }>;
  } | null;
  response: Record<string, unknown> | null;
};

type AppointmentQueryRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: PanelAppointment["status"];
  notes: string | null;
  customers: CustomerJoin | CustomerJoin[] | null;
  services: ServiceJoin | ServiceJoin[] | null;
  payments: Array<{ status: string; amount_pesos: number }> | null;
  appointment_intake_responses: AppointmentIntakeJoin[] | null;
};

function firstJoin<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatAnswerValue(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  if (typeof value === "boolean") return value ? "Si" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  return "";
}

function mapIntakeResponses(rows: AppointmentIntakeJoin[] | null | undefined): PanelAppointmentIntakeResponse[] {
  return (rows ?? []).map((row) => {
    const fields = row.form_snapshot?.fields ?? [];
    const labelsByKey = new Map(fields.map((field) => [field.fieldKey, field.label]));
    return {
      formName: row.form_snapshot?.name ?? "Formulario",
      answers: Object.entries(row.response ?? {})
        .map(([key, value]) => ({ label: labelsByKey.get(key) ?? key, value: formatAnswerValue(value) }))
        .filter((answer) => answer.value.length > 0),
    };
  }).filter((response) => response.answers.length > 0);
}

function mapAppointmentRow(appointment: AppointmentQueryRow): PanelAppointment {
  const customer = firstJoin(appointment.customers);
  const service = firstJoin(appointment.services);
  const payment = appointment.payments?.[0];
  return {
    id: appointment.id,
    startsAt: appointment.starts_at,
    endsAt: appointment.ends_at,
    status: appointment.status,
    notes: appointment.notes ?? "",
    customerName: customer?.full_name ?? "Sin nombre",
    customerPhone: customer?.phone ?? "",
    customerEmail: customer?.email ?? "",
    serviceName: service?.name ?? "Servicio",
    paymentStatus: payment?.status ?? "sin_pago",
    paymentAmount: payment ? formatARS(payment.amount_pesos) : "-",
    intakeResponses: mapIntakeResponses(appointment.appointment_intake_responses),
  };
}

export async function getPanelAppointments(): Promise<PanelAppointment[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, notes, customers(full_name, phone, email), services(name), payments(status, amount_pesos), appointment_intake_responses(form_snapshot, response)")
    .is("deleted_at", null)
    .order("starts_at", { ascending: true })
    .limit(60);

  if (error || !data) return [];

  return (data as unknown as AppointmentQueryRow[]).map(mapAppointmentRow);
}

export async function getPanelAppointmentDetail(appointmentId: string): Promise<PanelAppointment | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, notes, customers(full_name, phone, email), services(name), payments(status, amount_pesos), appointment_intake_responses(form_snapshot, response)")
    .eq("id", appointmentId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return mapAppointmentRow(data as unknown as AppointmentQueryRow);
}
