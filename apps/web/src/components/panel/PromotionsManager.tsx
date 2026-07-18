"use client";

import { Plus, Save, Tags, Trash2 } from "lucide-react";
import { useState } from "react";
import type { PanelPromotion } from "@/lib/operations/panel-promotions";
import { formatARS } from "@/shared";

type DraftPromotion = PanelPromotion & { draftId: string; isNew?: boolean };

function createDraftId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toInputDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function emptyPromotion(): DraftPromotion {
  return {
    draftId: createDraftId(),
    id: "",
    title: "",
    description: "",
    discountType: "percent",
    discountValue: 10,
    startsAt: "",
    endsAt: "",
    active: true,
    isNew: true,
  };
}

function discountLabel(promotion: Pick<PanelPromotion, "discountType" | "discountValue">) {
  return promotion.discountType === "percent" ? `${promotion.discountValue}%` : formatARS(promotion.discountValue);
}

export function PromotionsManager({ promotions }: { promotions: PanelPromotion[] }) {
  const [rows, setRows] = useState<DraftPromotion[]>(promotions.map((promotion) => ({ ...promotion, startsAt: toInputDate(promotion.startsAt), endsAt: toInputDate(promotion.endsAt), draftId: promotion.id })));
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DraftPromotion | null>(null);

  function updateRow(draftId: string, patch: Partial<DraftPromotion>) {
    setRows((current) => current.map((row) => row.draftId === draftId ? { ...row, ...patch } : row));
  }

  async function saveRow(row: DraftPromotion) {
    if (busyId) return;
    setMessage("");
    if (row.title.trim().length < 2 || row.discountValue <= 0) {
      setMessageTone("error");
      setMessage("Completa titulo y descuento antes de guardar.");
      return;
    }

    setBusyId(row.draftId);
    const response = await fetch(row.isNew ? "/api/panel/promotions" : `/api/panel/promotions/${row.id}`, {
      method: row.isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: row.title,
        description: row.description,
        discountType: row.discountType,
        discountValue: row.discountValue,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        active: row.active,
      }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null) as { data?: { id?: string }; error?: { message?: string } } | null;

    if (!response?.ok) {
      setBusyId(null);
      setMessageTone("error");
      setMessage(data?.error?.message ?? "No se pudo guardar la promocion.");
      return;
    }

    if (row.isNew && data?.data?.id) updateRow(row.draftId, { id: data.data.id, draftId: data.data.id, isNew: false });
    setBusyId(null);
    setMessageTone("success");
    setMessage("Promocion guardada.");
  }

  async function confirmDeleteRow() {
    if (!deleteTarget || busyId) return;
    if (deleteTarget.isNew || !deleteTarget.id) {
      setRows((current) => current.filter((row) => row.draftId !== deleteTarget.draftId));
      setDeleteTarget(null);
      return;
    }

    setBusyId(deleteTarget.draftId);
    const response = await fetch(`/api/panel/promotions/${deleteTarget.id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setBusyId(null);
      setMessageTone("error");
      setMessage("No se pudo quitar la promocion.");
      return;
    }

    setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
    setDeleteTarget(null);
    setBusyId(null);
    setMessageTone("success");
    setMessage("Promocion quitada.");
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Promociones</h2>
          <p className="mt-1 text-sm text-muted">Precios especiales o descuentos con vigencia publica.</p>
        </div>
        <button className="primary-action" disabled={busyId !== null} onClick={() => setRows((current) => [...current, emptyPromotion()])} type="button">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Agregar promocion
        </button>
      </div>

      {rows.map((row) => (
        <article className="surface grid gap-4 p-5" key={row.draftId}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Tags aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{discountLabel(row)}</p>
              <h3 className="mt-1 text-lg font-black">{row.title || "Nueva promocion"}</h3>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px]">
            <label className="grid gap-2 text-sm font-semibold">
              Titulo
              <input className="input-control" value={row.title} onChange={(event) => updateRow(row.draftId, { title: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Tipo
              <select className="input-control" value={row.discountType} onChange={(event) => updateRow(row.draftId, { discountType: event.target.value as PanelPromotion["discountType"] })}>
                <option value="percent">Porcentaje</option>
                <option value="fixed_amount">Monto fijo</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Valor
              <input className="input-control" min={1} max={row.discountType === "percent" ? 100 : undefined} type="number" value={row.discountValue} onChange={(event) => updateRow(row.draftId, { discountValue: Number(event.target.value) })} />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-semibold">
            Descripcion
            <textarea className="input-control min-h-20 resize-y" value={row.description} onChange={(event) => updateRow(row.draftId, { description: event.target.value })} />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Desde
              <input className="input-control" type="datetime-local" value={row.startsAt} onChange={(event) => updateRow(row.draftId, { startsAt: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Hasta
              <input className="input-control" type="datetime-local" value={row.endsAt} onChange={(event) => updateRow(row.draftId, { endsAt: event.target.value })} />
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
            <label className="inline-flex items-center gap-3 text-sm font-semibold">
              <input checked={row.active} type="checkbox" onChange={(event) => updateRow(row.draftId, { active: event.target.checked })} />
              Visible en la web publica
            </label>
            <div className="flex flex-wrap justify-end gap-2">
              <button className="secondary-action" disabled={busyId !== null} onClick={() => setDeleteTarget(row)} type="button">
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Quitar
              </button>
              <button className="primary-action" disabled={busyId !== null} onClick={() => void saveRow(row)} type="button">
                <Save aria-hidden="true" className="h-4 w-4" />
                {busyId === row.draftId ? "Guardando" : "Guardar"}
              </button>
            </div>
          </div>
        </article>
      ))}

      {rows.length === 0 ? <div className="surface p-6 text-sm font-semibold text-muted">Todavia no hay promociones.</div> : null}
      {message ? <p className={`text-sm font-semibold ${messageTone === "error" ? "text-red-600 dark:text-red-300" : "text-primary"}`}>{message}</p> : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="surface w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-lg font-black">Quitar promocion</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Esta accion quita la promocion de la web publica.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="secondary-action" type="button" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="primary-action" type="button" onClick={() => void confirmDeleteRow()}>{busyId ? "Quitando" : "Quitar"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
