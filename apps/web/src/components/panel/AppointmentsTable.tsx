"use client";

import { AlertTriangle, Check, ChevronDown, Eye, MessageCircle, Plus, RotateCcw, Trash2, X } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";
import type { PanelAppointment } from "@/lib/operations/panel-appointments";
import type { PanelServiceSettings } from "@/lib/operations/panel-settings.types";
import { buildAppointmentReminderWhatsAppUrl } from "@/lib/whatsapp/appointment-reminder";

type AppointmentsTableProps = {
  appointments: PanelAppointment[];
  services: PanelServiceSettings[];
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

export function AppointmentsTable({ appointments, services }: AppointmentsTableProps) {
  const [rows, setRows] = useState(appointments);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedAppointmentId, setExpandedAppointmentId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [deleteTarget, setDeleteTarget] = useState<PanelAppointment | null>(null);

  async function createAppointment(formData: FormData) {
    if (createBusy) return;
    setMessage("");
    setMessageTone("success");
    const serviceId = String(formData.get("serviceId") ?? "");
    const startsAtValue = String(formData.get("startsAt") ?? "");
    const service = services.find((item) => item.id === serviceId);
    if (!service || !startsAtValue) {
      setMessageTone("error");
      setMessage("Completa servicio y horario.");
      return;
    }

    setCreateBusy(true);
    const status = String(formData.get("status") ?? "confirmed") as PanelAppointment["status"];
    const response = await fetch("/api/panel/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        startsAt: new Date(startsAtValue).toISOString(),
        status,
        customer: {
          fullName: String(formData.get("fullName") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          email: String(formData.get("email") ?? ""),
          notes: String(formData.get("notes") ?? ""),
        },
      }),
    }).catch(() => null);
    if (!response) {
      setCreateBusy(false);
      setMessageTone("error");
      setMessage("No se pudo crear el turno.");
      return;
    }
    const payload = await response.json().catch(() => null) as { id?: string; error?: { message?: string } } | null;

    if (!response.ok || !payload?.id) {
      setCreateBusy(false);
      setMessageTone("error");
      setMessage(payload?.error?.message ?? "No se pudo crear el turno.");
      return;
    }

    const appointmentId: string = payload.id;
    const startsAt = new Date(startsAtValue);
    const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);
    setRows((current) => [{
      id: appointmentId,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      status,
      notes: String(formData.get("notes") ?? ""),
      customerName: String(formData.get("fullName") ?? ""),
      customerPhone: String(formData.get("phone") ?? ""),
      customerEmail: String(formData.get("email") ?? ""),
      serviceName: service.name,
      paymentStatus: "sin_pago",
      paymentAmount: "-",
      intakeResponses: [],
    }, ...current]);
    setShowCreate(false);
    setCreateBusy(false);
    setMessage("Turno creado.");
  }

  async function confirmDeleteAppointment() {
    if (!deleteTarget || busyId) return;
    setBusyId(deleteTarget.id);
    setMessage("");
    setMessageTone("success");
    const response = await fetch(`/api/appointments/${deleteTarget.id}`, { method: "DELETE" }).catch(() => null);
    if (response?.ok) {
      setRows((current) => current.filter((appointment) => appointment.id !== deleteTarget.id));
      setMessage("Turno borrado.");
      setDeleteTarget(null);
    } else {
      setMessageTone("error");
      setMessage("No se pudo borrar el turno.");
    }
    setBusyId(null);
  }

  async function updateStatus(appointmentId: string, status: PanelAppointment["status"], reason = "") {
    if (busyId) return;
    setBusyId(appointmentId);
    setMessage("");
    setMessageTone("success");
    const response = await fetch(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reason }),
    }).catch(() => null);

    if (response?.ok) {
      setRows((current) => current.map((appointment) => appointment.id === appointmentId ? { ...appointment, status } : appointment));
    } else {
      setMessageTone("error");
      setMessage("No se pudo actualizar el turno.");
    }

    setBusyId(null);
  }

  function requestStatusWithReason(appointmentId: string, status: "cancelled" | "no_show", promptLabel: string) {
    if (busyId) return;
    const reason = window.prompt(promptLabel);
    if (reason === null) return;
    void updateStatus(appointmentId, status, reason.trim());
  }

  function renderActions(appointment: PanelAppointment) {
    const whatsappReminderUrl = buildAppointmentReminderWhatsAppUrl(appointment);

    return (
      <div className="flex flex-wrap justify-end gap-2">
        <Link className="icon-action" href={`/panel/turnos/${appointment.id}` as Route} title="Ver detalle">
          <Eye aria-hidden="true" className="h-4 w-4" />
        </Link>
        {whatsappReminderUrl ? (
          <a className="icon-action" href={whatsappReminderUrl} rel="noopener noreferrer" target="_blank" title="Enviar recordatorio por WhatsApp">
            <MessageCircle aria-hidden="true" className="h-4 w-4" />
          </a>
        ) : (
          <button className="icon-action" disabled title="Cargar telefono valido para WhatsApp" type="button">
            <MessageCircle aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
        {appointment.status === "pending" ? (
          <button className="icon-action" disabled={busyId !== null} onClick={() => updateStatus(appointment.id, "confirmed")} title="Confirmar" type="button">
            <Check aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
        {appointment.status === "confirmed" ? (
          <button className="icon-action" disabled={busyId !== null} onClick={() => updateStatus(appointment.id, "completed")} title="Marcar realizado" type="button">
            <Check aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
        {appointment.status === "confirmed" ? (
          <button className="icon-action" disabled={busyId !== null} onClick={() => requestStatusWithReason(appointment.id, "no_show", "Motivo de ausencia")} title="Marcar ausente" type="button">
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
        {appointment.status === "pending" || appointment.status === "confirmed" ? (
          <button className="icon-action" disabled={busyId !== null} onClick={() => requestStatusWithReason(appointment.id, "cancelled", "Motivo de cancelacion")} title="Cancelar" type="button">
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
        <button className="icon-action danger-icon-action" disabled={busyId !== null} onClick={() => setDeleteTarget(appointment)} title="Borrar turno" type="button">
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <button className="primary-action" type="button" disabled={createBusy} onClick={() => setShowCreate((current) => !current)}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Crear turno
        </button>
      </div>

      {showCreate ? (
        <form action={createAppointment} className="surface grid gap-4 p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold">
              Servicio
              <select className="input-control" name="serviceId" required>
                <option value="">Seleccionar</option>
                {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Fecha y hora
              <input className="input-control" name="startsAt" type="datetime-local" required />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Estado
              <select className="input-control" name="status" defaultValue="confirmed">
                <option value="confirmed">Confirmado</option>
                <option value="pending">Pendiente</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold">
              Nombre
              <input className="input-control" name="fullName" required minLength={2} maxLength={120} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Telefono
              <input className="input-control" name="phone" required minLength={6} maxLength={40} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Email
              <input className="input-control" name="email" type="email" maxLength={160} />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-semibold">
            Nota
            <textarea className="input-control min-h-20 resize-y" name="notes" maxLength={500} />
          </label>

          <div className="flex justify-end">
            <button className="primary-action" disabled={createBusy} type="submit">
              <Plus aria-hidden="true" className="h-4 w-4" />
              {createBusy ? "Creando" : "Crear"}
            </button>
          </div>
        </form>
      ) : null}

      {message ? <p className={messageTone === "error" ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-emerald-600"}>{message}</p> : null}

      {rows.length === 0 ? (
        <div className="surface p-6">
          <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">Todavia no hay turnos cargados.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {rows.map((appointment) => {
              const expanded = expandedAppointmentId === appointment.id;
              return (
                <article className="surface p-4" key={appointment.id}>
                  <button
                    aria-expanded={expanded}
                    className="flex w-full items-start justify-between gap-3 text-left"
                    onClick={() => setExpandedAppointmentId((current) => current === appointment.id ? null : appointment.id)}
                    type="button"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">{statusLabels[appointment.status]}</p>
                      <h3 className="mt-1 truncate text-base font-black">{appointment.customerName}</h3>
                      <p className="mt-1 text-sm text-muted">{formatDate(appointment.startsAt)}</p>
                      <p className="mt-1 truncate text-sm font-semibold">{appointment.serviceName}</p>
                    </div>
                    <ChevronDown aria-hidden="true" className={`mt-1 h-5 w-5 shrink-0 transition ${expanded ? "rotate-180" : ""}`} />
                  </button>
                  {expanded ? (
                    <div className="mt-4 grid gap-4 border-t border-[rgb(var(--color-border))] pt-4">
                      <div className="grid gap-2 text-sm">
                        <p><span className="font-semibold">Contacto:</span> {appointment.customerPhone || appointment.customerEmail || "-"}</p>
                        <p><span className="font-semibold">Pago:</span> {appointment.paymentAmount} / {appointment.paymentStatus}</p>
                        {appointment.notes ? <p><span className="font-semibold">Nota:</span> {appointment.notes}</p> : null}
                      </div>
                      {appointment.intakeResponses.length > 0 ? (
                        <div className="grid gap-2 text-xs text-muted">
                          {appointment.intakeResponses.map((response, responseIndex) => (
                            <div className="grid gap-1" key={`${appointment.id}-${response.formName}-${responseIndex}`}>
                              <p className="font-bold text-[rgb(var(--color-foreground))]">{response.formName}</p>
                              {response.answers.slice(0, 4).map((answer, answerIndex) => (
                                <p key={`${appointment.id}-${responseIndex}-${answer.label}-${answerIndex}`}>
                                  <span className="font-semibold">{answer.label}:</span> {answer.value}
                                </p>
                              ))}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {renderActions(appointment)}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>

          <div className="surface hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
                <thead className="border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-xs uppercase text-muted">
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
                <tbody className="divide-y divide-[rgb(var(--color-border))]">
                  {rows.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="px-4 py-3 font-semibold">{formatDate(appointment.startsAt)}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{appointment.customerName}</p>
                        <p className="text-xs text-muted">{appointment.customerPhone || appointment.customerEmail}</p>
                      </td>
                      <td className="px-4 py-3">{appointment.serviceName}</td>
                      <td className="px-4 py-3">
                        {appointment.intakeResponses.length > 0 ? (
                          <div className="grid max-w-[260px] gap-2 text-xs text-muted">
                            {appointment.intakeResponses.map((response, responseIndex) => (
                              <div className="grid gap-1" key={`${appointment.id}-${response.formName}-${responseIndex}`}>
                                <p className="font-bold text-[rgb(var(--color-foreground))]">{response.formName}</p>
                                {response.answers.slice(0, 4).map((answer, answerIndex) => (
                                  <p key={`${appointment.id}-${responseIndex}-${answer.label}-${answerIndex}`}>
                                    <span className="font-semibold">{answer.label}:</span> {answer.value}
                                  </p>
                                ))}
                              </div>
                            ))}
                          </div>
                        ) : <span className="text-xs text-muted">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold">{appointment.paymentAmount}</p>
                        <p className="text-xs text-muted">{appointment.paymentStatus}</p>
                      </td>
                      <td className="px-4 py-3">{statusLabels[appointment.status]}</td>
                      <td className="px-4 py-3">{renderActions(appointment)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[180] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-appointment-title">
          <button aria-label="Cancelar borrado" className="absolute inset-0 cursor-default bg-black/55" disabled={busyId === deleteTarget.id} type="button" onClick={() => setDeleteTarget(null)} />
          <div className="surface relative z-10 w-full max-w-md p-5 shadow-2xl">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h2 id="delete-appointment-title" className="text-lg font-black">Borrar turno</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Vas a borrar el turno de {deleteTarget.customerName}. Esta accion lo oculta del panel, pero conserva trazabilidad interna.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="secondary-action w-full sm:w-auto" type="button" disabled={busyId === deleteTarget.id} onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
              <button className="danger-action w-full sm:w-auto" type="button" onClick={confirmDeleteAppointment} disabled={busyId === deleteTarget.id}>
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Borrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
