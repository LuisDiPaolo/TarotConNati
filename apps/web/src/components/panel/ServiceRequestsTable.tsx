"use client";

import { Check, ClipboardCheck, Eye, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import type { PanelServiceRequest } from "@/lib/operations/panel-service-requests";

type ServiceRequestsTableProps = {
  requests: PanelServiceRequest[];
};

const statusLabels: Record<PanelServiceRequest["status"], string> = {
  pending_review: "Para revisar",
  pending_coordination: "En coordinacion",
  converted: "Convertida",
  closed: "Cerrada",
  cancelled: "Cancelada",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function contactLabel(request: PanelServiceRequest) {
  if (request.contactChannel === "whatsapp") return request.customerPhone ? `WhatsApp ${request.customerPhone}` : "WhatsApp";
  if (request.contactChannel === "phone") return request.customerPhone ? `Telefono ${request.customerPhone}` : "Telefono";
  return request.customerEmail ? `Email ${request.customerEmail}` : "Email";
}

export function ServiceRequestsTable({ requests }: ServiceRequestsTableProps) {
  const [rows, setRows] = useState(requests);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(requestId: string, status: PanelServiceRequest["status"], adminNotes = "") {
    setBusyId(requestId);
    const response = await fetch(`/api/service-requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes }),
    });

    if (response.ok) {
      setRows((current) => current.map((request) => request.id === requestId ? { ...request, status, adminNotes } : request));
    }

    setBusyId(null);
  }

  async function convertRequest(requestId: string) {
    setBusyId(requestId);
    const response = await fetch(`/api/service-requests/${requestId}/convert`, { method: "POST" });

    if (response.ok) {
      setRows((current) => current.map((request) => request.id === requestId ? { ...request, status: "converted", adminNotes: "Convertida en turno operativo sin bloqueo de agenda." } : request));
    }

    setBusyId(null);
  }

  if (rows.length === 0) {
    return (
      <div className="surface p-6">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Todavia no hay solicitudes sin horario.</p>
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Ingreso</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Preferencia</th>
              <th className="px-4 py-3">Info</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {rows.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-3 font-semibold">{formatDateTime(request.createdAt)}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{request.customerName}</p>
                  <p className="text-xs text-slate-500">{contactLabel(request)}</p>
                </td>
                <td className="px-4 py-3">{request.serviceName}</td>
                <td className="px-4 py-3">
                  <p>{request.preferredDate || "Sin fecha"}</p>
                  <p className="text-xs text-slate-500">{request.preferredWindow || "Sin franja"}</p>
                </td>
                <td className="px-4 py-3">
                  <div className="grid max-w-[320px] gap-2 text-xs text-slate-600 dark:text-slate-300">
                    {request.customerNotes ? <p><span className="font-semibold">Nota:</span> {request.customerNotes}</p> : null}
                    {request.intakeResponses.map((response, responseIndex) => (
                      <div className="grid gap-1" key={`${request.id}-${response.formName}-${responseIndex}`}>
                        <p className="font-bold text-slate-900 dark:text-white">{response.formName}</p>
                        {response.answers.slice(0, 4).map((answer, answerIndex) => (
                          <p key={`${request.id}-${responseIndex}-${answer.label}-${answerIndex}`}>
                            <span className="font-semibold">{answer.label}:</span> {answer.value}
                          </p>
                        ))}
                      </div>
                    ))}
                    {request.intakeResponses.length === 0 && !request.customerNotes ? <span className="text-xs text-slate-400">-</span> : null}
                  </div>
                </td>
                <td className="px-4 py-3">{statusLabels[request.status]}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link className="icon-action" href={`/panel/solicitudes/${request.id}` as Route} title="Ver detalle">
                      <Eye aria-hidden="true" className="h-4 w-4" />
                    </Link>
                    {request.status === "pending_review" ? (
                      <button className="icon-action" disabled={busyId === request.id} onClick={() => updateStatus(request.id, "pending_coordination")} title="Pasar a coordinacion" type="button">
                        <MessageCircle aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : null}
                    {request.status === "pending_coordination" ? (
                      <button className="icon-action" disabled={busyId === request.id} onClick={() => convertRequest(request.id)} title="Convertir en turno" type="button">
                        <Check aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : null}
                    {request.status === "pending_coordination" ? (
                      <button className="icon-action" disabled={busyId === request.id} onClick={() => updateStatus(request.id, "closed")} title="Cerrar solicitud" type="button">
                        <ClipboardCheck aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : null}
                    {request.status === "closed" || request.status === "cancelled" ? (
                      <button className="icon-action" disabled={busyId === request.id} onClick={() => updateStatus(request.id, "pending_review")} title="Reabrir" type="button">
                        <Check aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : null}
                    {request.status === "pending_review" || request.status === "pending_coordination" ? (
                      <button className="icon-action" disabled={busyId === request.id} onClick={() => updateStatus(request.id, "cancelled")} title="Cancelar solicitud" type="button">
                        <X aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
