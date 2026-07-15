"use client";

import { Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PanelBusinessSettings } from "@/lib/operations/panel-settings.types";

const DEFAULT_BUSINESS = {
  name: "",
  slug: "",
  description: "",
  whatsappPhone: "",
  publicDomain: "",
  publicAppName: "",
  panelAppName: "",
  publicShortName: "",
  panelShortName: "",
  onboardingStatus: "incomplete" as const,
  brandPrimary: "#2563eb",
  brandAccent: "#14b8a6",
  themeBackground: "#2563eb",
  brandRadius: "8px",
  defaultThemeMode: "light" as const,
  publicBottomNavEnabled: false,
};

export function BusinessSettingsForm({ business }: { business: PanelBusinessSettings | null }) {
  const router = useRouter();
  const values = business ?? DEFAULT_BUSINESS;
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
        publicAppName: String(formData.get("publicAppName") ?? ""),
        panelAppName: String(formData.get("panelAppName") ?? ""),
        publicShortName: String(formData.get("publicShortName") ?? ""),
        panelShortName: String(formData.get("panelShortName") ?? ""),
        onboardingStatus: String(formData.get("onboardingStatus") ?? "incomplete"),
        brandPrimary: String(formData.get("brandPrimary") ?? ""),
        brandAccent: String(formData.get("brandAccent") ?? ""),
        themeBackground: String(formData.get("themeBackground") ?? ""),
        brandRadius: String(formData.get("brandRadius") ?? ""),
        defaultThemeMode: String(formData.get("defaultThemeMode") ?? "light"),
        publicBottomNavEnabled: formData.get("publicBottomNavEnabled") === "true",
      }),
    });

    if (!response.ok) {
      setState("error");
      setMessage("No se pudo guardar la configuracion.");
      return;
    }

    setState("saved");
    setMessage(business ? "Configuracion guardada." : "Negocio creado y asociado a tu usuario.");
    router.refresh();
  }

  return (
    <form action={submit} className="surface grid gap-5 p-5 sm:p-6">
      <div>
        <h2 className="text-xl font-black">Negocio</h2>
        <p className="mt-1 text-sm text-muted">Datos base para operar una instancia limpia sin seed demo.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Nombre del negocio
          <input className="input-control" name="name" defaultValue={values.name} required maxLength={120} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Slug
          <input className="input-control" name="slug" defaultValue={values.slug} required maxLength={80} placeholder="mi-negocio" />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Descripcion publica
        <textarea className="input-control min-h-28 resize-y" name="description" defaultValue={values.description} maxLength={500} />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          WhatsApp
          <input className="input-control" name="whatsappPhone" defaultValue={values.whatsappPhone} maxLength={40} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Dominio publico
          <input className="input-control" name="publicDomain" defaultValue={values.publicDomain} maxLength={253} placeholder="reservas.negocio.com.ar" />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-2 text-sm font-semibold">
          Nombre app publica
          <input className="input-control" name="publicAppName" defaultValue={values.publicAppName} maxLength={60} placeholder={values.name || "Turnos"} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Nombre corto publica
          <input className="input-control" name="publicShortName" defaultValue={values.publicShortName} maxLength={24} placeholder="Turnos" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Nombre app panel
          <input className="input-control" name="panelAppName" defaultValue={values.panelAppName} maxLength={60} placeholder={values.name ? `${values.name} - Panel` : "Panel Turnos"} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Nombre corto panel
          <input className="input-control" name="panelShortName" defaultValue={values.panelShortName} maxLength={24} placeholder="Panel" />
        </label>
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4 text-sm dark:border-white/10">
        <input className="mt-1" name="publicBottomNavEnabled" type="checkbox" value="true" defaultChecked={values.publicBottomNavEnabled} />
        <span>
          <span className="block font-bold">Mostrar barra inferior en la app publica</span>
          <span className="mt-1 block leading-6 text-muted">Activa las secciones Servicios, Historial, Notificaciones y Cuenta para probar si conviene dejar la navegacion visible.</span>
        </span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <label className="grid gap-2 text-sm font-semibold">
          Color principal
          <input className="input-control h-12" name="brandPrimary" type="color" defaultValue={values.brandPrimary} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Color secundario
          <input className="input-control h-12" name="brandAccent" type="color" defaultValue={values.brandAccent} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Fondo app
          <input className="input-control h-12" name="themeBackground" type="color" defaultValue={values.themeBackground} />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Radio
          <select className="input-control" name="brandRadius" defaultValue={values.brandRadius}>
            <option value="4px">4px</option>
            <option value="8px">8px</option>
            <option value="12px">12px</option>
            <option value="16px">16px</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Tema inicial
          <select className="input-control" name="defaultThemeMode" defaultValue={values.defaultThemeMode}>
            <option value="light">Claro</option>
            <option value="brand">Color</option>
            <option value="dark">Oscuro</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Estado
          <select className="input-control" name="onboardingStatus" defaultValue={values.onboardingStatus}>
            <option value="incomplete">Incompleto</option>
            <option value="review">En revision</option>
            <option value="ready">Listo</option>
          </select>
        </label>
      </div>

      <button className="primary-action justify-center disabled:opacity-60" disabled={state === "saving"} type="submit">
        <Save aria-hidden="true" className="h-4 w-4" />
        {business ? "Guardar configuracion" : "Crear negocio"}
      </button>
      {message ? <p className={state === "error" ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-emerald-600"}>{message}</p> : null}
    </form>
  );
}
