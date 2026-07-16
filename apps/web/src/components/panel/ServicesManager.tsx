"use client";

import { AlertTriangle, ImageIcon, Plus, Save, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { BrandAssetCropper, type BrandAssetCropConfig } from "@/components/panel/BrandAssetCropper";
import type { PanelServiceSettings } from "@/lib/operations/panel-settings.types";

type DraftService = PanelServiceSettings & { draftId: string; isNew?: boolean };

const modalityLabels: Record<PanelServiceSettings["serviceModality"], string> = {
  in_person: "Presencial",
  virtual_scheduled: "Online con turno",
  virtual_on_demand: "Online sin horario fijo",
  contact_request: "Consulta para coordinar",
};

const policyLabels: Record<PanelServiceSettings["schedulingPolicy"], string> = {
  scheduled: "El cliente elige horario",
  day_request: "El cliente pide dia o franja",
  manual_coordination: "Lo coordinas manualmente",
  no_calendar_block: "No ocupa agenda",
};

const serviceImageCropConfig: BrandAssetCropConfig = {
  title: "Imagen del servicio",
  helpText: "Usa una foto cuadrada. La app la ajusta para que cargue rapido en la pagina publica.",
  outputWidth: 900,
  outputHeight: 900,
  outputMimeType: "image/webp",
  fileSuffix: "service",
  outputQuality: 0.86,
  maxOutputBytes: 260 * 1024,
  previewWidth: 160,
  previewHeight: 160,
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
    imageUrl: "",
    serviceModality: "in_person",
    schedulingPolicy: "scheduled",
    durationMinutes: 60,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    blocksCalendar: true,
    arrivalInstructions: "",
    virtualInstructions: "",
    requiresManualConfirmation: false,
    pricePesos: 0,
    depositPesos: 0,
    paymentMode: "deposit",
    active: true,
    sortOrder: 0,
    isNew: true,
  };
}

export function ServicesManager({ services }: { services: PanelServiceSettings[] }) {
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [rows, setRows] = useState<DraftService[]>(services.map((service) => ({ ...service, draftId: service.id })));
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageUploadingId, setImageUploadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DraftService | null>(null);
  const [imageCropTarget, setImageCropTarget] = useState<{ row: DraftService; file: File } | null>(null);

  function updateRow(draftId: string, patch: Partial<DraftService>) {
    const normalizedPatch = normalizeSchedulingPatch(patch);
    setRows((current) => current.map((row) => row.draftId === draftId ? { ...row, ...normalizedPatch } : row));
  }

  async function saveRow(row: DraftService) {
    if (savingId || deletingId || imageUploadingId) return;
    setMessage("");
    setMessageTone("success");

    if (row.name.trim().length < 2) {
      setMessageTone("error");
      setMessage("Escribi el nombre del servicio antes de guardar.");
      return;
    }

    if (!Number.isFinite(row.durationMinutes) || row.durationMinutes < 5) {
      setMessageTone("error");
      setMessage("La duracion tiene que ser de al menos 5 minutos.");
      return;
    }

    if (row.pricePesos < 0 || row.depositPesos < 0) {
      setMessageTone("error");
      setMessage("Los importes no pueden ser negativos.");
      return;
    }

    setSavingId(row.draftId);

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
      pricePesos: row.pricePesos,
      depositPesos: row.depositPesos,
      paymentMode: row.paymentMode,
      active: row.active,
      sortOrder: row.sortOrder,
    };
    const response = await fetch(row.isNew ? "/api/panel/services" : `/api/panel/services/${row.id}`, {
      method: row.isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const data = await response?.json().catch(() => null) as { id?: string } | null;

    if (!response?.ok) {
      setSavingId(null);
      setMessageTone("error");
      setMessage("No se pudo guardar el servicio. Revisa los datos e intenta de nuevo.");
      return;
    }

    if (row.isNew && data?.id) {
      updateRow(row.draftId, { id: data.id, draftId: data.id, isNew: false });
    }
    setSavingId(null);
    setMessage("Servicio guardado.");
  }

  async function uploadServiceImage(row: DraftService, croppedFile: File) {
    if (imageUploadingId) return;
    if (!row.id || row.isNew) {
      setMessageTone("error");
      setMessage("Guarda el servicio antes de cargar una imagen.");
      return;
    }

    setImageUploadingId(row.draftId);
    setMessage("");
    setMessageTone("success");
    const formData = new FormData();
    formData.set("serviceId", row.id);
    formData.set("file", croppedFile);

    const response = await fetch("/api/panel/service-assets", { method: "POST", body: formData }).catch(() => null);
    const data = await response?.json().catch(() => null) as { publicUrl?: string; error?: { message?: string } } | null;

    if (!response?.ok || !data?.publicUrl) {
      setImageUploadingId(null);
      setMessageTone("error");
      setMessage(data?.error?.message ?? "No se pudo subir la imagen del servicio.");
      return;
    }

    updateRow(row.draftId, { imageUrl: data.publicUrl });
    setImageUploadingId(null);
    setImageCropTarget(null);
    setMessage("Imagen del servicio guardada.");
  }

  async function confirmDeleteRow() {
    if (!deleteTarget || savingId || deletingId || imageUploadingId) return;
    setMessage("");
    setMessageTone("success");
    if (deleteTarget.isNew || !deleteTarget.id) {
      setRows((current) => current.filter((currentRow) => currentRow.draftId !== deleteTarget.draftId));
      setDeleteTarget(null);
      return;
    }

    setDeletingId(deleteTarget.draftId);
    const response = await fetch(`/api/panel/services/${deleteTarget.id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setDeletingId(null);
      setMessageTone("error");
      setMessage("No se pudo quitar el servicio.");
      return;
    }

    setRows((current) => current.filter((currentRow) => currentRow.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeletingId(null);
    setMessage("Servicio quitado.");
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Servicios</h2>
          <p className="mt-1 text-sm text-muted">Carga lo que el cliente puede reservar o solicitar desde la pagina publica.</p>
        </div>
        <button className="primary-action" type="button" disabled={savingId !== null || deletingId !== null || imageUploadingId !== null} onClick={() => setRows((current) => [...current, emptyService()])}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Agregar servicio
        </button>
      </div>

      {rows.map((row) => (
        <article className="surface grid gap-5 p-5" key={row.draftId}>
          <div className="grid gap-4 lg:grid-cols-[190px_minmax(0,1fr)]">
            <div className={`relative grid aspect-square overflow-hidden rounded-lg border ${row.isNew || imageUploadingId !== null ? "border-dashed border-slate-200 bg-slate-50 opacity-70 dark:border-white/10 dark:bg-white/5" : "border-slate-200 bg-white/70 hover:border-primary dark:border-white/10 dark:bg-white/5"}`}>
              {row.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="h-full w-full object-cover" src={row.imageUrl} />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-sm font-semibold text-slate-500 dark:text-slate-300">
                  <ImageIcon aria-hidden="true" className="h-8 w-8" />
                  Imagen del servicio
                </span>
              )}
              <button
                aria-label={row.isNew ? "Guarda el servicio antes de cargar imagen" : row.imageUrl ? "Cambiar imagen del servicio" : "Cargar imagen del servicio"}
                className="absolute inset-0 flex items-end justify-center p-3 text-left"
                disabled={row.isNew || !row.id || imageUploadingId !== null}
                onClick={() => fileInputRefs.current.get(row.draftId)?.click()}
                type="button"
              >
                <span className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950/80 px-3 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-primary">
                <Upload aria-hidden="true" className="h-3.5 w-3.5" />
                {imageUploadingId === row.draftId ? "Subiendo" : row.isNew ? "Guarda primero" : row.imageUrl ? "Cambiar imagen" : "Cargar imagen"}
                </span>
              </button>
              <input
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={row.isNew || !row.id || imageUploadingId !== null}
                ref={(input) => {
                  if (input) fileInputRefs.current.set(row.draftId, input);
                  else fileInputRefs.current.delete(row.draftId);
                }}
                type="file"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = "";
                  if (file && imageUploadingId === null) setImageCropTarget({ row, file });
                }}
              />
            </div>

            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="grid gap-2 text-sm font-semibold md:col-span-2">
                  Nombre del servicio
                  <input className="input-control" value={row.name} onChange={(event) => updateRow(row.draftId, { name: event.target.value })} placeholder="Ej: Corte y peinado" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Categoria
                  <input className="input-control" value={row.category} onChange={(event) => updateRow(row.draftId, { category: event.target.value })} placeholder="Ej: Peluqueria" />
                </label>
              </div>

              <textarea className="input-control min-h-24 resize-y" value={row.description} onChange={(event) => updateRow(row.draftId, { description: event.target.value })} placeholder="Descripcion breve que va a ver el cliente antes de reservar" />
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <label className="grid gap-2 text-sm font-semibold">
              Tipo de atencion
              <select className="input-control" value={row.serviceModality} onChange={(event) => updateRow(row.draftId, { serviceModality: event.target.value as DraftService["serviceModality"] })}>
                {Object.entries(modalityLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Como se reserva
              <select className="input-control" value={row.schedulingPolicy} onChange={(event) => updateRow(row.draftId, { schedulingPolicy: event.target.value as DraftService["schedulingPolicy"] })}>
                {Object.entries(policyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label className="flex items-end gap-2 text-sm font-semibold">
              <input type="checkbox" checked={row.requiresManualConfirmation} onChange={(event) => updateRow(row.draftId, { requiresManualConfirmation: event.target.checked })} />
              Revisar antes de confirmar
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <label className="grid gap-2 text-sm font-semibold">
              Duracion
              <input className="input-control" type="number" min={5} max={480} value={row.durationMinutes} onChange={(event) => updateRow(row.draftId, { durationMinutes: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Preparacion antes
              <input className="input-control" type="number" min={0} max={480} value={row.bufferBeforeMinutes} onChange={(event) => updateRow(row.draftId, { bufferBeforeMinutes: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Tiempo despues
              <input className="input-control" type="number" min={0} max={480} value={row.bufferAfterMinutes} onChange={(event) => updateRow(row.draftId, { bufferAfterMinutes: Number(event.target.value) })} />
            </label>
            <label className="flex items-end gap-2 text-sm font-semibold">
              <input type="checkbox" checked={row.blocksCalendar} disabled={row.schedulingPolicy !== "scheduled"} onChange={(event) => updateRow(row.draftId, { blocksCalendar: event.target.checked })} />
              Reservar horario en agenda
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <textarea className="input-control min-h-20 resize-y" value={row.arrivalInstructions} onChange={(event) => updateRow(row.draftId, { arrivalInstructions: event.target.value })} placeholder="Instrucciones presenciales o llegada anticipada" />
            <textarea className="input-control min-h-20 resize-y" value={row.virtualInstructions} onChange={(event) => updateRow(row.draftId, { virtualInstructions: event.target.value })} placeholder="Instrucciones virtuales o de coordinacion" />
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <label className="grid gap-2 text-sm font-semibold">
              Precio en pesos
              <input className="input-control" type="number" min={0} step={1} value={row.pricePesos} onChange={(event) => updateRow(row.draftId, { pricePesos: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Reserva en pesos
              <input className="input-control" type="number" min={0} step={1} value={row.depositPesos} onChange={(event) => updateRow(row.draftId, { depositPesos: Number(event.target.value) })} />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Pago al reservar
              <select className="input-control" value={row.paymentMode} onChange={(event) => updateRow(row.draftId, { paymentMode: event.target.value as DraftService["paymentMode"] })}>
                <option value="deposit">Reserva parcial</option>
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
            <button className="icon-action danger-icon-action" type="button" disabled={savingId !== null || deletingId !== null || imageUploadingId !== null} onClick={() => setDeleteTarget(row)} title="Quitar servicio">
              <Trash2 aria-hidden="true" className="h-4 w-4" />
            </button>
            <button className="primary-action disabled:opacity-60" type="button" disabled={savingId !== null || deletingId !== null || imageUploadingId !== null} onClick={() => saveRow(row)}>
              <Save aria-hidden="true" className="h-4 w-4" />
              {savingId === row.draftId ? "Guardando" : "Guardar"}
            </button>
          </div>
        </article>
      ))}

      {message ? <p className={messageTone === "error" ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-emerald-600"}>{message}</p> : null}

      {imageCropTarget ? (
        <BrandAssetCropper
          config={serviceImageCropConfig}
          file={imageCropTarget.file}
          onCancel={() => {
            if (imageUploadingId === null) setImageCropTarget(null);
          }}
          onConfirm={(croppedFile) => uploadServiceImage(imageCropTarget.row, croppedFile)}
        />
      ) : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[180] flex items-end justify-center p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-service-title">
          <button aria-label="Cancelar borrado" className="absolute inset-0 cursor-default bg-black/55" disabled={deletingId === deleteTarget.draftId} type="button" onClick={() => setDeleteTarget(null)} />
          <div className="surface relative z-10 w-full max-w-md p-5 shadow-2xl">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
                <AlertTriangle aria-hidden="true" className="h-5 w-5" />
              </div>
              <div>
                <h2 id="delete-service-title" className="text-lg font-black">Quitar servicio</h2>
                <p className="mt-2 text-sm leading-6 text-muted">
                  Vas a quitar {deleteTarget.name || "este servicio"} de la pagina publica. Si ya tenia turnos, se conserva el historial.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button className="secondary-action w-full sm:w-auto" type="button" disabled={deletingId === deleteTarget.draftId} onClick={() => setDeleteTarget(null)}>
                Cancelar
              </button>
              <button className="danger-action w-full sm:w-auto" type="button" disabled={deletingId === deleteTarget.draftId} onClick={confirmDeleteRow}>
                <Trash2 aria-hidden="true" className="h-4 w-4" />
                {deletingId === deleteTarget.draftId ? "Quitando" : "Quitar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
