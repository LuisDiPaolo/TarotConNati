"use client";

import { CalendarCheck, ImageIcon, Loader2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { PublicIntakeForm, PublicService, PublicSlot } from "@/lib/operations/booking.types";

type ReservationFormProps = {
  services: PublicService[];
  slotsByService: Record<string, PublicSlot[]>;
  intakeFormsByService: Record<string, PublicIntakeForm[]>;
  serviceImageFallbackUrl: string;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

type IntakeResponseValue = string | number | boolean | string[];

type StoredHistoryItem = {
  id: string;
  serviceName: string;
  serviceCategory: string;
  startsAt: string;
  createdAt: string;
  status: "active" | "pending" | "completed";
  kind: "appointment" | "request";
  message: string;
};

const publicHistoryStorageKey = "turnos-public-history";

function getPaymentRequirementLabel(service: PublicService) {
  if (service.paymentMode === "full") return `Pago total por adelantado: ${service.priceLabel}`;
  if (service.paymentMode === "deposit" && service.depositPesos > 0) return `Sena para reservar: ${service.depositLabel}`;
  return "Sin cobro online al reservar";
}

function persistPublicHistoryItem(item: StoredHistoryItem) {
  try {
    const rawValue = window.localStorage.getItem(publicHistoryStorageKey);
    const currentItems = rawValue ? JSON.parse(rawValue) : [];
    const nextItems = Array.isArray(currentItems) ? [item, ...currentItems].slice(0, 30) : [item];
    window.localStorage.setItem(publicHistoryStorageKey, JSON.stringify(nextItems));
    window.dispatchEvent(new Event("turnos-public-history-updated"));
  } catch {
    // Local history is best-effort and must never block the reservation flow.
  }
}

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

function ServiceArtwork({ imageUrl, fallbackUrl, compact = false }: { imageUrl: string; fallbackUrl: string; compact?: boolean }) {
  const frameClassName = `service-artwork ${compact ? "service-artwork-compact" : ""}`;

  if (imageUrl) {
    return (
      <div className={`${frameClassName} bg-slate-100 dark:bg-zinc-900`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" className="h-full w-full object-cover" src={imageUrl} />
      </div>
    );
  }

  if (fallbackUrl) {
    return (
      <div className={`${frameClassName} bg-[rgb(var(--brand-primary))]/10 dark:bg-white/5`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/55 via-transparent to-black/10 dark:from-white/10 dark:to-black/30" />
        <div className="relative flex h-full w-full items-center justify-center p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" className="h-full max-h-[66%] w-full max-w-[66%] object-contain drop-shadow-sm" src={fallbackUrl} />
        </div>
      </div>
    );
  }

  return (
    <div className={`${frameClassName} flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 dark:from-zinc-900 dark:to-zinc-800 dark:text-zinc-500`}>
      <ImageIcon aria-hidden="true" className={compact ? "h-9 w-9" : "h-11 w-11"} />
    </div>
  );
}

export function ReservationForm({ services, slotsByService, intakeFormsByService, serviceImageFallbackUrl }: ReservationFormProps) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [startsAt, setStartsAt] = useState(slotsByService[services[0]?.id ?? ""]?.[0]?.startsAt ?? "");
  const [panelOpen, setPanelOpen] = useState(false);
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  const activeService = useMemo(() => services.find((service) => service.id === serviceId), [serviceId, services]);
  const canReserveAutomatically = activeService?.schedulingPolicy === "scheduled";
  const activeIntakeForms = intakeFormsByService[serviceId] ?? [];
  const slots = slotsByService[serviceId] ?? [];

  useEffect(() => {
    if (!panelOpen) return;

    const scrollY = window.scrollY;
    const previousBodyStyles = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setPanelOpen(false);
    }

    document.documentElement.classList.add("booking-panel-open");
    document.body.classList.add("booking-panel-open");
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.documentElement.classList.remove("booking-panel-open");
      document.body.classList.remove("booking-panel-open");
      document.body.style.overflow = previousBodyStyles.overflow;
      document.body.style.position = previousBodyStyles.position;
      document.body.style.top = previousBodyStyles.top;
      document.body.style.width = previousBodyStyles.width;
      window.scrollTo(0, scrollY);
    };
  }, [panelOpen]);

  function openServicePanel(nextServiceId: string) {
    setServiceId(nextServiceId);
    setStartsAt(slotsByService[nextServiceId]?.[0]?.startsAt ?? "");
    setState("idle");
    setMessage("");
    setPanelOpen(true);
  }

  async function submitReservation(formData: FormData) {
    setState("submitting");
    setMessage("");

    const customer = {
      fullName: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };
    const intakeResponses = collectIntakeResponses(formData, activeIntakeForms);
    const response = await fetch(canReserveAutomatically ? "/api/appointments" : "/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(canReserveAutomatically ? {
        serviceId,
        startsAt,
        customer,
        intakeResponses,
      } : {
        serviceId,
        customer,
        preferredDate: String(formData.get("preferredDate") ?? ""),
        preferredWindow: String(formData.get("preferredWindow") ?? ""),
        contactChannel: "whatsapp",
        intakeResponses,
      }),
    });

    const payload = await response.json().catch(() => null) as { checkoutUrl?: string; error?: { message?: string } } | null;
    if (!response.ok) {
      setState("error");
      setMessage(payload?.error?.message ?? "No se pudo crear la reserva.");
      return;
    }

    const successMessage = canReserveAutomatically ? "Reserva creada. El negocio ya puede verla en el panel." : "Solicitud enviada. El negocio la va a revisar y responder por WhatsApp.";
    if (activeService) {
      persistPublicHistoryItem({
        id: `${Date.now()}-${activeService.id}`,
        serviceName: activeService.name,
        serviceCategory: activeService.category,
        startsAt: canReserveAutomatically ? startsAt : "",
        createdAt: new Date().toISOString(),
        status: canReserveAutomatically ? "active" : "pending",
        kind: canReserveAutomatically ? "appointment" : "request",
        message: successMessage,
      });
    }

    if (payload?.checkoutUrl) {
      window.location.href = payload.checkoutUrl;
      return;
    }

    setState("success");
    setMessage(successMessage);
  }

  return (
    <section className="surface grid gap-5 p-5 sm:p-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">Reservar turno</p>
          <h2 className="mt-1 text-2xl font-black">Elegí el servicio</h2>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {services.length} opciones
        </span>
      </div>

      <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => {
          const selected = service.id === serviceId && panelOpen;
          const summary = service.description || service.category || "Servicio disponible para reservar online.";
          const paymentLabel = service.paymentMode === "none" ? "Sin pago online" : service.paymentMode === "full" ? "Pago online" : "Sena online";

          return (
            <button
              aria-pressed={selected}
              className={`service-card group flex h-full min-h-[360px] flex-col overflow-hidden rounded-lg border text-left transition hover:-translate-y-0.5 hover:shadow-xl ${selected ? "border-primary bg-white/[0.92] shadow-lg ring-2 ring-primary/25 dark:bg-zinc-950/90" : "border-slate-200 bg-white/[0.82] shadow-sm dark:border-white/10 dark:bg-zinc-950/60"}`}
              key={service.id}
              onClick={() => openServicePanel(service.id)}
              type="button"
            >
              <div className="shrink-0 overflow-hidden border-b border-slate-200/80 dark:border-white/10 [&_img]:transition [&_img]:duration-300 group-hover:[&_img]:scale-[1.03]">
                <ServiceArtwork imageUrl={service.imageUrl} fallbackUrl={serviceImageFallbackUrl} />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                <div className="min-h-[4.5rem] min-w-0">
                  <h3 className="service-card-title text-base font-black leading-snug text-slate-950 dark:text-white">{service.name}</h3>
                  <p className="mt-1 truncate text-xs font-semibold uppercase tracking-[0.12em] text-primary">{service.category}</p>
                </div>
                <p className="service-card-summary text-sm leading-6 text-slate-600 dark:text-slate-300">{summary}</p>
                <div className="mt-auto grid min-h-11 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-slate-200/80 pt-3 text-xs font-semibold dark:border-white/10">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400">
                    <span>{service.durationMinutes} min</span>
                    <span aria-hidden="true">/</span>
                    <span>{paymentLabel}</span>
                  </div>
                  <span className="max-w-[9rem] shrink-0 truncate rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{service.priceLabel}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {panelOpen && activeService ? (
        <div className="booking-panel-backdrop fixed inset-0 z-[90] flex items-end justify-center px-0 pt-8 sm:px-5" onClick={() => setPanelOpen(false)}>
          <form
            action={submitReservation}
            aria-labelledby="booking-panel-title"
            aria-modal="true"
            className="booking-panel-shell relative z-10 flex w-full max-w-3xl flex-col overflow-hidden text-slate-950 dark:text-white"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="booking-panel-grabber mx-auto mt-3 h-1.5 w-12 rounded-full" />
            <div className="booking-panel-header flex items-start justify-between gap-4 border-b p-4 sm:p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Reserva</p>
                <h2 id="booking-panel-title" className="mt-1 text-xl font-black leading-tight sm:text-2xl">{activeService.name}</h2>
              </div>
              <button className="icon-action bg-white/70 dark:bg-white/10" type="button" onClick={() => setPanelOpen(false)} title="Cerrar">
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>

            <div className="booking-panel-body grid gap-5 overflow-y-auto p-4 sm:p-5">
              <input type="hidden" name="serviceId" value={serviceId} />

              <section className="booking-panel-section grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-slate-100 shadow-sm dark:border-white/10 dark:bg-zinc-900">
                  <ServiceArtwork imageUrl={activeService.imageUrl} fallbackUrl={serviceImageFallbackUrl} compact />
                </div>

                <div className="grid content-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{activeService.category}</span>
                    <span className="rounded-full bg-slate-950/5 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{activeService.priceLabel}</span>
                    <span className="rounded-full bg-slate-950/5 px-3 py-1 text-xs font-bold text-slate-700 dark:bg-white/10 dark:text-slate-200">{activeService.durationMinutes} min</span>
                  </div>
                  <p>{getPaymentRequirementLabel(activeService)}</p>
                  {activeService.bufferBeforeMinutes > 0 ? <p>Llegada sugerida: {activeService.bufferBeforeMinutes} min antes</p> : null}
                  {!canReserveAutomatically ? <p className="font-semibold text-primary">Este servicio se solicita sin horario exacto y se coordina por WhatsApp.</p> : null}
                  {activeService.arrivalInstructions ? <p className="leading-6">{activeService.arrivalInstructions}</p> : null}
                  {activeService.virtualInstructions ? <p className="leading-6">{activeService.virtualInstructions}</p> : null}
                  {activeService.description ? <p className="leading-6">{activeService.description}</p> : null}
                </div>
              </section>

              <section className="booking-panel-section grid gap-3">
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
                  <div className="grid gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <p className="font-semibold text-slate-950 dark:text-white">Solicitud sin horario estipulado</p>
                    <p>La lectura no es en vivo. Se envia por WhatsApp en el formato que corresponda.</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-2 font-semibold">
                        Fecha de referencia
                        <input className="input-control" name="preferredDate" type="date" />
                      </label>
                      <label className="grid gap-2 font-semibold">
                        Franja o preferencia
                        <input className="input-control" name="preferredWindow" maxLength={160} placeholder="Dentro de las 24 hs" />
                      </label>
                    </div>
                  </div>
                )}
              </section>

              <section className="booking-panel-section grid gap-3">
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
              </section>

              {activeIntakeForms.length > 0 ? (
                <section className="booking-panel-section grid gap-4">
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

              {message ? <p className={state === "error" ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-emerald-600"}>{message}</p> : null}
            </div>

            <div className="booking-panel-footer border-t p-4 backdrop-blur-xl sm:p-5">
              <button className="primary-action w-full justify-center disabled:cursor-not-allowed disabled:opacity-60" disabled={state === "submitting" || (canReserveAutomatically && !startsAt)} type="submit">
                {state === "submitting" ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <CalendarCheck aria-hidden="true" className="h-4 w-4" />}
                {canReserveAutomatically ? "Confirmar reserva" : "Enviar solicitud"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}
