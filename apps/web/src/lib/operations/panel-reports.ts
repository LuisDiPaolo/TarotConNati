import "server-only";

import { formatARS } from "@/shared";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentPanelBusinessId } from "./panel-auth";

export type PanelReports = {
  appointments: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  requests: {
    total: number;
    pendingReview: number;
    pendingCoordination: number;
    converted: number;
    closed: number;
    cancelled: number;
  };
  payments: {
    approvedCount: number;
    approvedAmount: string;
  };
};

function countByStatus<T extends string>(rows: Array<{ status: T }>) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.status] = (acc[row.status] ?? 0) + 1;
    return acc;
  }, {});
}

export async function getPanelReports(): Promise<PanelReports> {
  const supabase = await createSupabaseServerClient();
  const businessId = await getCurrentPanelBusinessId(supabase);
  if (!businessId) {
    return {
      appointments: { total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, noShow: 0 },
      requests: { total: 0, pendingReview: 0, pendingCoordination: 0, converted: 0, closed: 0, cancelled: 0 },
      payments: { approvedCount: 0, approvedAmount: formatARS(0) },
    };
  }

  const [{ data: appointmentsData }, { data: requestsData }, { data: paymentsData }] = await Promise.all([
    supabase.from("appointments").select("status").eq("business_id", businessId).is("deleted_at", null),
    supabase.from("service_requests").select("status").eq("business_id", businessId).is("deleted_at", null),
    supabase.from("payments").select("status, amount_pesos").eq("business_id", businessId).eq("status", "approved").is("deleted_at", null),
  ]);

  const appointmentCounts = countByStatus((appointmentsData ?? []) as Array<{ status: string }>);
  const requestCounts = countByStatus((requestsData ?? []) as Array<{ status: string }>);
  const approvedPayments = (paymentsData ?? []) as Array<{ status: string; amount_pesos: number }>;
  const approvedAmountPesos = approvedPayments.reduce((total, payment) => total + Number(payment.amount_pesos ?? 0), 0);

  return {
    appointments: {
      total: (appointmentsData ?? []).length,
      pending: appointmentCounts.pending ?? 0,
      confirmed: appointmentCounts.confirmed ?? 0,
      completed: appointmentCounts.completed ?? 0,
      cancelled: appointmentCounts.cancelled ?? 0,
      noShow: appointmentCounts.no_show ?? 0,
    },
    requests: {
      total: (requestsData ?? []).length,
      pendingReview: requestCounts.pending_review ?? 0,
      pendingCoordination: requestCounts.pending_coordination ?? 0,
      converted: requestCounts.converted ?? 0,
      closed: requestCounts.closed ?? 0,
      cancelled: requestCounts.cancelled ?? 0,
    },
    payments: {
      approvedCount: approvedPayments.length,
      approvedAmount: formatARS(approvedAmountPesos),
    },
  };
}
