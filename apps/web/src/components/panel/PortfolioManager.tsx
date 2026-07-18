"use client";

import { ImageIcon, Instagram, Plus, Save, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { BrandAssetCropper, type BrandAssetCropConfig } from "@/components/panel/BrandAssetCropper";
import type { PanelPortfolioItem } from "@/lib/operations/panel-portfolio";

type DraftPortfolioItem = PanelPortfolioItem & { draftId: string; isNew?: boolean };

const portfolioImageCropConfig: BrandAssetCropConfig = {
  title: "Imagen de portfolio",
  helpText: "Usa una imagen vertical o cuadrada. Se optimiza para galeria publica y carga rapida.",
  outputWidth: 1200,
  outputHeight: 1500,
  outputMimeType: "image/webp",
  fileSuffix: "portfolio",
  outputQuality: 0.84,
  maxOutputBytes: 340 * 1024,
  previewWidth: 128,
  previewHeight: 160,
};

function createDraftId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyPortfolioItem(): DraftPortfolioItem {
  return {
    draftId: createDraftId(),
    id: "",
    title: "",
    description: "",
    category: "",
    imageUrl: "",
    instagramUrl: "",
    active: true,
    sortOrder: 0,
    isNew: true,
  };
}

export function PortfolioManager({ items }: { items: PanelPortfolioItem[] }) {
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [rows, setRows] = useState<DraftPortfolioItem[]>(items.map((item) => ({ ...item, draftId: item.id })));
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageUploadingId, setImageUploadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DraftPortfolioItem | null>(null);
  const [imageCropTarget, setImageCropTarget] = useState<{ row: DraftPortfolioItem; file: File } | null>(null);

  function updateRow(draftId: string, patch: Partial<DraftPortfolioItem>) {
    setRows((current) => current.map((row) => row.draftId === draftId ? { ...row, ...patch } : row));
  }

  async function saveRow(row: DraftPortfolioItem) {
    if (savingId || deletingId || imageUploadingId) return;
    setMessage("");
    setMessageTone("success");

    if (row.title.trim().length < 2) {
      setMessageTone("error");
      setMessage("Escribi un titulo antes de guardar.");
      return;
    }

    if (!row.imageUrl.trim() && !row.instagramUrl.trim()) {
      setMessageTone("error");
      setMessage("Carga una imagen o un enlace de Instagram.");
      return;
    }

    setSavingId(row.draftId);
    const payload = {
      title: row.title,
      description: row.description,
      category: row.category,
      imageUrl: row.imageUrl,
      instagramUrl: row.instagramUrl,
      active: row.active,
      sortOrder: row.sortOrder,
    };

    const response = await fetch(row.isNew ? "/api/panel/portfolio" : `/api/panel/portfolio/${row.id}`, {
      method: row.isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const data = await response?.json().catch(() => null) as { data?: { id?: string }; error?: { message?: string } } | null;

    if (!response?.ok) {
      setSavingId(null);
      setMessageTone("error");
      setMessage(data?.error?.message ?? "No se pudo guardar el item de portfolio.");
      return;
    }

    if (row.isNew && data?.data?.id) {
      updateRow(row.draftId, { id: data.data.id, draftId: data.data.id, isNew: false });
    }
    setSavingId(null);
    setMessage("Portfolio guardado.");
  }

  async function uploadPortfolioImage(row: DraftPortfolioItem, croppedFile: File) {
    if (imageUploadingId) return;
    if (!row.id || row.isNew) {
      setMessageTone("error");
      setMessage("Guarda el item antes de cargar una imagen.");
      return;
    }

    setImageUploadingId(row.draftId);
    setMessage("");
    setMessageTone("success");
    const formData = new FormData();
    formData.set("portfolioItemId", row.id);
    formData.set("file", croppedFile);

    const response = await fetch("/api/panel/portfolio-assets", { method: "POST", body: formData }).catch(() => null);
    const data = await response?.json().catch(() => null) as { data?: { publicUrl?: string }; error?: { message?: string } } | null;

    if (!response?.ok || !data?.data?.publicUrl) {
      setImageUploadingId(null);
      setMessageTone("error");
      setMessage(data?.error?.message ?? "No se pudo subir la imagen del portfolio.");
      return;
    }

    updateRow(row.draftId, { imageUrl: data.data.publicUrl });
    setImageUploadingId(null);
    setImageCropTarget(null);
    setMessage("Imagen de portfolio guardada.");
  }

  async function confirmDeleteRow() {
    if (!deleteTarget || savingId || deletingId || imageUploadingId) return;
    setMessage("");
    setMessageTone("success");

    if (deleteTarget.isNew || !deleteTarget.id) {
      setRows((current) => current.filter((row) => row.draftId !== deleteTarget.draftId));
      setDeleteTarget(null);
      return;
    }

    setDeletingId(deleteTarget.draftId);
    const response = await fetch(`/api/panel/portfolio/${deleteTarget.id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setDeletingId(null);
      setMessageTone("error");
      setMessage("No se pudo quitar el item de portfolio.");
      return;
    }

    setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeletingId(null);
    setMessage("Item quitado.");
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Portfolio</h2>
          <p className="mt-1 text-sm text-muted">Carga trabajos, resultados o publicaciones que se van a ver en la web publica.</p>
        </div>
        <button className="primary-action" type="button" disabled={savingId !== null || deletingId !== null || imageUploadingId !== null} onClick={() => setRows((current) => [...current, emptyPortfolioItem()])}>
          <Plus aria-hidden="true" className="h-4 w-4" />
          Agregar item
        </button>
      </div>

      {rows.map((row) => (
        <article className="surface grid gap-5 p-5" key={row.draftId}>
          <div className="grid gap-4 lg:grid-cols-[170px_minmax(0,1fr)]">
            <div className={`relative grid aspect-[4/5] overflow-hidden rounded-lg border ${row.isNew || imageUploadingId !== null ? "border-dashed border-slate-200 bg-slate-50 opacity-70 dark:border-white/10 dark:bg-white/5" : "border-slate-200 bg-white/70 hover:border-primary dark:border-white/10 dark:bg-white/5"}`}>
              {row.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" className="h-full w-full object-cover" src={row.imageUrl} />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-sm font-semibold text-slate-500 dark:text-slate-300">
                  <ImageIcon aria-hidden="true" className="h-8 w-8" />
                  Imagen de portfolio
                </span>
              )}
              <button
                aria-label={row.isNew ? "Guarda el item antes de cargar imagen" : row.imageUrl ? "Cambiar imagen" : "Cargar imagen"}
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
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
                <label className="grid gap-2 text-sm font-semibold">
                  Titulo
                  <input className="input-control" value={row.title} onChange={(event) => updateRow(row.draftId, { title: event.target.value })} placeholder="Ej: Trabajo terminado" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Orden
                  <input className="input-control" min={0} type="number" value={row.sortOrder} onChange={(event) => updateRow(row.draftId, { sortOrder: Number(event.target.value) })} />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Categoria
                <input className="input-control" value={row.category} onChange={(event) => updateRow(row.draftId, { category: event.target.value })} placeholder="Ej: Uñas, Tarot, Tratamiento" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Descripcion
                <textarea className="input-control min-h-24 resize-y" value={row.description} onChange={(event) => updateRow(row.draftId, { description: event.target.value })} placeholder="Texto breve opcional para contextualizar la imagen" />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Link de Instagram
                <span className="relative">
                  <Instagram aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="input-control pl-9" value={row.instagramUrl} onChange={(event) => updateRow(row.draftId, { instagramUrl: event.target.value })} placeholder="https://www.instagram.com/p/..." />
                </span>
              </label>
              <label className="inline-flex items-center gap-3 text-sm font-semibold">
                <input checked={row.active} type="checkbox" onChange={(event) => updateRow(row.draftId, { active: event.target.checked })} />
                Visible en la web publica
              </label>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-white/10">
            <button className="secondary-action" type="button" disabled={savingId !== null || deletingId !== null || imageUploadingId !== null} onClick={() => setDeleteTarget(row)}>
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Quitar
            </button>
            <button className="primary-action" type="button" disabled={savingId !== null || deletingId !== null || imageUploadingId !== null} onClick={() => void saveRow(row)}>
              <Save aria-hidden="true" className="h-4 w-4" />
              {savingId === row.draftId ? "Guardando" : "Guardar"}
            </button>
          </div>
        </article>
      ))}

      {rows.length === 0 ? <div className="surface p-6 text-sm font-semibold text-muted">Todavia no hay items de portfolio.</div> : null}
      {message ? <p className={`text-sm font-semibold ${messageTone === "error" ? "text-red-600 dark:text-red-300" : "text-primary"}`}>{message}</p> : null}

      {deleteTarget ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="surface w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-lg font-black">Quitar item</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Esta accion quita el item del portfolio publico.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button className="secondary-action" type="button" onClick={() => setDeleteTarget(null)}>Cancelar</button>
              <button className="primary-action" type="button" onClick={() => void confirmDeleteRow()}>{deletingId ? "Quitando" : "Quitar"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {imageCropTarget ? (
        <BrandAssetCropper
          file={imageCropTarget.file}
          config={portfolioImageCropConfig}
          onCancel={() => setImageCropTarget(null)}
          onConfirm={(croppedFile) => uploadPortfolioImage(imageCropTarget.row, croppedFile)}
        />
      ) : null}
    </div>
  );
}
