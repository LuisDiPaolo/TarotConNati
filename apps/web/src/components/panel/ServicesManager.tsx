"use client";

import { AlertTriangle, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { PanelServiceSettings } from "@/lib/operations/panel-settings.types";

type DraftService = PanelServiceSettings & { draftId: string; isNew?: boolean };

const modalityLabels: Record<PanelServiceSettings["serviceModality"], string> = {
  in_person: "Presencial",
  virtual_scheduled: "Virtual con hora",
  virtual_on_demand: "Virtual a demanda",
  contact_request: "Solicitud/contacto",
};

const policyLabels: Record<PanelServiceSettings["schedulingPolicy"], string> = {
  scheduled: "Requiere horario",
  day_request: "Pide dia/ventana",
  manual_coordination: "Coordinacion manual",
  no_calendar_block: "No bloquea agenda",
};

function createDraftId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeSchedulingPatch(patch: Partial<DraftService>): Partial<DraftService> {
  const nextPatch = { ...patch };
  if (nextPatch.serviceModality === "contact_request") {
    nextPatch.schedulingPolicy = "manual_coordination";
    nextPatch.blocksCalendar = false;
    nextPatch.requiresManualConfirmation = true;
  }
  if (nextPatch.schedulingPolicy && nextPatch.schedulingPolicy !== "scheduled") {
    nextPatch.blocksCalendar = false;
  }
  return nextPatch;
}

function emptyService(): DraftService {
  return {
    draftId: createDraftId(),
    id: "",
    name: "",
    description: "",
    category: "General",
    serviceModality: "in_person",
    schedulingPolicy: "scheduled",
    durationMinutes: 60,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    blocksCalendar: true,
    arrivalInstructions: "",
    virtualInstructions: "",
    requiresManualConfirmation: false,
    priceCents: 0,
    depositCents: 0,
    paymentMode: "deposit",
    active: true,
    sortOrder: 0,
    isNew: true,
  };
}

export function ServicesManager({ services }: { services: PanelServiceSettings[] }) {
  const [rows, setRows] = useState<DraftService[]>(services.map((service) => ({ ...service, draftId: service.id })));
  const [message, setMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DraftService | null>(null);

  function updateRow(draftId: string, patch: Partial<DraftService>) {
    const normalizedPatch = normalizeSchedulingPatch(patch);
    setRows((current) => current.map((row) => row.draftId === draftId ? { ...row, ...normalizedPatch } : row));
  }

  async function saveRow(row: DraftService) {
    setMessage("");
    const payload = {
      name: row.name,
      description: row.description,
      category: row.category,
      serviceModality: row.serviceModality,
      schedulingPolicy: row.schedulingPolicy,
      durationMinutes: row.durationMinutes,
      bufferBeforeMinutes: row.bufferBeforeMinutes,
      bufferAfterMinutes: row.bufferAfterMinutes,
      blocksCalendar: row.blocksCalendar,
      arrivalInstructions: row.arrivalInstructions,
      virtualInstructions: row.virtualInstructions,
      requiresManualConfirmation: row.requiresManualConfirmation,
      priceCents: row.priceCents,
      depositCents: row.depositCents,
      paymentMode: row.paymentMode,
      active: row.active,
      sortOrder: row.sortOrder,
    };
    const response = await fetch(row.isNew ? "/api/panel/services" : `/api/panel/services/${row.id}`, {
      method: row.isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null) as { id?: string } | null;

    if (!response.ok) {
      setMessage("No se pudo guardar el servicio.");
      return;
    }

    if (row.isNew && data?.id) {
      updateRow(row.draftId, { id: data.id, draftId: data.id, isNew: false });
    }
    setMessage("Servicio guardado.");
  }

  async function confirmDeleteRow() {
    if (!deleteTarget) return;
    setMessage("");
    if (deleteTarget.isNew || !deleteTarget.id) {
      setRows((current) => current.filter((currentRow) => currentRow.draftId !== deleteTarget.draftId));
      setDeleteTarget(null);
      return;
    }

    const response = await fetch(`/api/panel/services/${deleteTarget.id}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("No se pudo borrar el servicio.");
      return;
    }

    setRows((current) => current.filter((currentRow) => currentRow.id !== deleteTarget.id));
    setDeleteTarget(null);
    setMessage("Servicio borrado.");
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <button className="primary-action" type="button" onClick={() => setRows((current) => [...current, emptyService()])}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Agregar servicio
        </button>
      </div>

      {rows.map((row) => (
        <article className="surface grid gap-5 p-5" key={row.draftId}>
          <div className="grid gap-3 md:grid-cols-4">
            <label className="grid gap-2 text-sm font-semibold md:col-span-2">
              Nombre
              <input className="input-control" value={row.name} onChange={(event) => updateRow(row.draftId, { name: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Categoria
              <input className="input-control" value={row.category} onChange={(event) => updateRow(row.draftId, { category: event.target.value })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Orden
              <input className="input-control" type="number" value={row.sortOrder} onChange={(event) => updateRow(row.draftId, { sortOrder: Number(event.target.value) })} />
            </label>
          </div>

          <textarea className="input-control min-h-20 resize-y" value={row.description} onChange={(event) => updateRow(row.draftId, { description: event.target.value })} placeholder="Descripcion" />

          <div className="grid gap-3 lg:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold">
              Modalidad
              <select className="input-control" value={row.serviceModality} onChange={(event) => updateRow(row.draftId, { serviceModality: event.target.value as DraftService["serviceModality"] })}>
                {Object.entries(modalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Agenda
              <select className="input-control" value={row.schedulingPolicy} onChange={(event) => updateRow(row.draftId, { schedulingPolicy: event.target.value as DraftService["schedulingPolicy"] })}>
                {Object.entries(policyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="flex items-end gap-2 text-sm font-semibold">
              <input type="checkbox" checked={row.requiresManualConfirmation} onChange={(event) => updateRow(row.draftId, { requiresManualConfirmation: event.target.checked })} />
              Confirmacion manual
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="grid gap-2 text-sm font-semibold">
              Duracion min.
              <input className="input-control" type="number" min={5} max={480} value={row.durationMinutes} onChange={(event) => updateRow(row.draftId, { durationMinutes: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Buffer antes
              <input className="input-control" type="number" min={0} max={480} value={row.bufferBeforeMinutes} onChange={(event) => updateRow(row.draftId, { bufferBeforeMinutes: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Buffer despues
              <input className="input-control" type="number" min={0} max={480} value={row.bufferAfterMinutes} onChange={(event) => updateRow(row.draftId, { bufferAfterMinutes: Number(event.target.value) })} />
            </label>
            <label className="flex items-end gap-2 text-sm font-semibold">
              <input type="checkbox" checked={row.blocksCalendar} disabled={row.schedulingPolicy !== "scheduled"} onChange={(event) => updateRow(row.draftId, { blocksCalendar: event.target.checked })} />
              Bloquea agenda
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <textarea className="input-control min-h-20 resize-y" value={row.arrivalInstructions} onChange={(event) => updateRow(row.draftId, { arrivalInstructions: event.target.value })} placeholder="Instrucciones presenciales o llegada anticipada" />
            <textarea className="input-control min-h-20 resize-y" value={row.virtualInstructions} onChange={(event) => updateRow(row.draftId, { virtualInstructions: event.target.value })} placeholder="Instrucciones virtuales o de coordinacion" />
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <label className="grid gap-2 text-sm font-semibold">
              Precio centavos
              <input className="input-control" type="number" min={0} value={row.priceCents} onChange={(event) => updateRow(row.draftId, { priceCents: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Sena centavos
              <input className="input-control" type="number" min={0} value={row.depositCents} onChange={(event) => updateRow(row.draftId, { depositCents: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Cobro al reservar
              <select className="input-control" value={row.paymentMode} onChange={(event) => updateRow(row.draftId, { paymentMode: event.target.value as DraftService["paymentMode"] })}>
                <option value="deposit">Sena</option>
                <option value="full">Pago total adelantado</option>
                <option value="none">Sin cobro online</option>
              </select>
            </label>
            <label className="flex items-end gap-2 text-sm font-semibold">
              <input type="checkbox" checked={row.active} onChange={(event) => updateRow(row.draftId, { active: event.target.checked })} />
              Activo
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <button className="icon-action danger-icon-action" type="button" onClick={() => setDeleteTarget(row)} title="Borrar servicio">
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
            <button className="primary-action" type="button" onClick={() => saveRow(row)}>
              <Save aria-hidden="true" className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </article>
      ))}

      {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-service-title">
          <div className="surface w-full max-w-md p-5 shadow-2xl">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h2 id="delete-service-title" className="text-lg font-black">Borrar servicio</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Vas a borrar {deleteTarget.name || "este servicio"}. Si ya fue guardado, se desactiva para no romper turnos historicos.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="secondary-action w-full sm:w-auto" type="button" onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
              <button className="danger-action w-full sm:w-auto" type="button" onClick={confirmDeleteRow}>
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
