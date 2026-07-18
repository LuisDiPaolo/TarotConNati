"use client";

import { Gift, Loader2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import type { PublicService } from "@/lib/operations/booking.types";

type GiftCardCheckoutResponse = {
  data?: { checkoutUrl?: string | null };
  error?: { message?: string };
};

export function PublicGiftCards({ services }: { services: PublicService[] }) {
  const eligibleServices = useMemo(() => services.filter((service) => service.pricePesos > 0), [services]);
  const [selectedServiceId, setSelectedServiceId] = useState(eligibleServices[0]?.id ?? "");
  const [sameRecipient, setSameRecipient] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selectedService = eligibleServices.find((service) => service.id === selectedServiceId) ?? eligibleServices[0];

  if (!selectedService) return null;

  async function submitGiftCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !selectedService) return;

    const formData = new FormData(event.currentTarget);
    const purchaser = {
      fullName: String(formData.get("purchaserFullName") ?? ""),
      phone: String(formData.get("purchaserPhone") ?? ""),
      email: String(formData.get("purchaserEmail") ?? ""),
    };
    const recipient = sameRecipient ? purchaser : {
      fullName: String(formData.get("recipientFullName") ?? ""),
      phone: String(formData.get("recipientPhone") ?? ""),
      email: String(formData.get("recipientEmail") ?? ""),
    };

    setBusy(true);
    setMessage("");
    const response = await fetch("/api/gift-cards/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: selectedService.id,
        purchaser,
        recipient,
        message: String(formData.get("giftMessage") ?? ""),
      }),
    }).catch(() => null);
    const payload = await response?.json().catch(() => null) as GiftCardCheckoutResponse | null;

    if (!response?.ok) {
      setBusy(false);
      setMessage(payload?.error?.message ?? "No se pudo iniciar la compra de la gift card.");
      return;
    }

    if (payload?.data?.checkoutUrl) {
      window.location.href = payload.data.checkoutUrl;
      return;
    }

    setBusy(false);
    setMessage("Gift card registrada. Falta completar el pago online.");
  }

  return (
    <section className="surface p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Gift cards</p>
          <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">Regala un servicio</h2>
        </div>
        <Gift aria-hidden="true" className="h-7 w-7 text-primary" />
      </div>

      <form className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(320px,1fr)]" onSubmit={(event) => void submitGiftCard(event)}>
        <div className="grid content-start gap-4 rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
          <label className="grid gap-2 text-sm font-semibold">
            Servicio
            <select className="input-control" value={selectedServiceId} onChange={(event) => setSelectedServiceId(event.target.value)}>
              {eligibleServices.map((service) => <option key={service.id} value={service.id}>{service.name} - {service.priceLabel}</option>)}
            </select>
          </label>
          <div className="rounded-lg bg-primary/10 p-4 text-sm leading-6 text-slate-700 dark:text-slate-200">
            <p className="font-black text-slate-950 dark:text-white">{selectedService.name}</p>
            <p className="mt-1">Valor: {selectedService.priceLabel}</p>
            <p className="mt-1">La gift card queda activa cuando el pago se acredita.</p>
          </div>
        </div>

        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">
              Comprador
              <input className="input-control" name="purchaserFullName" required minLength={2} maxLength={120} autoComplete="name" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              WhatsApp comprador
              <input className="input-control" name="purchaserPhone" required minLength={6} maxLength={40} autoComplete="tel" />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Email comprador
            <input className="input-control" name="purchaserEmail" type="email" maxLength={160} autoComplete="email" />
          </label>

          <label className="inline-flex items-center gap-3 text-sm font-semibold">
            <input checked={sameRecipient} type="checkbox" onChange={(event) => setSameRecipient(event.target.checked)} />
            Es para mi
          </label>

          {!sameRecipient ? (
            <div className="grid gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  Destinatario
                  <input className="input-control" name="recipientFullName" required minLength={2} maxLength={120} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  WhatsApp destinatario
                  <input className="input-control" name="recipientPhone" minLength={6} maxLength={40} />
                </label>
              </div>
              <label className="grid gap-2 text-sm font-semibold">
                Email destinatario
                <input className="input-control" name="recipientEmail" type="email" maxLength={160} />
              </label>
            </div>
          ) : null}

          <label className="grid gap-2 text-sm font-semibold">
            Mensaje
            <textarea className="input-control min-h-20 resize-y" name="giftMessage" maxLength={500} />
          </label>

          <button className="primary-action w-full justify-center" disabled={busy} type="submit">
            {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Gift aria-hidden="true" className="h-4 w-4" />}
            {busy ? "Abriendo pago" : "Comprar gift card"}
          </button>
          {message ? <p className="text-sm font-semibold text-red-600 dark:text-red-300">{message}</p> : null}
        </div>
      </form>
    </section>
  );
}
