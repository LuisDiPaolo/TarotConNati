"use client";

import { Plus, Save } from "lucide-react";
import { useState } from "react";
import type { PanelScheduleSettings } from "@/lib/operations/panel-settings.types";

const weekdays = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"];

type DraftSchedule = PanelScheduleSettings & { draftId: string; isNew?: boolean };

function emptySchedule(): DraftSchedule {
  return {
    draftId: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    id: "",
    weekday: 1,
    startsAt: "09:00",
    endsAt: "18:00",
    breakStartsAt: "",
    breakEndsAt: "",
    active: true,
    isNew: true,
  };
}

export function ScheduleManager({ schedules }: { schedules: PanelScheduleSettings[] }) {
  const [rows, setRows] = useState<DraftSchedule[]>(schedules.map((schedule) => ({ ...schedule, draftId: schedule.id })));
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  function updateRow(draftId: string, patch: Partial<DraftSchedule>) {
    setRows((current) => current.map((row) => row.draftId === draftId ? { ...row, ...patch } : row));
  }

  async function saveRow(row: DraftSchedule) {
    if (savingId) return;
    setMessage("");
    setSavingId(row.draftId);
    const payload = {
      weekday: row.weekday,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      breakStartsAt: row.breakStartsAt,
      breakEndsAt: row.breakEndsAt,
      active: row.active,
    };
    const response = await fetch(row.isNew ? "/api/panel/schedules" : `/api/panel/schedules/${row.id}`, {
      method: row.isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const data = await response?.json().catch(() => null) as { id?: string } | null;

    if (!response?.ok) {
      setSavingId(null);
      setMessage("No se pudo guardar el horario.");
      return;
    }

    if (row.isNew && data?.id) {
      updateRow(row.draftId, { id: data.id, draftId: data.id, isNew: false });
    }
    setSavingId(null);
    setMessage("Horario guardado.");
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <button className="primary-action" type="button" disabled={savingId !== null} onClick={() => setRows((current) => [...current, emptySchedule()])}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Agregar horario
        </button>
      </div>

      <div className="surface overflow-x-auto p-2">
        <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-sm">
          <thead className="text-left text-xs uppercase tracking-[0.12em] text-muted">
            <tr>
              <th className="px-3 py-2">Dia</th>
              <th className="px-3 py-2">Apertura</th>
              <th className="px-3 py-2">Cierre</th>
              <th className="px-3 py-2">Pausa inicio</th>
              <th className="px-3 py-2">Pausa fin</th>
              <th className="px-3 py-2">Activo</th>
              <th className="px-3 py-2 text-right">Accion</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className="bg-white/80" key={row.draftId}>
                <td className="rounded-l-xl px-3 py-2">
                  <select className="input-control" value={row.weekday} onChange={(event) => updateRow(row.draftId, { weekday: Number(event.target.value) })}>
                    {weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input className="input-control" type="time" value={row.startsAt} onChange={(event) => updateRow(row.draftId, { startsAt: event.target.value })} />
                </td>
                <td className="px-3 py-2">
                  <input className="input-control" type="time" value={row.endsAt} onChange={(event) => updateRow(row.draftId, { endsAt: event.target.value })} />
                </td>
                <td className="px-3 py-2">
                  <input className="input-control" type="time" value={row.breakStartsAt} onChange={(event) => updateRow(row.draftId, { breakStartsAt: event.target.value })} />
                </td>
                <td className="px-3 py-2">
                  <input className="input-control" type="time" value={row.breakEndsAt} onChange={(event) => updateRow(row.draftId, { breakEndsAt: event.target.value })} />
                </td>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={row.active} onChange={(event) => updateRow(row.draftId, { active: event.target.checked })} />
                </td>
                <td className="rounded-r-xl px-3 py-2 text-right">
                  <button className="icon-action" type="button" disabled={savingId !== null} onClick={() => saveRow(row)} aria-label="Guardar horario">
                    <Save aria-hidden="true" className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message ? <p className={message.startsWith("No") ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-emerald-600"}>{message}</p> : null}
    </div>
  );
}
