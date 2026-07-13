import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type PanelCustomerSummary = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  notes: string;
  createdAt: string;
};

export type PanelCustomerDetail = PanelCustomerSummary & {
  appointments: Array<{ id: string; startsAt: string; status: string; serviceName: string }>;
  requests: Array<{ id: string; createdAt: string; status: string; serviceName: string; preferredDate: string; preferredWindow: string }>;
};

type ServiceJoin = { name: string };

function firstJoin<T>(value: T | T[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function getPanelCustomers(): Promise<PanelCustomerSummary[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, full_name, phone, email, notes, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(120);

  if (error || !data) return [];

  return data.map((customer) => ({
    id: customer.id,
    fullName: customer.full_name,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    notes: customer.notes ?? "",
    createdAt: customer.created_at,
  }));
}

export async function getPanelCustomerDetail(customerId: string): Promise<PanelCustomerDetail | null> {
  const supabase = await createSupabaseServerClient();
  const [{ data: customer, error: customerError }, { data: appointments }, { data: requests }] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, phone, email, notes, created_at")
      .eq("id", customerId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("appointments")
      .select("id, starts_at, status, services(name)")
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("starts_at", { ascending: false })
      .limit(40),
    supabase
      .from("service_requests")
      .select("id, created_at, status, preferred_date, preferred_window, services(name)")
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  if (customerError || !customer) return null;

  return {
    id: customer.id,
    fullName: customer.full_name,
    phone: customer.phone ?? "",
    email: customer.email ?? "",
    notes: customer.notes ?? "",
    createdAt: customer.created_at,
    appointments: ((appointments ?? []) as Array<{ id: string; starts_at: string; status: string; services: ServiceJoin | ServiceJoin[] | null }>).map((appointment) => ({
      id: appointment.id,
      startsAt: appointment.starts_at,
      status: appointment.status,
      serviceName: firstJoin(appointment.services)?.name ?? "Servicio",
    })),
    requests: ((requests ?? []) as Array<{ id: string; created_at: string; status: string; preferred_date: string | null; preferred_window: string | null; services: ServiceJoin | ServiceJoin[] | null }>).map((request) => ({
      id: request.id,
      createdAt: request.created_at,
      status: request.status,
      serviceName: firstJoin(request.services)?.name ?? "Servicio",
      preferredDate: request.preferred_date ?? "",
      preferredWindow: request.preferred_window ?? "",
    })),
  };
}
