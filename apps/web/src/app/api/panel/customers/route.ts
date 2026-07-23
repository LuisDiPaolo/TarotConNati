import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiError } from "@/shared";
import { getAdminBusinessContext } from "@/lib/panel/business";

const panelCustomerSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const parsed = panelCustomerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(apiError("VALIDATION_ERROR", "Revisa los datos del cliente."), { status: 400 });

  const { supabase, businessId } = await getAdminBusinessContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });

  const input = parsed.data;
  const { data, error } = await supabase
    .from("customers")
    .insert({
      business_id: businessId,
      full_name: input.fullName,
      phone: input.phone || null,
      email: input.email || null,
      notes: input.notes || null,
    })
    .select("id")
    .single();

  if (error || !data) return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo crear el cliente."), { status: 400 });

  return NextResponse.json({ data: { id: data.id } }, { headers: { "Cache-Control": "no-store" } });
}
