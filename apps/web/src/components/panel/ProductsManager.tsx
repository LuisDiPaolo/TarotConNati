"use client";

import { ImageIcon, Package, Plus, Save, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { BrandAssetCropper, type BrandAssetCropConfig } from "@/components/panel/BrandAssetCropper";
import type { PanelProduct, PanelProductOrder } from "@/lib/operations/panel-products";
import { formatARS } from "@/shared";

type DraftProduct = PanelProduct & { draftId: string; isNew?: boolean };

const productImageCropConfig: BrandAssetCropConfig = {
  title: "Imagen de producto",
  helpText: "Usa una imagen limpia del producto. Se optimiza para catalogo publico y carga rapida.",
  outputWidth: 1200,
  outputHeight: 1200,
  outputMimeType: "image/webp",
  fileSuffix: "product",
  outputQuality: 0.84,
  maxOutputBytes: 320 * 1024,
  previewWidth: 144,
  previewHeight: 144,
};

function createDraftId() {
  return `new-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyProduct(): DraftProduct {
  return {
    draftId: createDraftId(),
    id: "",
    name: "",
    description: "",
    category: "",
    imageUrl: "",
    pricePesos: 0,
    stockQuantity: null,
    active: false,
    sortOrder: 0,
    isNew: true,
  };
}

function statusLabel(status: PanelProductOrder["status"]) {
  if (status === "paid") return "Pagada";
  if (status === "stock_conflict") return "Stock a revisar";
  if (status === "fulfilled") return "Entregada";
  if (status === "cancelled") return "Cancelada";
  return "Pendiente";
}

export function ProductsManager({ products, orders }: { products: PanelProduct[]; orders: PanelProductOrder[] }) {
  const fileInputRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [rows, setRows] = useState<DraftProduct[]>(products.map((product) => ({ ...product, draftId: product.id })));
  const [orderRows, setOrderRows] = useState(orders);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imageUploadingId, setImageUploadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DraftProduct | null>(null);
  const [imageCropTarget, setImageCropTarget] = useState<{ row: DraftProduct; file: File } | null>(null);

  function updateRow(draftId: string, patch: Partial<DraftProduct>) {
    setRows((current) => current.map((row) => row.draftId === draftId ? { ...row, ...patch } : row));
  }

  async function saveRow(row: DraftProduct) {
    if (savingId || deletingId || imageUploadingId) return;
    setMessage("");
    setMessageTone("success");

    if (row.name.trim().length < 2 || row.pricePesos <= 0) {
      setMessageTone("error");
      setMessage("Completa nombre y precio antes de guardar.");
      return;
    }

    setSavingId(row.draftId);
    const payload = {
      name: row.name,
      description: row.description,
      category: row.category,
      imageUrl: row.imageUrl,
      pricePesos: row.pricePesos,
      stockQuantity: row.stockQuantity,
      active: row.active,
      sortOrder: row.sortOrder,
    };

    const response = await fetch(row.isNew ? "/api/panel/products" : `/api/panel/products/${row.id}`, {
      method: row.isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const data = await response?.json().catch(() => null) as { data?: { id?: string }; error?: { message?: string } } | null;

    if (!response?.ok) {
      setSavingId(null);
      setMessageTone("error");
      setMessage(data?.error?.message ?? "No se pudo guardar el producto.");
      return;
    }

    if (row.isNew && data?.data?.id) {
      updateRow(row.draftId, { id: data.data.id, draftId: data.data.id, isNew: false });
    }
    setSavingId(null);
    setMessage("Producto guardado.");
  }

  async function uploadProductImage(row: DraftProduct, croppedFile: File) {
    if (imageUploadingId) return;
    if (!row.id || row.isNew) {
      setMessageTone("error");
      setMessage("Guarda el producto antes de cargar una imagen.");
      return;
    }

    setImageUploadingId(row.draftId);
    setMessage("");
    setMessageTone("success");
    const formData = new FormData();
    formData.set("productId", row.id);
    formData.set("file", croppedFile);

    const response = await fetch("/api/panel/product-assets", { method: "POST", body: formData }).catch(() => null);
    const data = await response?.json().catch(() => null) as { data?: { publicUrl?: string }; error?: { message?: string } } | null;

    if (!response?.ok || !data?.data?.publicUrl) {
      setImageUploadingId(null);
      setMessageTone("error");
      setMessage(data?.error?.message ?? "No se pudo subir la imagen del producto.");
      return;
    }

    updateRow(row.draftId, { imageUrl: data.data.publicUrl });
    setImageUploadingId(null);
    setImageCropTarget(null);
    setMessage("Imagen de producto guardada.");
  }

  async function updateOrderStatus(orderId: string, status: "paid" | "cancelled" | "fulfilled") {
    if (savingId || deletingId || imageUploadingId) return;
    setMessage("");
    setMessageTone("success");
    const response = await fetch(`/api/panel/product-orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null) as { error?: { message?: string } } | null;

    if (!response?.ok) {
      setMessageTone("error");
      setMessage(data?.error?.message ?? "No se pudo actualizar la compra.");
      return;
    }

    setOrderRows((current) => current.map((order) => order.id === orderId ? { ...order, status } : order));
    setMessage("Compra actualizada.");
  }

  async function confirmDeleteRow() {
    if (!deleteTarget || savingId || deletingId || imageUploadingId) return;
    if (deleteTarget.isNew || !deleteTarget.id) {
      setRows((current) => current.filter((row) => row.draftId !== deleteTarget.draftId));
      setDeleteTarget(null);
      return;
    }

    setDeletingId(deleteTarget.draftId);
    const response = await fetch(`/api/panel/products/${deleteTarget.id}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setDeletingId(null);
      setMessageTone("error");
      setMessage("No se pudo quitar el producto.");
      return;
    }

    setRows((current) => current.filter((row) => row.id !== deleteTarget.id));
    setDeleteTarget(null);
    setDeletingId(null);
    setMessage("Producto quitado.");
  }

  return (
    <div className="grid gap-5">
      <section className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Catalogo</h2>
            <p className="mt-1 text-sm text-muted">Productos con pago total y retiro en el negocio.</p>
          </div>
          <button className="primary-action" type="button" disabled={savingId !== null || deletingId !== null || imageUploadingId !== null} onClick={() => setRows((current) => [...current, emptyProduct()])}>
            <Plus aria-hidden="true" className="h-4 w-4" />
            Agregar producto
          </button>
        </div>

        {rows.map((row) => (
          <article className="surface grid gap-5 p-5" key={row.draftId}>
            <div className="grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)]">
              <div className={`relative grid aspect-square overflow-hidden rounded-lg border ${row.isNew || imageUploadingId !== null ? "border-dashed border-slate-200 bg-slate-50 opacity-70 dark:border-white/10 dark:bg-white/5" : "border-slate-200 bg-white/70 hover:border-primary dark:border-white/10 dark:bg-white/5"}`}>
                {row.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="h-full w-full object-cover" src={row.imageUrl} />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-sm font-semibold text-slate-500 dark:text-slate-300">
                    <ImageIcon aria-hidden="true" className="h-8 w-8" />
                    Imagen de producto
                  </span>
                )}
                <button className="absolute inset-0 flex items-end justify-center p-3" disabled={row.isNew || !row.id || imageUploadingId !== null} onClick={() => fileInputRefs.current.get(row.draftId)?.click()} type="button">
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
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px_160px]">
                  <label className="grid gap-2 text-sm font-semibold">
                    Nombre
                    <input className="input-control" value={row.name} onChange={(event) => updateRow(row.draftId, { name: event.target.value })} placeholder="Ej: Kit de cuidado" />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Precio
                    <input className="input-control" min={1} type="number" value={row.pricePesos} onChange={(event) => updateRow(row.draftId, { pricePesos: Number(event.target.value) })} />
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Stock
                    <input className="input-control" min={0} type="number" value={row.stockQuantity ?? ""} onChange={(event) => updateRow(row.draftId, { stockQuantity: event.target.value === "" ? null : Number(event.target.value) })} placeholder="Sin limite" />
                  </label>
                </div>
                <label className="grid gap-2 text-sm font-semibold">
                  Categoria
                  <input className="input-control" value={row.category} onChange={(event) => updateRow(row.draftId, { category: event.target.value })} placeholder="Ej: Productos" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Descripcion
                  <textarea className="input-control min-h-24 resize-y" value={row.description} onChange={(event) => updateRow(row.draftId, { description: event.target.value })} placeholder="Detalle breve para la web publica" />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-3 text-sm font-semibold">
                    <input checked={row.active} type="checkbox" onChange={(event) => updateRow(row.draftId, { active: event.target.checked })} />
                    Visible en la web publica
                  </label>
                  <label className="grid gap-2 text-sm font-semibold">
                    Orden
                    <input className="input-control w-28" min={0} type="number" value={row.sortOrder} onChange={(event) => updateRow(row.draftId, { sortOrder: Number(event.target.value) })} />
                  </label>
                </div>
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

        {rows.length === 0 ? <div className="surface p-6 text-sm font-semibold text-muted">Todavia no hay productos.</div> : null}
        {message ? <p className={`text-sm font-semibold ${messageTone === "error" ? "text-red-600 dark:text-red-300" : "text-primary"}`}>{message}</p> : null}
      </section>

      <section className="surface p-5">
        <div className="flex items-center gap-3">
          <Package aria-hidden="true" className="h-5 w-5 text-accent" />
          <h2 className="text-xl font-black">Compras</h2>
        </div>
        <div className="mt-4 grid gap-3">
          {orderRows.map((order) => (
            <article className="rounded-lg border border-slate-200 p-4 dark:border-white/10" key={order.id}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-black">{order.customerName}</p>
                  <p className="mt-1 text-sm text-muted">{order.customerPhone}{order.customerEmail ? ` - ${order.customerEmail}` : ""}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-sm font-bold text-primary">{statusLabel(order.status)}</p>
                  <p className="mt-1 text-lg font-black">{formatARS(order.totalPesos)}</p>
                </div>
              </div>
              <div className="mt-3 grid gap-1 text-sm text-muted">
                {order.items.map((item) => <p key={item.id}>{item.quantity} x {item.productName} - {formatARS(item.totalPesos)}</p>)}
                {order.notes ? <p>Nota: {order.notes}</p> : null}
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
                {order.status === "pending_payment" || order.status === "stock_conflict" ? <button className="secondary-action" type="button" onClick={() => void updateOrderStatus(order.id, "paid")}>Marcar pagada</button> : null}
                {order.status !== "fulfilled" && order.status !== "cancelled" ? <button className="primary-action" type="button" onClick={() => void updateOrderStatus(order.id, "fulfilled")}>Marcar entregada</button> : null}
                {order.status !== "cancelled" && order.status !== "fulfilled" ? <button className="secondary-action" type="button" onClick={() => void updateOrderStatus(order.id, "cancelled")}>Cancelar</button> : null}
              </div>
            </article>
          ))}
          {orderRows.length === 0 ? <p className="text-sm font-semibold text-muted">Todavia no hay compras.</p> : null}
        </div>
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="surface w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-lg font-black">Quitar producto</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Esta accion quita el producto del catalogo publico.</p>
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
          config={productImageCropConfig}
          onCancel={() => setImageCropTarget(null)}
          onConfirm={(croppedFile) => uploadProductImage(imageCropTarget.row, croppedFile)}
        />
      ) : null}
    </div>
  );
}
