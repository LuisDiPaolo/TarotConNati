"use client";

import { useState } from "react";
import { Bell, CalendarClock, RefreshCw, Send, Trash2 } from "lucide-react";

type PushAlertStatus = "draft" | "scheduled" | "sending" | "sent" | "partial" | "skipped" | "failed" | "cancelled";

export type PushAlertCampaign = {
  id: string;
  title: string;
  message: string;
  targetUrl: string;
  status: PushAlertStatus;
  scheduledAt: string | null;
  subscriptionsCount: number;
  deliveredCount: number;
  removedCount: number;
  failedCount: number;
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
  cancelledAt: string | null;
};

type PushAlertsResponse = {
  data?: {
    campaigns?: PushAlertCampaign[];
    campaign?: PushAlertCampaign;
    ok?: boolean;
  };
  error?: { message?: string };
};

const STATUS_LABEL: Record<PushAlertStatus, string> = {
  draft: "Borrador",
  scheduled: "Programada",
  sending: "Enviando",
  sent: "Enviada",
  partial: "Parcial",
  skipped: "Sin suscriptores",
  failed: "Fallida",
  cancelled: "Cancelada",
};

function formatDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function defaultScheduledAt() {
  const date = new Date(Date.now() + 60 * 60_000);
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function canDelete(status: PushAlertStatus) {
  return status !== "sending";
}

export function PushAlertsManager({ initialCampaigns }: { initialCampaigns: PushAlertCampaign[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetUrl, setTargetUrl] = useState("/");
  const [mode, setMode] = useState<"now" | "scheduled">("now");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledAt());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function loadCampaigns() {
    setError(null);
    const response = await fetch("/api/panel/push-alerts", { cache: "no-store" }).catch(() => null);
    const data = await response?.json().catch(() => null) as PushAlertsResponse | null;
    if (!response?.ok || !data?.data?.campaigns) {
      setError(data?.error?.message ?? "No se pudieron cargar las alertas.");
      return;
    }
    setCampaigns(data.data.campaigns);
  }

  async function handleSubmit() {
    setError(null);
    setSuccess(null);
    if (!title.trim() || !message.trim()) {
      setError("Completa titulo y mensaje.");
      return;
    }

    const scheduledDate = mode === "scheduled" ? new Date(scheduledAt) : null;
    if (mode === "scheduled" && (!scheduledDate || !Number.isFinite(scheduledDate.getTime()))) {
      setError("Elegi una fecha y hora validas.");
      return;
    }

    setBusy(true);
    const response = await fetch("/api/panel/push-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, message, targetUrl, mode, scheduledAt: scheduledDate?.toISOString() ?? null }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null) as PushAlertsResponse | null;
    setBusy(false);

    if (!response?.ok || !data?.data?.campaign) {
      setError(data?.error?.message ?? "No se pudo guardar la alerta.");
      return;
    }

    setCampaigns((current) => [data.data!.campaign!, ...current.filter((campaign) => campaign.id !== data.data!.campaign!.id)]);
    setTitle("");
    setMessage("");
    setTargetUrl("/");
    setMode("now");
    setScheduledAt(defaultScheduledAt());
    setSuccess(mode === "scheduled" ? "Alerta programada." : "Alerta enviada.");
  }

  async function deleteCampaign(campaignId: string) {
    setError(null);
    const response = await fetch(`/api/panel/push-alerts/${campaignId}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      const data = await response?.json().catch(() => null) as PushAlertsResponse | null;
      setError(data?.error?.message ?? "No se pudo borrar la alerta.");
      return;
    }
    setCampaigns((current) => current.filter((campaign) => campaign.id !== campaignId));
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="surface p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
            <Bell aria-hidden="true" className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-black">Crear alerta</h2>
            <p className="mt-1 text-sm font-semibold text-muted">Aviso push para clientes suscriptos.</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          {error ? <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-500">{error}</p> : null}
          {success ? <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-bold text-emerald-600">{success}</p> : null}

          <label className="grid gap-2 text-sm font-bold">
            Titulo
            <input className="input-control" maxLength={70} placeholder="Promo de hoy" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>

          <label className="grid gap-2 text-sm font-bold">
            Mensaje
            <textarea className="input-control min-h-28 resize-none" maxLength={180} placeholder="Texto corto para la notificacion" value={message} onChange={(event) => setMessage(event.target.value)} />
            <span className="text-right text-xs text-muted">{message.length}/180</span>
          </label>

          <label className="grid gap-2 text-sm font-bold">
            Link al tocar
            <select className="input-control" value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)}>
              <option value="/">Inicio</option>
              <option value="/reservar">Reservar</option>
              <option value="/productos">Productos</option>
              <option value="/promociones">Promociones</option>
              <option value="/contacto">Contacto</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border p-1">
            <button className={`rounded-md px-3 py-2 text-sm font-black ${mode === "now" ? "bg-accent text-white" : "text-muted"}`} type="button" onClick={() => setMode("now")}>Ahora</button>
            <button className={`rounded-md px-3 py-2 text-sm font-black ${mode === "scheduled" ? "bg-accent text-white" : "text-muted"}`} type="button" onClick={() => setMode("scheduled")}>Programar</button>
          </div>

          {mode === "scheduled" ? (
            <label className="grid gap-2 text-sm font-bold">
              Dia y hora
              <input className="input-control" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} />
            </label>
          ) : null}

          <button className="primary-action inline-flex justify-center" disabled={busy} type="button" onClick={handleSubmit}>
            {mode === "scheduled" ? <CalendarClock aria-hidden="true" className="h-4 w-4" /> : <Send aria-hidden="true" className="h-4 w-4" />}
            {busy ? "Guardando" : mode === "scheduled" ? "Programar alerta" : "Enviar ahora"}
          </button>
        </div>
      </div>

      <div className="surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Historial de alertas</h2>
            <p className="mt-1 text-sm font-semibold text-muted">Globales enviadas y programadas.</p>
          </div>
          <button aria-label="Actualizar" className="secondary-action !px-3" type="button" onClick={loadCampaigns}>
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {campaigns.length > 0 ? campaigns.map((campaign) => (
            <article className="rounded-lg border border-border p-4" key={campaign.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-black">{campaign.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">{campaign.message}</p>
                </div>
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-black text-accent">{STATUS_LABEL[campaign.status]}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-muted">
                <span>Programada: {formatDate(campaign.scheduledAt)}</span>
                <span>Enviada: {formatDate(campaign.sentAt)}</span>
                <span>Entregadas: {campaign.deliveredCount}</span>
                <span>Total: {campaign.subscriptionsCount}</span>
                {campaign.failedCount > 0 ? <span>Fallidas: {campaign.failedCount}</span> : null}
              </div>
              {campaign.errorMessage ? <p className="mt-2 text-xs font-bold text-red-500">{campaign.errorMessage}</p> : null}
              {canDelete(campaign.status) ? (
                <button className="mt-3 inline-flex items-center gap-2 text-xs font-black text-red-500" type="button" onClick={() => deleteCampaign(campaign.id)}>
                  <Trash2 aria-hidden="true" className="h-3.5 w-3.5" /> Borrar
                </button>
              ) : null}
            </article>
          )) : (
            <p className="rounded-lg border border-border p-6 text-center text-sm font-semibold text-muted">Todavia no hay alertas.</p>
          )}
        </div>
      </div>
    </section>
  );
}
