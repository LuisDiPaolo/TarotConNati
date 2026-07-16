import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentPanelBusinessId } from "./panel-auth";

export type PanelServiceRequestIntakeResponse = {
  formName: string;
  answers: Array<{ label: string; value: string }>;
};

export type PanelServiceRequest = {
  id: string;
  createdAt: string;
  status: "pending_review" | "pending_coordination" | "converted" | "closed" | "cancelled";
  contactChannel: "whatsapp" | "phone" | "email";
  preferredDate: string;
  preferredWindow: string;
  customerNotes: string;
  adminNotes: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  serviceName: string;
  intakeResponses: PanelServiceRequestIntakeResponse[];
};

type CustomerJoin = { full_name: string; phone: string | null; email: string | null };
type ServiceJoin = { name: string };

type RequestIntakeJoin = {
  form_snapshot: {
    name?: string;
    fields?: Array<{ fieldKey?: string; label?: string }>;
  } | null;
  response: Record<string, unknown> | null;
};

type ServiceRequestQueryRow = {
  id: string;
  created_at: string;
  status: PanelServiceRequest["status"];
  contact_channel: PanelServiceRequest["contactChannel"];
  preferred_date: string | null;
  preferred_window: string | null;
  customer_notes: string | null;
  admin_notes: string | null;
  customers: CustomerJoin | CustomerJoin[] | null;
  services: ServiceJoin | ServiceJoin[] | null;
  service_request_intake_responses: RequestIntakeJoin[] | null;
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

function mapIntakeResponses(rows: RequestIntakeJoin[] | null | undefined): PanelServiceRequestIntakeResponse[] {
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

function mapServiceRequestRow(request: ServiceRequestQueryRow): PanelServiceRequest {
  const customer = firstJoin(request.customers);
  const service = firstJoin(request.services);
  return {
    id: request.id,
    createdAt: request.created_at,
    status: request.status,
    contactChannel: request.contact_channel,
    preferredDate: request.preferred_date ?? "",
    preferredWindow: request.preferred_window ?? "",
    customerNotes: request.customer_notes ?? "",
    adminNotes: request.admin_notes ?? "",
    customerName: customer?.full_name ?? "Sin nombre",
    customerPhone: customer?.phone ?? "",
    customerEmail: customer?.email ?? "",
    serviceName: service?.name ?? "Servicio",
    intakeResponses: mapIntakeResponses(request.service_request_intake_responses),
  };
}

export async function getPanelServiceRequests(): Promise<PanelServiceRequest[]> {
  const supabase = await createSupabaseServerClient();
  const businessId = await getCurrentPanelBusinessId(supabase);
  if (!businessId) return [];

  const { data, error } = await supabase
    .from("service_requests")
    .select("id, created_at, status, contact_channel, preferred_date, preferred_window, customer_notes, admin_notes, customers(full_name, phone, email), services(name), service_request_intake_responses(form_snapshot, response)")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error || !data) return [];

  return (data as unknown as ServiceRequestQueryRow[]).map(mapServiceRequestRow);
}

export async function getPanelServiceRequestDetail(serviceRequestId: string): Promise<PanelServiceRequest | null> {
  const supabase = await createSupabaseServerClient();
  const businessId = await getCurrentPanelBusinessId(supabase);
  if (!businessId) return null;

  const { data, error } = await supabase
    .from("service_requests")
    .select("id, created_at, status, contact_channel, preferred_date, preferred_window, customer_notes, admin_notes, customers(full_name, phone, email), services(name), service_request_intake_responses(form_snapshot, response)")
    .eq("id", serviceRequestId)
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return mapServiceRequestRow(data as unknown as ServiceRequestQueryRow);
}
