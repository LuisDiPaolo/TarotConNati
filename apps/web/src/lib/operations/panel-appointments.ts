import "server-only";

import { formatARS } from "@turnos/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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
};

type CustomerJoin = { full_name: string; phone: string | null; email: string | null };
type ServiceJoin = { name: string };

type AppointmentQueryRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: PanelAppointment["status"];
  notes: string | null;
  customers: CustomerJoin | CustomerJoin[] | null;
  services: ServiceJoin | ServiceJoin[] | null;
  payments: Array<{ status: string; amount_cents: number }> | null;
};

function firstJoin<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getPanelAppointments(): Promise<PanelAppointment[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at, status, notes, customers(full_name, phone, email), services(name), payments(status, amount_cents)")
    .is("deleted_at", null)
    .order("starts_at", { ascending: true })
    .limit(60);

  if (error || !data) return [];

  return (data as unknown as AppointmentQueryRow[]).map((appointment) => {
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
      paymentAmount: payment ? formatARS(payment.amount_cents / 100) : "-",
    };
  });
}
