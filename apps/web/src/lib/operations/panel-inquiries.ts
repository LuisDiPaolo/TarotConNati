import "server-only";

import { buildWhatsAppUrl, type InquiryStatus } from "@/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentPanelBusinessId } from "./panel-auth";

export type PanelInquirySource = "contact_form" | "booking_question" | "product_question";

export type PanelInquiry = {
  id: string;
  createdAt: string;
  updatedAt: string;
  readAt: string;
  answeredAt: string;
  answeredChannel: "panel" | "whatsapp" | "";
  convertedAt: string;
  archivedAt: string;
  status: InquiryStatus;
  source: PanelInquirySource;
  name: string;
  phone: string;
  email: string;
  message: string;
  adminNotes: string;
  whatsappUrl: string;
  appointmentId: string;
  serviceRequestId: string;
};

type InquiryQueryRow = {
  id: string;
  created_at: string;
  updated_at: string;
  read_at: string | null;
  answered_at: string | null;
  answered_channel: "panel" | "whatsapp" | null;
  converted_at: string | null;
  archived_at: string | null;
  status: InquiryStatus;
  source: PanelInquirySource;
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  admin_notes: string | null;
  appointment_id: string | null;
  service_request_id: string | null;
};

function buildInquiryWhatsAppMessage(inquiry: Pick<PanelInquiry, "name" | "message">) {
  const preview = inquiry.message.trim().replace(/\s+/g, " ").slice(0, 140);
  return `Hola ${inquiry.name}, te escribimos por tu consulta: "${preview}". ¿Querés que coordinemos un turno?`;
}

function mapInquiryRow(row: InquiryQueryRow): PanelInquiry {
  const phone = row.phone ?? "";
  const inquiry = {
    id: row.id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    readAt: row.read_at ?? "",
    answeredAt: row.answered_at ?? "",
    answeredChannel: row.answered_channel ?? "",
    convertedAt: row.converted_at ?? "",
    archivedAt: row.archived_at ?? "",
    status: row.status,
    source: row.source,
    name: row.name,
    phone,
    email: row.email ?? "",
    message: row.message,
    adminNotes: row.admin_notes ?? "",
    whatsappUrl: "",
    appointmentId: row.appointment_id ?? "",
    serviceRequestId: row.service_request_id ?? "",
  } satisfies PanelInquiry;

  return {
    ...inquiry,
    whatsappUrl: phone ? buildWhatsAppUrl({ phone, message: buildInquiryWhatsAppMessage(inquiry) }) : "",
  };
}

export async function getPanelInquiries(): Promise<{ enabled: boolean; inquiries: PanelInquiry[] }> {
  const supabase = await createSupabaseServerClient();
  const businessId = await getCurrentPanelBusinessId(supabase);
  if (!businessId) return { enabled: false, inquiries: [] };

  const { data: enabled } = await supabase.rpc("has_feature", {
    p_business_id: businessId,
    p_feature_key: "inquiries_enabled",
  });

  if (!enabled) return { enabled: false, inquiries: [] };

  const selectWithWorkflow = "id, created_at, updated_at, read_at, answered_at, answered_channel, converted_at, archived_at, status, source, name, phone, email, message, admin_notes, appointment_id, service_request_id";
  const { data, error } = await supabase
    .from("inquiries")
    .select(selectWithWorkflow)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error?.message?.includes("read_at") || error?.message?.includes("appointment_id")) {
    const fallback = await supabase
      .from("inquiries")
      .select("id, created_at, updated_at, status, source, name, phone, email, message, admin_notes")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (fallback.error || !fallback.data) return { enabled: true, inquiries: [] };
    const fallbackRows = fallback.data.map((row) => ({
      ...row,
      read_at: null,
      answered_at: row.status === "routed_whatsapp" ? row.updated_at : null,
      answered_channel: row.status === "routed_whatsapp" ? "whatsapp" : null,
      converted_at: null,
      archived_at: row.status === "archived" ? row.updated_at : null,
      appointment_id: null,
      service_request_id: null,
      status: row.status === "routed_whatsapp" ? "answered_whatsapp" : row.status,
    })) as InquiryQueryRow[];
    return { enabled: true, inquiries: fallbackRows.map(mapInquiryRow) };
  }

  if (error || !data) return { enabled: true, inquiries: [] };
  return { enabled: true, inquiries: (data as InquiryQueryRow[]).map(mapInquiryRow) };
}
