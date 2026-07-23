import { NextRequest, NextResponse } from "next/server";
import { intakeFormSchema } from "@/shared";
import { savePanelIntakeForm } from "@/lib/operations/panel-intake-forms";
import { getAdminBusinessContext } from "@/lib/panel/business";

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ formId: string }> }) {
  const { formId } = await context.params;
  const parsed = intakeFormSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Revisa los datos del formulario.");

  const { supabase, businessId } = await getAdminBusinessContext();
  if (!businessId) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { id, error } = await savePanelIntakeForm({ supabase, businessId, formId, input: parsed.data });
  if (error || !id) return apiError(400, "VALIDATION_ERROR", "No se pudo actualizar el formulario.");

  return NextResponse.json({ id });
}

export async function DELETE(_request: NextRequest, context: { params: Promise<{ formId: string }> }) {
  const { formId } = await context.params;
  const { supabase, businessId } = await getAdminBusinessContext();
  if (!businessId) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  await supabase.from("service_intake_forms").delete().eq("form_id", formId).eq("business_id", businessId);
  await supabase.from("intake_form_fields").delete().eq("form_id", formId).eq("business_id", businessId);
  const { error } = await supabase.from("intake_forms").delete().eq("id", formId).eq("business_id", businessId);

  if (error) return apiError(400, "VALIDATION_ERROR", "No se pudo borrar el formulario.");

  return NextResponse.json({ ok: true });
}
