"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import type { PanelBusinessSettings } from "@/lib/operations/panel-settings.types";

export function BusinessSettingsForm({ business }: { business: PanelBusinessSettings }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setState("saving");
    setMessage("");

    const response = await fetch("/api/panel/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        description: String(formData.get("description") ?? ""),
        whatsappPhone: String(formData.get("whatsappPhone") ?? ""),
        publicDomain: String(formData.get("publicDomain") ?? ""),
        brandPrimary: String(formData.get("brandPrimary") ?? ""),
        brandAccent: String(formData.get("brandAccent") ?? ""),
        brandRadius: String(formData.get("brandRadius") ?? ""),
      }),
    });

    if (!response.ok) {
      setState("error");
      setMessage("No se pudo guardar la configuracion.");
      return;
    }

    setState("saved");
    setMessage("Configuracion guardada.");
  }

  return (
    <form action={submit} className="surface grid gap-5 p-5 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Nombre del negocio
          <input className="input-control" name="name" defaultValue={business.name} required maxLength={120} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Slug
          <input className="input-control" name="slug" defaultValue={business.slug} required maxLength={80} />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Descripcion publica
        <textarea className="input-control min-h-28 resize-y" name="description" defaultValue={business.description} maxLength={500} />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          WhatsApp
          <input className="input-control" name="whatsappPhone" defaultValue={business.whatsappPhone} maxLength={40} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Dominio publico
          <input className="input-control" name="publicDomain" defaultValue={business.publicDomain} maxLength={253} placeholder="reservas.negocio.com.ar" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="grid gap-2 text-sm font-semibold">
          Color principal
          <input className="input-control h-12" name="brandPrimary" type="color" defaultValue={business.brandPrimary} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Color secundario
          <input className="input-control h-12" name="brandAccent" type="color" defaultValue={business.brandAccent} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Radio
          <select className="input-control" name="brandRadius" defaultValue={business.brandRadius}>
            <option value="4px">4px</option>
            <option value="8px">8px</option>
            <option value="12px">12px</option>
            <option value="16px">16px</option>
          </select>
        </label>
      </div>

      <button className="primary-action justify-center disabled:opacity-60" disabled={state === "saving"} type="submit">
        <Save aria-hidden="true" className="h-4 w-4" />
        Guardar configuracion
      </button>
      {message ? <p className={state === "error" ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-emerald-600"}>{message}</p> : null}
    </form>
  );
}
