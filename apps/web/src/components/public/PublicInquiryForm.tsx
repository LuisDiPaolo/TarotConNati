"use client";

import { Send } from "lucide-react";
import { useRef, useState } from "react";

type SubmitState = "idle" | "sending" | "sent" | "error";

export function PublicInquiryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function submitInquiry(formData: FormData) {
    if (state === "sending") return;
    setState("sending");
    setMessage("");

    const response = await fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        message: String(formData.get("message") ?? ""),
        source: "contact_form",
      }),
    }).catch(() => null);

    if (!response?.ok) {
      setState("error");
      setMessage("No se pudo enviar la consulta. Revisa los datos e intenta nuevamente.");
      return;
    }

    formRef.current?.reset();
    setState("sent");
    setMessage("Consulta enviada. El negocio va a responder por el contacto que dejaste.");
  }

  return (
    <section className="surface p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Contacto</p>
          <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">Enviar una consulta</h2>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Send aria-hidden="true" className="h-5 w-5" />
        </span>
      </div>

      <form ref={formRef} action={submitInquiry} className="mt-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Nombre
            <input className="input-control" name="name" autoComplete="name" maxLength={120} required />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            WhatsApp o telefono
            <input className="input-control" name="phone" autoComplete="tel" inputMode="tel" maxLength={40} />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-semibold">
          Email
          <input className="input-control" name="email" autoComplete="email" maxLength={160} type="email" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Consulta
          <textarea className="input-control min-h-32 resize-y" name="message" maxLength={1200} required />
        </label>
        <button className="primary-action justify-center" disabled={state === "sending"} type="submit">
          {state === "sending" ? "Enviando" : "Enviar consulta"}
        </button>
        {message ? (
          <p className={`text-sm font-semibold ${state === "error" ? "text-red-600 dark:text-red-300" : "text-primary"}`}>{message}</p>
        ) : null}
      </form>
    </section>
  );
}
