"use client";

import { Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import type { PanelAppointment } from "@/lib/operations/panel-appointments";

type AppointmentsTableProps = {
  appointments: PanelAppointment[];
};

const statusLabels: Record<PanelAppointment["status"], string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  cancelled: "Cancelado",
  completed: "Realizado",
  no_show: "Ausente",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AppointmentsTable({ appointments }: AppointmentsTableProps) {
  const [rows, setRows] = useState(appointments);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function updateStatus(appointmentId: string, status: PanelAppointment["status"]) {
    setBusyId(appointmentId);
    const response = await fetch(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (response.ok) {
      setRows((current) => current.map((appointment) => appointment.id === appointmentId ? { ...appointment, status } : appointment));
    }

    setBusyId(null);
  }

  if (rows.length === 0) {
    return (
      <div className="surface p-6">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Todavia no hay turnos cargados.</p>
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">Horario</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Info</th>
              <th className="px-4 py-3">Pago</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-white/10">
            {rows.map((appointment) => (
              <tr key={appointment.id}>
                <td className="px-4 py-3 font-semibold">{formatDate(appointment.startsAt)}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{appointment.customerName}</p>
                  <p className="text-xs text-slate-500">{appointment.customerPhone || appointment.customerEmail}</p>
                </td>
                <td className="px-4 py-3">{appointment.serviceName}</td>
                <td className="px-4 py-3">
                  {appointment.intakeResponses.length > 0 ? (
                    <div className="grid max-w-[260px] gap-2 text-xs text-slate-600 dark:text-slate-300">
                      {appointment.intakeResponses.map((response, responseIndex) => (
                        <div className="grid gap-1" key={`${appointment.id}-${response.formName}-${responseIndex}`}>
                          <p className="font-bold text-slate-900 dark:text-white">{response.formName}</p>
                          {response.answers.slice(0, 4).map((answer, answerIndex) => (
                            <p key={`${appointment.id}-${responseIndex}-${answer.label}-${answerIndex}`}>
                              <span className="font-semibold">{answer.label}:</span> {answer.value}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : <span className="text-xs text-slate-400">-</span>}
                </td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{appointment.paymentAmount}</p>
                  <p className="text-xs text-slate-500">{appointment.paymentStatus}</p>
                </td>
                <td className="px-4 py-3">{statusLabels[appointment.status]}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {appointment.status === "pending" ? (
                      <button className="icon-action" disabled={busyId === appointment.id} onClick={() => updateStatus(appointment.id, "confirmed")} title="Confirmar" type="button">
                        <Check aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : null}
                    {appointment.status === "confirmed" ? (
                      <button className="icon-action" disabled={busyId === appointment.id} onClick={() => updateStatus(appointment.id, "completed")} title="Marcar realizado" type="button">
                        <Check aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : null}
                    {appointment.status === "confirmed" ? (
                      <button className="icon-action" disabled={busyId === appointment.id} onClick={() => updateStatus(appointment.id, "no_show")} title="Marcar ausente" type="button">
                        <RotateCcw aria-hidden="true" className="h-4 w-4" />
                      </button>
                    ) : null}
                    {appointment.status === "pending" || appointment.status === "confirmed" ? (
                      <button className="icon-action" disabled={busyId === appointment.id} onClick={() => updateStatus(appointment.id, "cancelled")} title="Cancelar" type="button">
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
