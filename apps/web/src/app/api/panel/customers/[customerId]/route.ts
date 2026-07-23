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

export async function PATCH(request: NextRequest, context: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await context.params;
  const parsed = panelCustomerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(apiError("VALIDATION_ERROR", "Revisa los datos del cliente."), { status: 400 });

  const { supabase, businessId } = await getAdminBusinessContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });

  const input = parsed.data;
  const { error } = await supabase
    .from("customers")
    .update({
      full_name: input.fullName,
      phone: input.phone || null,
      email: input.email || null,
      notes: input.notes || null,
    })
    .eq("id", customerId)
    .eq("business_id", businessId)
    .is("deleted_at", null);

  if (error) return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo guardar el cliente."), { status: 400 });

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await context.params;
  const { supabase, businessId } = await getAdminBusinessContext();
  if (!businessId) return NextResponse.json(apiError("UNAUTHORIZED", "Sesion requerida."), { status: 401 });

  const { error } = await supabase
    .from("customers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", customerId)
    .eq("business_id", businessId)
    .is("deleted_at", null);

  if (error) return NextResponse.json(apiError("VALIDATION_ERROR", "No se pudo borrar el cliente."), { status: 400 });

  return NextResponse.json({ data: { ok: true } }, { headers: { "Cache-Control": "no-store" } });
}
