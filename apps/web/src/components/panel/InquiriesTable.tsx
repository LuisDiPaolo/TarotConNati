"use client";

import Link from "next/link";
import { Archive, CalendarPlus, Check, Mail, MessageCircle, RotateCcw, Search } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import type { PanelInquiry } from "@/lib/operations/panel-inquiries";
import type { PanelServiceSettings } from "@/lib/operations/panel-settings.types";

type InquiriesTableProps = {
  inquiries: PanelInquiry[];
  services: PanelServiceSettings[];
};

type InquiryFilter = "all" | PanelInquiry["status"] | "answered";

const statusLabels: Record<PanelInquiry["status"], string> = {
  new: "Nueva consulta",
  read: "Consulta leida",
  answered_panel: "Respondida por panel",
  answered_whatsapp: "Respondida por WhatsApp",
  converted: "Convertida a turno",
  archived: "Consulta archivada",
};

const statusBadgeClasses: Record<PanelInquiry["status"], string> = {
  new: "bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200",
  read: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200",
  answered_panel: "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200",
  answered_whatsapp: "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200",
  converted: "bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200",
  archived: "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-400",
};

const sourceLabels: Record<PanelInquiry["source"], string> = {
  contact_form: "Formulario publico",
  booking_question: "Consulta de reserva",
  product_question: "Consulta de producto",
};

const filters: Array<{ value: InquiryFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "new", label: "Nuevas" },
  { value: "read", label: "Leidas" },
  { value: "answered", label: "Respondidas" },
  { value: "answered_whatsapp", label: "WhatsApp" },
  { value: "converted", label: "Convertidas a turno" },
  { value: "archived", label: "Archivadas" },
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function matchesFilter(inquiry: PanelInquiry, filter: InquiryFilter) {
  if (filter === "all") return true;
  if (filter === "answered") return inquiry.status === "answered_panel" || inquiry.status === "answered_whatsapp";
  return inquiry.status === filter;
}

function matchesSearch(inquiry: PanelInquiry, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    inquiry.name,
    inquiry.phone,
    inquiry.email,
    inquiry.message,
    inquiry.adminNotes,
    sourceLabels[inquiry.source],
    statusLabels[inquiry.status],
  ].some((value) => value.toLowerCase().includes(normalized));
}

export function InquiriesTable({ inquiries, services }: InquiriesTableProps) {
  const [rows, setRows] = useState(inquiries);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<InquiryFilter>("all");
  const [convertTarget, setConvertTarget] = useState<PanelInquiry | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [message, setMessage] = useState("");

  const visibleRows = useMemo(
    () => rows.filter((inquiry) => matchesFilter(inquiry, filter) && matchesSearch(inquiry, query)),
    [filter, query, rows],
  );

  async function updateStatus(inquiryId: string, status: PanelInquiry["status"], adminNotes = "") {
    if (busyId) return false;
    setBusyId(inquiryId);
    setMessage("");
    const response = await fetch(`/api/panel/inquiries/${inquiryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes }),
    }).catch(() => null);

    if (response?.ok) {
      setRows((current) => current.map((inquiry) => inquiry.id === inquiryId ? { ...inquiry, status, adminNotes } : inquiry));
    } else {
      setMessage("No se pudo actualizar la consulta.");
    }

    setBusyId(null);
    return Boolean(response?.ok);
  }

  function updateLocalNotes(inquiryId: string, adminNotes: string) {
    setRows((current) => current.map((inquiry) => inquiry.id === inquiryId ? { ...inquiry, adminNotes } : inquiry));
  }

  async function routeToWhatsApp(inquiry: PanelInquiry) {
    if (!inquiry.whatsappUrl || busyId) return;
    const popup = window.open(inquiry.whatsappUrl, "_blank");
    if (!popup) {
      setMessage("No se pudo abrir WhatsApp. Revisa permisos de ventanas emergentes.");
      return;
    }
    popup.opener = null;
    await updateStatus(inquiry.id, "answered_whatsapp", inquiry.adminNotes);
  }

  async function createAppointmentFromInquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!convertTarget || createBusy) return;

    const formData = new FormData(event.currentTarget);
    const serviceId = String(formData.get("serviceId") ?? "");
    const startsAtValue = String(formData.get("startsAt") ?? "");
    const service = services.find((item) => item.id === serviceId);
    if (!service || !startsAtValue) {
      setMessage("Completa servicio y horario para crear el turno.");
      return;
    }

    setCreateBusy(true);
    setMessage("");
    const response = await fetch("/api/panel/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        startsAt: new Date(startsAtValue).toISOString(),
        status: String(formData.get("status") ?? "confirmed"),
        inquiryId: convertTarget.id,
        customer: {
          fullName: String(formData.get("fullName") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          email: String(formData.get("email") ?? ""),
          notes: String(formData.get("notes") ?? ""),
        },
      }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { id?: string; error?: { message?: string } } | null;

    setCreateBusy(false);
    if (!response?.ok || !payload?.id) {
      setMessage(payload?.error?.message ?? "No se pudo crear el turno.");
      return;
    }

    const appointmentId = payload.id;
    setRows((current) => current.map((inquiry) => inquiry.id === convertTarget.id ? {
      ...inquiry,
      status: "converted",
      appointmentId,
      convertedAt: new Date().toISOString(),
    } : inquiry));
    setConvertTarget(null);
    setMessage("Turno creado desde la consulta.");
  }

  if (rows.length === 0) {
    return (
      <div className="surface p-6">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">Todavia no hay consultas publicas.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <section className="surface grid gap-4 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative block">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input-control pl-10"
              placeholder="Buscar por cliente, telefono, mensaje o nota interna..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {filters.map((item) => (
              <button
                className={`rounded-full px-3 py-2 text-xs font-bold transition ${filter === item.value ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"}`}
                key={item.value}
                onClick={() => setFilter(item.value)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {message ? <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{message}</p> : null}
      </section>

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Ingreso</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Origen</th>
                <th className="px-4 py-3">Mensaje y nota</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {visibleRows.map((inquiry) => (
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
                    <label className="mt-3 grid max-w-[420px] gap-1 text-xs font-semibold text-slate-500">
                      Nota interna
                      <textarea
                        className="input-control min-h-16 resize-y text-sm font-normal"
                        value={inquiry.adminNotes}
                        onBlur={() => void updateStatus(inquiry.id, inquiry.status, inquiry.adminNotes)}
                        onChange={(event) => updateLocalNotes(inquiry.id, event.target.value)}
                      />
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <div className="grid gap-2">
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${statusBadgeClasses[inquiry.status]}`}>{statusLabels[inquiry.status]}</span>
                      {inquiry.appointmentId ? (
                        <Link className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900 transition hover:bg-amber-200 dark:bg-amber-400/15 dark:text-amber-200" href={`/panel/turnos/${inquiry.appointmentId}`}>
                          Turno creado
                        </Link>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {inquiry.status === "new" ? (
                        <button className="icon-action" disabled={busyId !== null} onClick={() => void updateStatus(inquiry.id, "read", inquiry.adminNotes)} title="Marcar consulta leida" type="button">
                          <Check aria-hidden="true" className="h-4 w-4" />
                        </button>
                      ) : null}
                      {inquiry.status !== "converted" && inquiry.status !== "archived" ? (
                        <button className="icon-action" disabled={busyId !== null} onClick={() => void updateStatus(inquiry.id, "answered_panel", inquiry.adminNotes)} title="Marcar respondida por panel" type="button">
                          <Mail aria-hidden="true" className="h-4 w-4" />
                        </button>
                      ) : null}
                      {inquiry.whatsappUrl && inquiry.status !== "converted" && inquiry.status !== "archived" ? (
                        <button className="icon-action" disabled={busyId !== null} onClick={() => void routeToWhatsApp(inquiry)} title="Responder por WhatsApp" type="button">
                          <MessageCircle aria-hidden="true" className="h-4 w-4" />
                        </button>
                      ) : null}
                      {inquiry.status !== "converted" && inquiry.status !== "archived" ? (
                        <button className="icon-action" disabled={services.length === 0} onClick={() => setConvertTarget(inquiry)} title="Crear turno desde consulta" type="button">
                          <CalendarPlus aria-hidden="true" className="h-4 w-4" />
                        </button>
                      ) : null}
                      {inquiry.status !== "archived" ? (
                        <button className="icon-action" disabled={busyId !== null} onClick={() => void updateStatus(inquiry.id, "archived", inquiry.adminNotes)} title="Archivar consulta" type="button">
                          <Archive aria-hidden="true" className="h-4 w-4" />
                        </button>
                      ) : (
                        <button className="icon-action" disabled={busyId !== null} onClick={() => void updateStatus(inquiry.id, "read", inquiry.adminNotes)} title="Reabrir consulta" type="button">
                          <RotateCcw aria-hidden="true" className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibleRows.length === 0 ? <p className="p-6 text-sm font-semibold text-slate-500">No hay consultas que coincidan con ese filtro.</p> : null}
        </div>
      </div>

      {convertTarget ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation" onClick={() => setConvertTarget(null)}>
          <form className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-950" onClick={(event) => event.stopPropagation()} onSubmit={(event) => void createAppointmentFromInquiry(event)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent">Crear turno</p>
                <h2 className="mt-2 text-2xl font-black">Convertir consulta a turno</h2>
              </div>
              <button className="icon-action" type="button" onClick={() => setConvertTarget(null)}>×</button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">
                Servicio
                <select className="input-control" name="serviceId" required defaultValue={services[0]?.id ?? ""}>
                  {services.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Fecha y hora
                <input className="input-control" name="startsAt" required type="datetime-local" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Estado inicial
                <select className="input-control" name="status" defaultValue="confirmed">
                  <option value="confirmed">Confirmado</option>
                  <option value="pending">Pendiente</option>
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Nombre
                  <input className="input-control" name="fullName" required defaultValue={convertTarget.name} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  WhatsApp
                  <input className="input-control" name="phone" required defaultValue={convertTarget.phone} />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Email
                <input className="input-control" name="email" type="email" defaultValue={convertTarget.email} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Nota del turno
                <textarea className="input-control min-h-24 resize-y" name="notes" defaultValue={`${convertTarget.message}${convertTarget.adminNotes ? `\n\nNota interna: ${convertTarget.adminNotes}` : ""}`} />
              </label>
              <button className="primary-action justify-center" disabled={createBusy || services.length === 0} type="submit">
                <CalendarPlus aria-hidden="true" className="h-4 w-4" />
                {createBusy ? "Creando" : "Crear turno"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
