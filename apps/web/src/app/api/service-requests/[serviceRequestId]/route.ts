import { NextRequest, NextResponse } from "next/server";
import { updateServiceRequestSchema } from "@turnos/shared";
import { sendTransactionalPush } from "@/lib/push/transactional";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const allowedTransitions: Record<string, string[]> = {
  pending_review: ["pending_coordination", "closed", "cancelled"],
  pending_coordination: ["pending_review", "closed", "cancelled"],
  converted: [],
  closed: ["pending_review"],
  cancelled: ["pending_review"],
};

function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ serviceRequestId: string }> }) {
  const { serviceRequestId } = await context.params;
  const parsed = updateServiceRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Estado invalido.");

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return apiError(401, "UNAUTHORIZED", "Sesion requerida.");

  const { data: serviceRequest, error: readError } = await supabase
    .from("service_requests")
    .select("id, business_id, status")
    .eq("id", serviceRequestId)
    .maybeSingle();

  if (readError || !serviceRequest) return apiError(404, "NOT_FOUND", "Solicitud no encontrada.");

  const currentStatus = String(serviceRequest.status);
  const nextStatus = parsed.data.status;
  if (currentStatus !== nextStatus && !allowedTransitions[currentStatus]?.includes(nextStatus)) {
    return apiError(400, "VALIDATION_ERROR", "Transicion de estado no permitida.");
  }

  const { error: updateError } = await supabase
    .from("service_requests")
    .update({
      status: nextStatus,
      admin_notes: parsed.data.adminNotes || null,
    })
    .eq("id", serviceRequestId);

  if (updateError) return apiError(400, "VALIDATION_ERROR", "No se pudo actualizar la solicitud.");

  await sendTransactionalPush({
    businessId: serviceRequest.business_id,
    eventKey: `service_request.status.${serviceRequestId}.${nextStatus}`,
    eventType: "service_request.status_changed",
    sourceTable: "service_requests",
    sourceId: serviceRequestId,
    surface: "panel",
    payload: {
      title: "Solicitud actualizada",
      body: `Estado: ${nextStatus}`,
      url: "/panel/solicitudes",
      tag: "service-request-status",
    },
  });

  return NextResponse.json({ ok: true });
}
