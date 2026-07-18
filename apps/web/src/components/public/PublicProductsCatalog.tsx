"use client";

import { Loader2, ShoppingBag, TicketPercent } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { PublicProduct } from "@/lib/operations/booking.types";

type CheckoutResponse = {
  data?: { checkoutUrl?: string | null; status?: string };
  error?: { message?: string };
};

type CouponPreview = {
  code: string;
  description: string | null;
  discountPesos: number;
  finalTotalPesos: number;
};

function formatARS(value: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
}

export function PublicProductsCatalog({ products }: { products: PublicProduct[] }) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [couponPreview, setCouponPreview] = useState<CouponPreview | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0];
  const subtotalPesos = useMemo(() => selectedProduct ? selectedProduct.pricePesos * quantity : 0, [quantity, selectedProduct]);
  const totalPesos = couponPreview ? couponPreview.finalTotalPesos : subtotalPesos;

  useEffect(() => {
    setCouponPreview(null);
    setCouponMessage("");
  }, [selectedProductId, quantity, couponCode]);

  if (products.length === 0 || !selectedProduct) return null;

  async function validateCoupon() {
    const code = couponCode.trim();
    if (!code || couponBusy || !selectedProduct) return;

    setCouponBusy(true);
    setCouponMessage("");
    const params = new URLSearchParams({
      code,
      scope: "products",
      subtotalPesos: String(subtotalPesos),
      quantity: String(quantity),
    });
    const response = await fetch(`/api/coupons/validate?${params.toString()}`, { cache: "no-store" }).catch(() => null);
    const payload = await response?.json().catch(() => null) as { data?: CouponPreview; error?: { message?: string } } | null;

    setCouponBusy(false);
    if (!response?.ok || !payload?.data) {
      setCouponPreview(null);
      setCouponMessage(payload?.error?.message ?? "No se pudo aplicar el cupon.");
      return;
    }

    setCouponPreview({
      code: payload.data.code,
      description: payload.data.description,
      discountPesos: payload.data.discountPesos,
      finalTotalPesos: payload.data.finalTotalPesos,
    });
  }

  async function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedProduct || busy) return;
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");

    const response = await fetch("/api/products/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: selectedProduct.id,
        quantity,
        couponCode: couponPreview?.code ?? couponCode,
        customer: {
          fullName: String(formData.get("fullName") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          email: String(formData.get("email") ?? ""),
          notes: String(formData.get("notes") ?? ""),
        },
      }),
    }).catch(() => null);
    const data = await response?.json().catch(() => null) as CheckoutResponse | null;

    if (!response?.ok) {
      setBusy(false);
      setMessage(data?.error?.message ?? "No se pudo iniciar la compra.");
      return;
    }

    if (data?.data?.checkoutUrl) {
      window.location.href = data.data.checkoutUrl;
      return;
    }

    setBusy(false);
    setMessage(data?.data?.status === "paid" ? "Compra confirmada." : "Compra registrada. El pago no esta configurado todavia.");
  }

  return (
    <section className="surface p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Productos</p>
          <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">Compra y retira en el negocio</h2>
        </div>
        <ShoppingBag aria-hidden="true" className="h-7 w-7 text-primary" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => {
            const selected = product.id === selectedProduct.id;
            return (
              <button className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition hover:border-primary/50 dark:border-white/10 dark:bg-white/5" data-active={selected ? "true" : "false"} key={product.id} onClick={() => setSelectedProductId(product.id)} type="button">
                <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-white/5">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" src={product.imageUrl} />
                  ) : (
                    <div className="grid h-full place-items-center text-slate-400">
                      <ShoppingBag aria-hidden="true" className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="grid gap-2 p-4">
                  {product.category ? <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{product.category}</p> : null}
                  <h3 className="text-lg font-black leading-tight">{product.name}</h3>
                  {product.description ? <p className="line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{product.description}</p> : null}
                  <p className="text-lg font-black">{product.priceLabel}</p>
                </div>
              </button>
            );
          })}
        </div>

        <form className="grid content-start gap-4 rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5" onSubmit={(event) => void submitOrder(event)}>
          <div>
            <p className="text-sm font-bold text-primary">Producto seleccionado</p>
            <h3 className="mt-1 text-xl font-black">{selectedProduct.name}</h3>
            <p className="mt-1 text-sm text-muted">Precio unitario: {selectedProduct.priceLabel}</p>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Cantidad
            <input className="input-control" min={1} max={Math.min(selectedProduct.stockQuantity ?? 20, 20)} type="number" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} />
          </label>

          <section className="grid gap-3 rounded-lg border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2 text-sm font-bold">
              <TicketPercent aria-hidden="true" className="h-4 w-4 text-primary" />
              Cupon o descuento
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input className="input-control uppercase" maxLength={40} placeholder="CODIGO" value={couponCode} onChange={(event) => setCouponCode(event.target.value)} />
              <button className="secondary-action justify-center" disabled={couponBusy || !couponCode.trim()} type="button" onClick={() => void validateCoupon()}>
                {couponBusy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
                Aplicar
              </button>
            </div>
            {couponPreview ? <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{couponPreview.code} aplicado: -{formatARS(couponPreview.discountPesos)}</p> : null}
            {couponMessage ? <p className="text-sm font-semibold text-red-600 dark:text-red-300">{couponMessage}</p> : null}
          </section>

          <div className="grid gap-2 rounded-lg bg-slate-950/[0.03] p-3 text-sm dark:bg-white/5">
            <div className="flex items-center justify-between gap-3"><span>Subtotal</span><strong>{formatARS(subtotalPesos)}</strong></div>
            {couponPreview ? <div className="flex items-center justify-between gap-3 text-emerald-700 dark:text-emerald-300"><span>Descuento</span><strong>-{formatARS(couponPreview.discountPesos)}</strong></div> : null}
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2 text-base dark:border-white/10"><span>Total</span><strong>{formatARS(totalPesos)}</strong></div>
          </div>

          <label className="grid gap-2 text-sm font-semibold">
            Nombre y apellido
            <input className="input-control" name="fullName" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            WhatsApp
            <input className="input-control" name="phone" required />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Email
            <input className="input-control" name="email" type="email" />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Nota
            <textarea className="input-control min-h-20 resize-y" name="notes" />
          </label>
          <button className="primary-action w-full justify-center" disabled={busy} type="submit">
            <ShoppingBag aria-hidden="true" className="h-4 w-4" />
            {busy ? "Procesando" : totalPesos > 0 ? "Comprar" : "Confirmar compra"}
          </button>
          {message ? <p className={`text-sm font-semibold ${message.includes("confirmada") ? "text-emerald-700 dark:text-emerald-300" : "text-red-600 dark:text-red-300"}`}>{message}</p> : null}
        </form>
      </div>
    </section>
  );
}
