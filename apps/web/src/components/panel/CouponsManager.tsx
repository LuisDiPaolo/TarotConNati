"use client";

import { BadgePercent, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { PanelCoupon } from "@/lib/operations/panel-coupons";
import { formatARS } from "@/shared";

type DraftCoupon = PanelCoupon & { draftId: string; isNew?: boolean };

const weekdays = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mie" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sab" },
  { value: 7, label: "Dom" },
];

function createDraftId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyCoupon(): DraftCoupon {
  return {
    draftId: createDraftId(),
    id: "",
    code: "",
    description: "",
    discountType: "percent",
    discountValue: 10,
    appliesToServices: true,
    appliesToProducts: false,
    validityType: "always",
    validOnDate: "",
    validWeekdays: [],
    startsOn: "",
    endsOn: "",
    usageLimit: null,
    usedCount: 0,
    active: true,
    isNew: true,
  };
}

function discountLabel(coupon: Pick<PanelCoupon, "discountType" | "discountValue">) {
  if (coupon.discountType === "two_for_one") return "2x1";
  if (coupon.discountType === "percent") return `${coupon.discountValue}%`;
  return formatARS(coupon.discountValue);
}

function scopeLabel(coupon: Pick<PanelCoupon, "appliesToServices" | "appliesToProducts">) {
  if (coupon.appliesToServices && coupon.appliesToProducts) return "Servicios y productos";
  if (coupon.appliesToProducts) return "Productos";
  return "Servicios";
}

export function CouponsManager({ coupons }: { coupons: PanelCoupon[] }) {
  const [rows, setRows] = useState<DraftCoupon[]>(coupons.map((coupon) => ({ ...coupon, draftId: coupon.id })));
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DraftCoupon | null>(null);

  function updateRow(draftId: string, patch: Partial<DraftCoupon>) {
    setRows((current) => current.map((row) => row.draftId === draftId ? { ...row, ...patch } : row));
  }

  async function saveRow(row: DraftCoupon) {
    if (busyId) return;
    setMessage("");
    if (row.code.trim().length < 2 || (!row.appliesToServices && !row.appliesToProducts)) {
      setMessageTone("error");
      setMessage("Completa codigo y alcance antes de guardar.");
      return;
    }

    setBusyId(row.draftId);
    const response = await fetch(row.isNew ? "/api/panel/coupons" : `/api/panel/coupons/${row.id}`, {
      method: row.isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: row.code,
        description: row.description,
        discountType: row.discountType,
        discountValue: row.discountType === "two_for_one" ? 0 : row.discountValue,
        appliesToServices: row.appliesToServices,
        appliesToProducts: row.appliesToProducts,
        validityType: row.validityType,
        validOnDate: row.validOnDate,
        validWeekdays: row.validWeekdays,
        startsOn: row.startsOn,
        endsOn: row.endsOn,
        usageLimit: row.usageLimit,
        active: row.active,
      }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null) as { data?: { id?: string }; error?: { message?: string } } | null;

    if (!response?.ok) {
      setBusyId(null);
      setMessageTone("error");
      setMessage(data?.error?.message ?? "No se pudo guardar el cupon.");
      return;
    }

    if (row.isNew && data?.data?.id) updateRow(row.draftId, { id: data.data.id, draftId: data.data.id, isNew: false });
    setBusyId(null);
    setMessageTone("success");
    setMessage("Cupon guardado.");
  }

  async function confirmDeleteRow() {
    if (!deleteTarget || busyId) return;
    if (deleteTarget.isNew || !deleteTarget.id) {
      setRows((current) => current.filter((row) => row.draftId !== deleteTarget.draftId));
      setDeleteTarget(null);
      return;
    }

    setBusyId(deleteTarget.draftId);
    const response = await fetch(`/api/panel/coupons/${deleteTarget.id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setBusyId(null);
      setMessageTone("error");
      setMessage("No se pudo borrar el cupon.");
      return;
    }

    setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
    setDeleteTarget(null);
    setBusyId(null);
    setMessageTone("success");
    setMessage("Cupon borrado.");
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Cupones de checkout</h2>
          <p className="mt-1 text-sm text-muted">Descuentos que el cliente ingresa al reservar o comprar.</p>
        </div>
        <button className="primary-action" disabled={busyId !== null} onClick={() => setRows((current) => [...current, emptyCoupon()])} type="button">
          <Plus aria-hidden="true" className="h-4 w-4" />
          Agregar cupon
        </button>
      </div>

      {rows.map((row) => (
        <article className="surface grid gap-4 p-5" key={row.draftId}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <BadgePercent aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{discountLabel(row)} / {scopeLabel(row)}</p>
              <h3 className="mt-1 text-lg font-black">{row.code || "Nuevo cupon"}</h3>
              <p className="mt-1 text-xs font-semibold text-muted">Usos: {row.usedCount}{row.usageLimit ? ` / ${row.usageLimit}` : ""}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_160px]">
            <label className="grid gap-2 text-sm font-semibold">
              Codigo
              <input className="input-control uppercase" value={row.code} onChange={(event) => updateRow(row.draftId, { code: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Tipo
              <select className="input-control" value={row.discountType} onChange={(event) => updateRow(row.draftId, { discountType: event.target.value as PanelCoupon["discountType"], discountValue: event.target.value === "two_for_one" ? 0 : row.discountValue || 10 })}>
                <option value="percent">Porcentaje</option>
                <option value="fixed_amount">Monto fijo</option>
                <option value="two_for_one">2x1</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Valor
              <input className="input-control" disabled={row.discountType === "two_for_one"} min={row.discountType === "percent" ? 1 : 0} max={row.discountType === "percent" ? 100 : undefined} type="number" value={row.discountType === "two_for_one" ? 0 : row.discountValue} onChange={(event) => updateRow(row.draftId, { discountValue: Number(event.target.value) })} />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-semibold">
            Descripcion interna
            <textarea className="input-control min-h-20 resize-y" value={row.description} onChange={(event) => updateRow(row.draftId, { description: event.target.value })} />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <fieldset className="grid gap-2 text-sm font-semibold">
              <legend>Aplica a</legend>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2"><input checked={row.appliesToServices} type="checkbox" onChange={(event) => updateRow(row.draftId, { appliesToServices: event.target.checked })} /> Servicios/reservas</label>
                <label className="inline-flex items-center gap-2"><input checked={row.appliesToProducts} type="checkbox" onChange={(event) => updateRow(row.draftId, { appliesToProducts: event.target.checked })} /> Productos</label>
              </div>
            </fieldset>
            <label className="grid gap-2 text-sm font-semibold">
              Limite de usos
              <input className="input-control" min={1} placeholder="Sin limite" type="number" value={row.usageLimit ?? ""} onChange={(event) => updateRow(row.draftId, { usageLimit: event.target.value ? Number(event.target.value) : null })} />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
            <label className="grid gap-2 text-sm font-semibold">
              Vigencia
              <select className="input-control" value={row.validityType} onChange={(event) => updateRow(row.draftId, { validityType: event.target.value as PanelCoupon["validityType"] })}>
                <option value="always">Siempre</option>
                <option value="single_date">Dia especifico</option>
                <option value="weekly">Repite semanal</option>
                <option value="range">Periodo</option>
              </select>
            </label>
            {row.validityType === "single_date" ? (
              <label className="grid gap-2 text-sm font-semibold">Dia<input className="input-control" type="date" value={row.validOnDate} onChange={(event) => updateRow(row.draftId, { validOnDate: event.target.value })} /></label>
            ) : row.validityType === "weekly" ? (
              <fieldset className="grid gap-2 text-sm font-semibold">
                <legend>Dias</legend>
                <div className="flex flex-wrap gap-2">
                  {weekdays.map((weekday) => {
                    const checked = row.validWeekdays.includes(weekday.value);
                    return <label className="rounded-full border border-slate-200 px-3 py-2 dark:border-white/10" key={weekday.value}><input className="mr-2" checked={checked} type="checkbox" onChange={(event) => updateRow(row.draftId, { validWeekdays: event.target.checked ? [...row.validWeekdays, weekday.value] : row.validWeekdays.filter((value) => value !== weekday.value) })} />{weekday.label}</label>;
                  })}
                </div>
              </fieldset>
            ) : row.validityType === "range" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">Desde<input className="input-control" type="date" value={row.startsOn} onChange={(event) => updateRow(row.draftId, { startsOn: event.target.value })} /></label>
                <label className="grid gap-2 text-sm font-semibold">Hasta<input className="input-control" type="date" value={row.endsOn} onChange={(event) => updateRow(row.draftId, { endsOn: event.target.value })} /></label>
              </div>
            ) : <div className="self-end text-sm font-semibold text-muted">Sin restriccion de fecha.</div>}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
            <label className="inline-flex items-center gap-3 text-sm font-semibold"><input checked={row.active} type="checkbox" onChange={(event) => updateRow(row.draftId, { active: event.target.checked })} />Activo</label>
            <div className="flex flex-wrap justify-end gap-2">
              <button className="secondary-action" disabled={busyId !== null} onClick={() => setDeleteTarget(row)} type="button"><Trash2 aria-hidden="true" className="h-4 w-4" />Borrar</button>
              <button className="primary-action" disabled={busyId !== null} onClick={() => void saveRow(row)} type="button"><Save aria-hidden="true" className="h-4 w-4" />{busyId === row.draftId ? "Guardando" : "Guardar"}</button>
            </div>
          </div>
        </article>
      ))}

      {rows.length === 0 ? <div className="surface p-6 text-sm font-semibold text-muted">Todavia no hay cupones.</div> : null}
      {message ? <p className={`text-sm font-semibold ${messageTone === "error" ? "text-red-600 dark:text-red-300" : "text-primary"}`}>{message}</p> : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="surface w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-lg font-black">Borrar cupon</h3>
            <p className="mt-2 text-sm leading-6 text-muted">El codigo deja de poder usarse en checkout.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="secondary-action" type="button" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="primary-action" type="button" onClick={() => void confirmDeleteRow()}>{busyId ? "Borrando" : "Borrar"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
