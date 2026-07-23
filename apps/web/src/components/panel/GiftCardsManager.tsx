"use client";

import { AlertTriangle, Gift, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { PanelGiftCard, PanelGiftCardService, PanelGiftCardStatus } from "@/lib/operations/panel-gift-cards";
import { formatARS } from "@/shared";

type DraftGiftCard = PanelGiftCard & { draftId: string; isNew?: boolean };

const statusLabels: Record<PanelGiftCardStatus, string> = {
  pending_payment: "Pendiente de pago",
  active: "Activa",
  redeemed: "Usada",
  cancelled: "Cancelada",
  expired: "Vencida",
};

function createDraftId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toInputDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromInputDateTime(value: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : "";
}

function emptyGiftCard(services: PanelGiftCardService[]): DraftGiftCard {
  const service = services[0];
  return {
    draftId: createDraftId(),
    id: "",
    serviceId: service?.id ?? "",
    serviceName: service?.name ?? "",
    purchaserName: "",
    purchaserPhone: "",
    purchaserEmail: "",
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    message: "",
    code: "Se genera al guardar",
    amountPesos: service?.pricePesos ?? 0,
    status: "active",
    activatedAt: "",
    redeemedAt: "",
    cancelledAt: "",
    expiresAt: "",
    createdAt: new Date().toISOString(),
    isNew: true,
  };
}

export function GiftCardsManager({ giftCards, services }: { giftCards: PanelGiftCard[]; services: PanelGiftCardService[] }) {
  const [rows, setRows] = useState<DraftGiftCard[]>(giftCards.map((giftCard) => ({ ...giftCard, draftId: giftCard.id, expiresAt: toInputDateTime(giftCard.expiresAt) })));
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DraftGiftCard | null>(null);

  function updateRow(draftId: string, patch: Partial<DraftGiftCard>) {
    setRows((current) => current.map((row) => {
      if (row.draftId !== draftId) return row;
      const next = { ...row, ...patch };
      if (patch.serviceId && row.isNew) {
        const service = services.find((item) => item.id === patch.serviceId);
        if (service) {
          next.serviceName = service.name;
          next.amountPesos = service.pricePesos;
        }
      }
      return next;
    }));
  }

  async function saveRow(row: DraftGiftCard) {
    if (busyId) return;
    setMessage("");
    setMessageTone("success");
    if (!row.serviceId || row.purchaserName.trim().length < 2 || row.purchaserPhone.trim().length < 6 || row.recipientName.trim().length < 2) {
      setMessageTone("error");
      setMessage("Completa servicio, comprador, WhatsApp y destinatario.");
      return;
    }

    setBusyId(row.draftId);
    const payload = {
      serviceId: row.serviceId,
      purchaserName: row.purchaserName,
      purchaserPhone: row.purchaserPhone,
      purchaserEmail: row.purchaserEmail,
      recipientName: row.recipientName,
      recipientPhone: row.recipientPhone,
      recipientEmail: row.recipientEmail,
      message: row.message,
      status: row.status,
      expiresAt: fromInputDateTime(row.expiresAt),
    };
    const response = await fetch(row.isNew ? "/api/panel/gift-cards" : `/api/panel/gift-cards/${row.id}`, {
      method: row.isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const data = await response?.json().catch(() => null) as { data?: { id?: string; code?: string }; error?: { message?: string } } | null;

    if (!response?.ok) {
      setBusyId(null);
      setMessageTone("error");
      setMessage(data?.error?.message ?? "No se pudo guardar la gift card.");
      return;
    }

    if (row.isNew && data?.data?.id) {
      updateRow(row.draftId, { id: data.data.id, draftId: data.data.id, isNew: false, code: data.data.code ?? row.code });
    }
    setBusyId(null);
    setMessage(row.isNew ? "Gift card creada." : "Gift card guardada.");
  }

  async function confirmDeleteRow() {
    if (!deleteTarget || busyId) return;
    setMessage("");
    setMessageTone("success");
    if (deleteTarget.isNew || !deleteTarget.id) {
      setRows((current) => current.filter((row) => row.draftId !== deleteTarget.draftId));
      setDeleteTarget(null);
      return;
    }

    setBusyId(deleteTarget.draftId);
    const response = await fetch(`/api/panel/gift-cards/${deleteTarget.id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setBusyId(null);
      setMessageTone("error");
      setMessage("No se pudo cancelar la gift card.");
      return;
    }

    setRows((current) => current.map((row) => row.id === deleteTarget.id ? { ...row, status: "cancelled", cancelledAt: new Date().toISOString() } : row));
    setDeleteTarget(null);
    setBusyId(null);
    setMessage("Gift card cancelada.");
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Gift cards</h2>
          <p className="mt-1 text-sm text-muted">Venta, carga manual, uso y cancelacion de regalos por servicio.</p>
        </div>
        <button className="primary-action" disabled={busyId !== null || services.length === 0} type="button" onClick={() => setRows((current) => [emptyGiftCard(services), ...current])}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Agregar gift card
        </button>
      </div>

      {services.length === 0 ? <div className="surface p-5 text-sm font-semibold text-muted">Carga al menos un servicio activo con precio para emitir gift cards.</div> : null}

      {rows.map((row) => (
        <article className="surface grid gap-4 p-5" key={row.draftId}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Gift aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{statusLabels[row.status]} / {formatARS(row.amountPesos)}</p>
              <h3 className="mt-1 text-lg font-black">{row.code}</h3>
              <p className="mt-1 text-sm text-muted">{row.serviceName || "Servicio"}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px]">
            <label className="grid gap-2 text-sm font-semibold">
              Servicio
              <select className="input-control" disabled={!row.isNew} value={row.serviceId} onChange={(event) => updateRow(row.draftId, { serviceId: event.target.value })}>
                {services.map((service) => <option key={service.id} value={service.id}>{service.name} - {formatARS(service.pricePesos)}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Estado
              <select className="input-control" disabled={row.isNew} value={row.status} onChange={(event) => updateRow(row.draftId, { status: event.target.value as PanelGiftCardStatus })}>
                {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Vence
              <input className="input-control" type="datetime-local" value={row.expiresAt} onChange={(event) => updateRow(row.draftId, { expiresAt: event.target.value })} />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold">Comprador<input className="input-control" maxLength={120} value={row.purchaserName} onChange={(event) => updateRow(row.draftId, { purchaserName: event.target.value })} /></label>
            <label className="grid gap-2 text-sm font-semibold">WhatsApp comprador<input className="input-control" maxLength={40} value={row.purchaserPhone} onChange={(event) => updateRow(row.draftId, { purchaserPhone: event.target.value })} /></label>
            <label className="grid gap-2 text-sm font-semibold">Email comprador<input className="input-control" maxLength={160} type="email" value={row.purchaserEmail} onChange={(event) => updateRow(row.draftId, { purchaserEmail: event.target.value })} /></label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold">Destinatario<input className="input-control" maxLength={120} value={row.recipientName} onChange={(event) => updateRow(row.draftId, { recipientName: event.target.value })} /></label>
            <label className="grid gap-2 text-sm font-semibold">WhatsApp destinatario<input className="input-control" maxLength={40} value={row.recipientPhone} onChange={(event) => updateRow(row.draftId, { recipientPhone: event.target.value })} /></label>
            <label className="grid gap-2 text-sm font-semibold">Email destinatario<input className="input-control" maxLength={160} type="email" value={row.recipientEmail} onChange={(event) => updateRow(row.draftId, { recipientEmail: event.target.value })} /></label>
          </div>

          <label className="grid gap-2 text-sm font-semibold">
            Mensaje
            <textarea className="input-control min-h-20 resize-y" maxLength={500} value={row.message} onChange={(event) => updateRow(row.draftId, { message: event.target.value })} />
          </label>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
            <button className="secondary-action" disabled={busyId !== null} type="button" onClick={() => setDeleteTarget(row)}>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Cancelar
            </button>
            <button className="primary-action" disabled={busyId !== null} type="button" onClick={() => void saveRow(row)}>
              <Save aria-hidden="true" className="h-4 w-4" />
              {busyId === row.draftId ? "Guardando" : "Guardar"}
            </button>
          </div>
        </article>
      ))}

      {rows.length === 0 ? <div className="surface p-6 text-sm font-semibold text-muted">Todavia no hay gift cards.</div> : null}
      {message ? <p className={`text-sm font-semibold ${messageTone === "error" ? "text-red-600 dark:text-red-300" : "text-primary"}`}>{message}</p> : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-gift-card-title">
          <button aria-label="Cancelar baja" className="absolute inset-0 cursor-default bg-black/55" disabled={busyId === deleteTarget.draftId} type="button" onClick={() => setDeleteTarget(null)} />
          <div className="surface relative z-10 w-full max-w-md p-5 shadow-2xl">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h2 id="delete-gift-card-title" className="text-lg font-black">Cancelar gift card</h2>
                <p className="mt-2 text-sm leading-6 text-muted">La gift card deja de poder usarse, pero queda el registro operativo y de pago.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="secondary-action w-full sm:w-auto" type="button" disabled={busyId === deleteTarget.draftId} onClick={() => setDeleteTarget(null)}>Volver</button>
              <button className="danger-action w-full sm:w-auto" type="button" disabled={busyId === deleteTarget.draftId} onClick={() => void confirmDeleteRow()}>
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                {busyId === deleteTarget.draftId ? "Cancelando" : "Cancelar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
