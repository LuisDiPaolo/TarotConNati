"use client";

import { Archive, Check, Mail, MessageCircle, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { PanelInquiry } from "@/lib/operations/panel-inquiries";

type InquiriesTableProps = {
  inquiries: PanelInquiry[];
};

const statusLabels: Record<PanelInquiry["status"], string> = {
  new: "Nueva",
  read: "Leida",
  routed_whatsapp: "WhatsApp",
  archived: "Archivada",
};

const sourceLabels: Record<PanelInquiry["source"], string> = {
  contact_form: "Formulario publico",
  booking_question: "Consulta de reserva",
  product_question: "Consulta de producto",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function InquiriesTable({ inquiries }: InquiriesTableProps) {
  const [rows, setRows] = useState(inquiries);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(inquiryId: string, status: PanelInquiry["status"], adminNotes = "") {
    if (busyId) return false;
    setBusyId(inquiryId);
    const response = await fetch(`/api/panel/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes }),
    }).catch(() => null);

    if (response?.ok) {
      setRows((current) => current.map((inquiry) => inquiry.id === inquiryId ? { ...inquiry, status, adminNotes } : inquiry));
    }

    setBusyId(null);
    return Boolean(response?.ok);
  }

  async function routeToWhatsApp(inquiry: PanelInquiry) {
    if (!inquiry.whatsappUrl || busyId) return;
    window.open(inquiry.whatsappUrl, "_blank", "noopener,noreferrer");
    await updateStatus(inquiry.id, "routed_whatsapp", inquiry.adminNotes);
  }

  if (rows.length === 0) {
    return (
      <div className="surface p-6">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Todavia no hay consultas publicas.</p>
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Ingreso</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Origen</th>
              <th className="px-4 py-3">Mensaje</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {rows.map((inquiry) => (
              <tr key={inquiry.id}>
                <td className="px-4 py-3 font-semibold">{formatDateTime(inquiry.createdAt)}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{inquiry.name}</p>
                  <div className="mt-1 grid gap-1 text-xs text-slate-500">
                    {inquiry.phone ? <span>{inquiry.phone}</span> : null}
                    {inquiry.email ? <span>{inquiry.email}</span> : null}
                  </div>
                </td>
                <td className="px-4 py-3">{sourceLabels[inquiry.source]}</td>
                <td className="px-4 py-3">
                  <p className="max-w-[420px] text-sm leading-6 text-slate-600 dark:text-slate-300">{inquiry.message}</p>
                </td>
                <td className="px-4 py-3">{statusLabels[inquiry.status]}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {inquiry.status === "new" ? (
                      <button className="icon-action" disabled={busyId !== null} onClick={() => void updateStatus(inquiry.id, "read", inquiry.adminNotes)} title="Marcar leida" type="button">
                        <Check aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : null}
                    {inquiry.whatsappUrl ? (
                      <button className="icon-action" disabled={busyId !== null} onClick={() => void routeToWhatsApp(inquiry)} title="Abrir en WhatsApp" type="button">
                        <MessageCircle aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : inquiry.email ? (
                      <a className="icon-action" href={`mailto:${inquiry.email}`} title="Responder por email">
                        <Mail aria-hidden="true" className="h-4 w-4" />
                      </a>
                    ) : null}
                    {inquiry.status !== "archived" ? (
                      <button className="icon-action" disabled={busyId !== null} onClick={() => void updateStatus(inquiry.id, "archived", inquiry.adminNotes)} title="Archivar" type="button">
                        <Archive aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : (
                      <button className="icon-action" disabled={busyId !== null} onClick={() => void updateStatus(inquiry.id, "read", inquiry.adminNotes)} title="Reabrir" type="button">
                        <RotateCcw aria-hidden="true" className="h-4 w-4" />
                      </button>
                    )}
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
