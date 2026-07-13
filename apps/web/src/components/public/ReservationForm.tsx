"use client";

import { CalendarCheck, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { PublicIntakeForm, PublicService, PublicSlot } from "@/lib/operations/booking.types";

type ReservationFormProps = {
  services: PublicService[];
  slotsByService: Record<string, PublicSlot[]>;
  intakeFormsByService: Record<string, PublicIntakeForm[]>;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

type IntakeResponseValue = string | number | boolean | string[];

function collectIntakeResponses(formData: FormData, forms: PublicIntakeForm[]) {
  const responses: Record<string, IntakeResponseValue> = {};

  for (const form of forms) {
    for (const field of form.fields) {
      const key = `intake:${field.fieldKey}`;
      if (field.fieldType === "multi_select") {
        responses[field.fieldKey] = formData.getAll(key).map((value) => String(value));
        continue;
      }

      if (field.fieldType === "boolean" || field.fieldType === "consent") {
        responses[field.fieldKey] = formData.get(key) === "true";
        continue;
      }

      if (field.fieldType === "number") {
        const rawValue = String(formData.get(key) ?? "");
        responses[field.fieldKey] = rawValue ? Number(rawValue) : "";
        continue;
      }

      responses[field.fieldKey] = String(formData.get(key) ?? "");
    }
  }

  return responses;
}

export function ReservationForm({ services, slotsByService, intakeFormsByService }: ReservationFormProps) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [startsAt, setStartsAt] = useState(slotsByService[services[0]?.id ?? ""]?.[0]?.startsAt ?? "");
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const activeService = useMemo(() => services.find((service) => service.id === serviceId), [serviceId, services]);
  const canReserveAutomatically = activeService?.schedulingPolicy === "scheduled";
  const activeIntakeForms = intakeFormsByService[serviceId] ?? [];
  const slots = slotsByService[serviceId] ?? [];

  function handleServiceChange(nextServiceId: string) {
    setServiceId(nextServiceId);
    setStartsAt(slotsByService[nextServiceId]?.[0]?.startsAt ?? "");
  }

  async function submitReservation(formData: FormData) {
    if (!canReserveAutomatically) {
      setState("error");
      setMessage("Este servicio requiere coordinacion previa. Usa el canal de contacto del negocio.");
      return;
    }

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
        intakeResponses: collectIntakeResponses(formData, activeIntakeForms),
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
        <h2 className="mt-1 text-2xl font-black">Elegí el servicio</h2>
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
          {activeService.bufferBeforeMinutes > 0 ? <p>Llegada sugerida: {activeService.bufferBeforeMinutes} min antes</p> : null}
          <p>Seña: {activeService.depositCents > 0 ? activeService.depositLabel : "Sin seña"}</p>
          {!canReserveAutomatically ? <p className="mt-2 font-semibold text-primary">Este servicio requiere coordinacion previa.</p> : null}
          {activeService.arrivalInstructions ? <p className="mt-2 leading-6">{activeService.arrivalInstructions}</p> : null}
          {activeService.virtualInstructions ? <p className="mt-2 leading-6">{activeService.virtualInstructions}</p> : null}
          {activeService.description ? <p className="mt-2 leading-6">{activeService.description}</p> : null}
        </div>
      ) : null}

      {canReserveAutomatically ? (
        <label className="grid gap-2 text-sm font-semibold">
          Horario
          <select className="input-control" name="startsAt" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} required>
            {slots.length > 0 ? slots.map((slot) => (
              <option key={slot.startsAt} value={slot.startsAt}>{slot.label}</option>
            )) : <option value="">Sin horarios disponibles</option>}
          </select>
        </label>
      ) : (
        <div className="rounded-md border border-slate-200 bg-white/70 p-4 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          El negocio debe coordinar este servicio manualmente antes de confirmar una reserva.
        </div>
      )}

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

      {activeIntakeForms.length > 0 ? (
        <section className="grid gap-4 rounded-md border border-slate-200 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5">
          {activeIntakeForms.map((form) => (
            <div className="grid gap-3" key={form.id}>
              <div>
                <p className="text-sm font-bold text-slate-950 dark:text-white">{form.name}</p>
                {form.description ? <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{form.description}</p> : null}
              </div>

              {form.fields.map((field) => {
                const fieldName = `intake:${field.fieldKey}`;
                const label = `${field.label}${field.required ? " *" : ""}`;

                if (field.fieldType === "long_text") {
                  return (
                    <label className="grid gap-2 text-sm font-semibold" key={field.fieldKey}>
                      {label}
                      <textarea className="input-control min-h-20 resize-y" name={fieldName} required={field.required} maxLength={1000} />
                      {field.helpText ? <span className="text-xs font-normal text-slate-500">{field.helpText}</span> : null}
                    </label>
                  );
                }

                if (field.fieldType === "single_select") {
                  return (
                    <label className="grid gap-2 text-sm font-semibold" key={field.fieldKey}>
                      {label}
                      <select className="input-control" name={fieldName} required={field.required} defaultValue="">
                        <option value="">Seleccionar</option>
                        {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                      {field.helpText ? <span className="text-xs font-normal text-slate-500">{field.helpText}</span> : null}
                    </label>
                  );
                }

                if (field.fieldType === "multi_select") {
                  return (
                    <fieldset className="grid gap-2 text-sm" key={field.fieldKey}>
                      <legend className="font-semibold">{label}</legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {field.options.map((option) => (
                          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/5" key={option.value}>
                            <input type="checkbox" name={fieldName} value={option.value} />
                            {option.label}
                          </label>
                        ))}
                      </div>
                      {field.helpText ? <span className="text-xs text-slate-500">{field.helpText}</span> : null}
                    </fieldset>
                  );
                }

                if (field.fieldType === "boolean" || field.fieldType === "consent") {
                  return (
                    <label className="flex items-start gap-2 text-sm font-semibold" key={field.fieldKey}>
                      <input className="mt-1" type="checkbox" name={fieldName} value="true" required={field.fieldType === "consent" || field.required} />
                      <span>
                        {label}
                        {field.helpText ? <span className="mt-1 block text-xs font-normal text-slate-500">{field.helpText}</span> : null}
                      </span>
                    </label>
                  );
                }

                return (
                  <label className="grid gap-2 text-sm font-semibold" key={field.fieldKey}>
                    {label}
                    <input
                      className="input-control"
                      name={fieldName}
                      type={field.fieldType === "number" ? "number" : field.fieldType === "date" ? "date" : "text"}
                      required={field.required}
                      maxLength={field.fieldType === "short_text" ? 240 : undefined}
                    />
                    {field.helpText ? <span className="text-xs font-normal text-slate-500">{field.helpText}</span> : null}
                  </label>
                );
              })}
            </div>
          ))}
        </section>
      ) : null}

      <button className="primary-action justify-center disabled:cursor-not-allowed disabled:opacity-60" disabled={state === "submitting" || !canReserveAutomatically || !startsAt} type="submit">
        {state === "submitting" ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <CalendarCheck aria-hidden="true" className="h-4 w-4" />}
        {canReserveAutomatically ? "Confirmar reserva" : "Requiere coordinacion"}
      </button>

      {message ? <p className={state === "error" ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-emerald-600"}>{message}</p> : null}
    </form>
  );
}
