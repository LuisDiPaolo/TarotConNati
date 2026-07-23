"use client";

import { AlertTriangle, Plus, Save, Trash2 } from "lucide-react";
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DraftSchedule | null>(null);

  function updateRow(draftId: string, patch: Partial<DraftSchedule>) {
    setRows((current) => current.map((row) => row.draftId === draftId ? { ...row, ...patch } : row));
  }

  async function saveRow(row: DraftSchedule) {
    if (savingId || deletingId) return;
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

  async function confirmDeleteRow() {
    if (!deleteTarget || savingId || deletingId) return;
    setMessage("");
    if (deleteTarget.isNew || !deleteTarget.id) {
      setRows((current) => current.filter((row) => row.draftId !== deleteTarget.draftId));
      setDeleteTarget(null);
      return;
    }

    setDeletingId(deleteTarget.draftId);
    const response = await fetch(`/api/panel/schedules/${deleteTarget.id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setDeletingId(null);
      setMessage("No se pudo borrar el horario.");
      return;
    }

    setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeletingId(null);
    setMessage("Horario borrado.");
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <button className="primary-action" type="button" disabled={savingId !== null || deletingId !== null} onClick={() => setRows((current) => [...current, emptySchedule()])}>
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
                  <div className="flex justify-end gap-2">
                    <button className="icon-action" type="button" disabled={savingId !== null || deletingId !== null} onClick={() => saveRow(row)} aria-label="Guardar horario">
                      <Save aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button className="icon-action danger-icon-action" type="button" disabled={savingId !== null || deletingId !== null} onClick={() => setDeleteTarget(row)} aria-label="Borrar horario">
                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message ? <p className={message.startsWith("No") ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-emerald-600"}>{message}</p> : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-schedule-title">
          <button aria-label="Cancelar borrado" className="absolute inset-0 cursor-default bg-black/55" disabled={deletingId === deleteTarget.draftId} type="button" onClick={() => setDeleteTarget(null)} />
          <div className="surface relative z-10 w-full max-w-md p-5 shadow-2xl">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h2 id="delete-schedule-title" className="text-lg font-black">Borrar horario</h2>
                <p className="mt-2 text-sm leading-6 text-muted">Vas a quitar esta fila de agenda semanal. Los turnos ya creados no se modifican.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="secondary-action w-full sm:w-auto" type="button" disabled={deletingId === deleteTarget.draftId} onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="danger-action w-full sm:w-auto" type="button" disabled={deletingId === deleteTarget.draftId} onClick={() => void confirmDeleteRow()}>
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                {deletingId === deleteTarget.draftId ? "Borrando" : "Borrar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
