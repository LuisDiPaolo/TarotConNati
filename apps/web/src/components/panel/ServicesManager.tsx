"use client";

import { Plus, Save } from "lucide-react";
import { useState } from "react";
import type { PanelServiceSettings } from "@/lib/operations/panel-settings.types";

type DraftService = PanelServiceSettings & { draftId: string; isNew?: boolean };

function emptyService(): DraftService {
  return {
    draftId: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    id: "",
    name: "",
    description: "",
    category: "General",
    durationMinutes: 60,
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

  function updateRow(draftId: string, patch: Partial<DraftService>) {
    setRows((current) => current.map((row) => row.draftId === draftId ? { ...row, ...patch } : row));
  }

  async function saveRow(row: DraftService) {
    setMessage("");
    const payload = {
      name: row.name,
      description: row.description,
      category: row.category,
      durationMinutes: row.durationMinutes,
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

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <button className="primary-action" type="button" onClick={() => setRows((current) => [...current, emptyService()])}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Agregar servicio
        </button>
      </div>

      {rows.map((row) => (
        <article className="surface grid gap-4 p-5" key={row.draftId}>
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

          <div className="grid gap-3 md:grid-cols-5">
            <label className="grid gap-2 text-sm font-semibold">
              Duracion
              <input className="input-control" type="number" min={5} max={480} value={row.durationMinutes} onChange={(event) => updateRow(row.draftId, { durationMinutes: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Precio centavos
              <input className="input-control" type="number" min={0} value={row.priceCents} onChange={(event) => updateRow(row.draftId, { priceCents: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Seña centavos
              <input className="input-control" type="number" min={0} value={row.depositCents} onChange={(event) => updateRow(row.draftId, { depositCents: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Pago
              <select className="input-control" value={row.paymentMode} onChange={(event) => updateRow(row.draftId, { paymentMode: event.target.value as DraftService["paymentMode"] })}>
                <option value="deposit">Seña</option>
                <option value="full">Pago total</option>
                <option value="none">Sin pago</option>
              </select>
            </label>
            <label className="flex items-end gap-2 text-sm font-semibold">
              <input type="checkbox" checked={row.active} onChange={(event) => updateRow(row.draftId, { active: event.target.checked })} />
              Activo
            </label>
          </div>

          <div className="flex justify-end">
            <button className="primary-action" type="button" onClick={() => saveRow(row)}>
              <Save aria-hidden="true" className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </article>
      ))}

      {message ? <p className="text-sm font-semibold text-emerald-600">{message}</p> : null}
    </div>
  );
}
