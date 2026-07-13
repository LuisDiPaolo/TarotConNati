"use client";

import { CalendarCheck, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { PublicService, PublicSlot } from "@/lib/operations/booking.types";

type ReservationFormProps = {
  services: PublicService[];
  slotsByService: Record<string, PublicSlot[]>;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

export function ReservationForm({ services, slotsByService }: ReservationFormProps) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [startsAt, setStartsAt] = useState(slotsByService[services[0]?.id ?? ""]?.[0]?.startsAt ?? "");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const activeService = useMemo(() => services.find((service) => service.id === serviceId), [serviceId, services]);
  const slots = slotsByService[serviceId] ?? [];

  function handleServiceChange(nextServiceId: string) {
    setServiceId(nextServiceId);
    setStartsAt(slotsByService[nextServiceId]?.[0]?.startsAt ?? "");
  }

  async function submitReservation(formData: FormData) {
    setState("submitting");
    setMessage("");

    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId,
        startsAt,
        customer: {
          fullName: String(formData.get("fullName") ?? ""),
          phone: String(formData.get("phone") ?? ""),
          email: String(formData.get("email") ?? ""),
          notes: String(formData.get("notes") ?? ""),
        },
      }),
    });

    const payload = await response.json().catch(() => null) as { checkoutUrl?: string; error?: { message?: string } } | null;
    if (!response.ok) {
      setState("error");
      setMessage(payload?.error?.message ?? "No se pudo crear la reserva.");
      return;
    }

    if (payload?.checkoutUrl) {
      window.location.href = payload.checkoutUrl;
      return;
    }

    setState("success");
    setMessage("Reserva creada. El negocio ya puede verla en el panel.");
  }

  return (
    <form action={submitReservation} className="surface grid gap-5 p-5 sm:p-6">
      <div>
        <p className="text-sm font-semibold text-primary">Reservar turno</p>
        <h2 className="mt-1 text-2xl font-black">Elegí servicio y horario</h2>
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Servicio
        <select
          className="input-control"
          name="serviceId"
          value={serviceId}
          onChange={(event) => handleServiceChange(event.target.value)}
          required
        >
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - {service.priceLabel}
            </option>
          ))}
        </select>
      </label>

      {activeService ? (
        <div className="rounded-md border border-slate-200 bg-white/70 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <p className="font-bold text-slate-950 dark:text-white">{activeService.category}</p>
          <p className="mt-1">Duracion: {activeService.durationMinutes} min</p>
          <p>Seña: {activeService.depositCents > 0 ? activeService.depositLabel : "Sin seña"}</p>
          {activeService.description ? <p className="mt-2 leading-6">{activeService.description}</p> : null}
        </div>
      ) : null}

      <label className="grid gap-2 text-sm font-semibold">
        Horario
        <select className="input-control" name="startsAt" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required>
          {slots.length > 0 ? slots.map((slot) => (
            <option key={slot.startsAt} value={slot.startsAt}>{slot.label}</option>
          )) : <option value="">Sin horarios disponibles</option>}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Nombre
          <input className="input-control" name="fullName" autoComplete="name" required minLength={2} maxLength={120} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Telefono
          <input className="input-control" name="phone" autoComplete="tel" required minLength={6} maxLength={40} />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Email
        <input className="input-control" name="email" autoComplete="email" type="email" maxLength={160} />
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        Nota
        <textarea className="input-control min-h-24 resize-y" name="notes" maxLength={500} />
      </label>

      <button className="primary-action justify-center disabled:cursor-not-allowed disabled:opacity-60" disabled={state === "submitting" || !startsAt} type="submit">
        {state === "submitting" ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <CalendarCheck aria-hidden="true" className="h-4 w-4" />}
        Confirmar reserva
      </button>

      {message ? <p className={state === "error" ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-emerald-600"}>{message}</p> : null}
    </form>
  );
}
