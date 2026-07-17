import { apiError, buildWhatsAppUrl } from "@/shared";
import { NextResponse, type NextRequest } from "next/server";
import { resolveBusinessForRequest } from "@/lib/business/resolve";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const business = await resolveBusinessForRequest(request);
  if (!business) {
    return NextResponse.json(apiError("NOT_FOUND", "No se encontro el negocio para este hostname."), { status: 404 });
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("business")
    .select("name, whatsapp_phone")
    .eq("id", business.id)
    .maybeSingle();

  if (error || !data?.whatsapp_phone) {
    return NextResponse.json(apiError("NOT_FOUND", "El negocio no tiene WhatsApp configurado."), { status: 404 });
  }

  const message = request.nextUrl.searchParams.get("message") ?? `Hola, quiero consultar por turnos en ${data.name}.`;
  return NextResponse.json({ data: { url: buildWhatsAppUrl({ phone: data.whatsapp_phone, message }) } }, { headers: { "Cache-Control": "no-store" } });
}
