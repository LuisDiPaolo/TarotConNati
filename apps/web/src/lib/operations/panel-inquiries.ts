import "server-only";

import { buildWhatsAppUrl, type InquiryStatus } from "@/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentPanelBusinessId } from "./panel-auth";

export type PanelInquiry = {
  id: string;
  createdAt: string;
  status: InquiryStatus;
  source: "contact_form" | "booking_question" | "product_question";
  name: string;
  phone: string;
  email: string;
  message: string;
  adminNotes: string;
  whatsappUrl: string;
};

type InquiryQueryRow = {
  id: string;
  created_at: string;
  status: InquiryStatus;
  source: PanelInquiry["source"];
  name: string;
  phone: string | null;
  email: string | null;
  message: string;
  admin_notes: string | null;
};

function buildInquiryWhatsAppMessage(inquiry: Pick<PanelInquiry, "name" | "message">) {
  const preview = inquiry.message.trim().replace(/\s+/g, " ").slice(0, 90);
  return `Hola ${inquiry.name}, vi tu consulta: "${preview}". Te escribo para coordinar.`;
}

function mapInquiryRow(row: InquiryQueryRow): PanelInquiry {
  const phone = row.phone ?? "";
  const inquiry = {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    source: row.source,
    name: row.name,
    phone,
    email: row.email ?? "",
    message: row.message,
    adminNotes: row.admin_notes ?? "",
    whatsappUrl: "",
  };

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

  const { data, error } = await supabase
    .from("inquiries")
    .select("id, created_at, status, source, name, phone, email, message, admin_notes")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .limit(120);

  if (error || !data) return { enabled: true, inquiries: [] };
  return { enabled: true, inquiries: (data as InquiryQueryRow[]).map(mapInquiryRow) };
}
