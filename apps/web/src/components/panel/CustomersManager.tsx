"use client";

import { AlertTriangle, Eye, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { PanelCustomerSummary } from "@/lib/operations/panel-customers";

type DraftCustomer = PanelCustomerSummary & { draftId: string; isNew?: boolean };

function createDraftId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyCustomer(): DraftCustomer {
  return {
    draftId: createDraftId(),
    id: "",
    fullName: "",
    phone: "",
    email: "",
    notes: "",
    createdAt: new Date().toISOString(),
    isNew: true,
  };
}

export function CustomersManager({ customers }: { customers: PanelCustomerSummary[] }) {
  const [rows, setRows] = useState<DraftCustomer[]>(customers.map((customer) => ({ ...customer, draftId: customer.id })));
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DraftCustomer | null>(null);

  function updateRow(draftId: string, patch: Partial<DraftCustomer>) {
    setRows((current) => current.map((row) => row.draftId === draftId ? { ...row, ...patch } : row));
  }

  async function saveRow(row: DraftCustomer) {
    if (savingId || deletingId) return;
    setMessage("");
    setMessageTone("success");
    if (row.fullName.trim().length < 2) {
      setMessageTone("error");
      setMessage("Escribi el nombre del cliente antes de guardar.");
      return;
    }

    setSavingId(row.draftId);
    const response = await fetch(row.isNew ? "/api/panel/customers" : `/api/panel/customers/${row.id}`, {
      method: row.isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: row.fullName,
        phone: row.phone,
        email: row.email,
        notes: row.notes,
      }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null) as { data?: { id?: string }; error?: { message?: string } } | null;

    if (!response?.ok) {
      setSavingId(null);
      setMessageTone("error");
      setMessage(data?.error?.message ?? "No se pudo guardar el cliente.");
      return;
    }

    if (row.isNew && data?.data?.id) updateRow(row.draftId, { id: data.data.id, draftId: data.data.id, isNew: false });
    setSavingId(null);
    setMessage("Cliente guardado.");
  }

  async function confirmDeleteRow() {
    if (!deleteTarget || savingId || deletingId) return;
    setMessage("");
    setMessageTone("success");
    if (deleteTarget.isNew || !deleteTarget.id) {
      setRows((current) => current.filter((row) => row.draftId !== deleteTarget.draftId));
      setDeleteTarget(null);
      return;
    }

    setDeletingId(deleteTarget.draftId);
    const response = await fetch(`/api/panel/customers/${deleteTarget.id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setDeletingId(null);
      setMessageTone("error");
      setMessage("No se pudo borrar el cliente.");
      return;
    }

    setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeletingId(null);
    setMessage("Cliente borrado del panel. El historial operativo se conserva.");
  }

  return (
    <div className="grid gap-4">
      <div className="flex justify-end">
        <button className="primary-action" disabled={savingId !== null || deletingId !== null} type="button" onClick={() => setRows((current) => [emptyCustomer(), ...current])}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Agregar cliente
        </button>
      </div>

      <div className="grid gap-3">
        {rows.map((row) => (
          <article className="surface grid gap-4 p-4" key={row.draftId}>
            <div className="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_170px_220px]">
              <label className="grid gap-2 text-sm font-semibold">
                Nombre
                <input className="input-control" maxLength={120} value={row.fullName} onChange={(event) => updateRow(row.draftId, { fullName: event.target.value })} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Telefono
                <input className="input-control" maxLength={40} value={row.phone} onChange={(event) => updateRow(row.draftId, { phone: event.target.value })} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Email
                <input className="input-control" maxLength={160} type="email" value={row.email} onChange={(event) => updateRow(row.draftId, { email: event.target.value })} />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold">
              Notas internas
              <textarea className="input-control min-h-20 resize-y" maxLength={1000} value={row.notes} onChange={(event) => updateRow(row.draftId, { notes: event.target.value })} />
            </label>

            <div className="flex flex-wrap justify-end gap-2 border-t border-[rgb(var(--color-border))] pt-3">
              {!row.isNew && row.id ? (
                <a className="secondary-action" href={`/clientes/${row.id}`}>
                  <Eye aria-hidden="true" className="h-4 w-4" />
                  Ver ficha
                </a>
              ) : null}
              <button className="secondary-action" disabled={savingId !== null || deletingId !== null} type="button" onClick={() => setDeleteTarget(row)}>
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                Borrar
              </button>
              <button className="primary-action" disabled={savingId !== null || deletingId !== null} type="button" onClick={() => void saveRow(row)}>
                <Save aria-hidden="true" className="h-4 w-4" />
                {savingId === row.draftId ? "Guardando" : "Guardar"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {rows.length === 0 ? <div className="surface p-6 text-sm font-semibold text-muted">Todavia no hay clientes.</div> : null}
      {message ? <p className={`text-sm font-semibold ${messageTone === "error" ? "text-red-600 dark:text-red-300" : "text-primary"}`}>{message}</p> : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[120] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-customer-title">
          <button aria-label="Cancelar borrado" className="absolute inset-0 cursor-default bg-black/55" disabled={deletingId === deleteTarget.draftId} type="button" onClick={() => setDeleteTarget(null)} />
          <div className="surface relative z-10 w-full max-w-md p-5 shadow-2xl">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h2 id="delete-customer-title" className="text-lg font-black">Borrar cliente</h2>
                <p className="mt-2 text-sm leading-6 text-muted">Vas a ocultar {deleteTarget.fullName || "este cliente"} de la ficha de clientes. Sus turnos, solicitudes y pagos quedan conservados.</p>
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
