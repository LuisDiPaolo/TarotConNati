import { NextRequest, NextResponse } from "next/server";
import { intakeFormSchema } from "@turnos/shared";
import { savePanelIntakeForm } from "@/lib/operations/panel-intake-forms";
import { getAdminBusinessContext } from "@/lib/panel/business";

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  const parsed = intakeFormSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Revisa los datos del formulario.");

  const { supabase, businessId } = await getAdminBusinessContext();
  if (!businessId) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { id, error } = await savePanelIntakeForm({ supabase, businessId, input: parsed.data });
  if (error || !id) return apiError(400, "VALIDATION_ERROR", "No se pudo guardar el formulario.");

  return NextResponse.json({ id });
}
