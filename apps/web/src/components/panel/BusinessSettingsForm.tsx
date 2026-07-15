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
  notificationsEnabled: true,
};

function slugFromName(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "mi-negocio";
}

function shortNameFromName(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.length > 24 ? trimmed.slice(0, 24).trim() : trimmed;
}

export function BusinessSettingsForm({ business }: { business: PanelBusinessSettings | null }) {
  const router = useRouter();
  const values = business ?? DEFAULT_BUSINESS;
  const [businessName, setBusinessName] = useState(values.name);
  const [bottomNavEnabled, setBottomNavEnabled] = useState(values.publicBottomNavEnabled);
  const [notificationsEnabled, setNotificationsEnabled] = useState(values.notificationsEnabled);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setState("saving");
    setMessage("");

    const name = String(formData.get("name") ?? "").trim();
    const slug = values.slug || slugFromName(name);
    const publicAppName = values.publicAppName || `${name || "Turnos"} - Reservas`;
    const panelAppName = values.panelAppName || `${name || "Turnos"} - Panel`;

    const response = await fetch("/api/panel/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        slug,
        description: String(formData.get("description") ?? ""),
        whatsappPhone: String(formData.get("whatsappPhone") ?? ""),
        publicDomain: String(formData.get("publicDomain") ?? ""),
        publicAppName,
        panelAppName,
        publicShortName: values.publicShortName || shortNameFromName(name, "Turnos"),
        panelShortName: values.panelShortName || "Panel",
        onboardingStatus: values.onboardingStatus,
        brandPrimary: String(formData.get("brandPrimary") ?? ""),
        brandAccent: String(formData.get("brandAccent") ?? ""),
        themeBackground: String(formData.get("themeBackground") ?? ""),
        brandRadius: String(formData.get("brandRadius") ?? ""),
        defaultThemeMode: String(formData.get("defaultThemeMode") ?? "light"),
        publicBottomNavEnabled: bottomNavEnabled,
        notificationsEnabled,
      }),
    }).catch(() => null);

    if (!response?.ok) {
      setState("error");
      setMessage("No se pudo guardar. Revisa los campos obligatorios e intenta de nuevo.");
      return;
    }

    setState("saved");
    setMessage(business ? "Configuracion guardada." : "Negocio creado y asociado a tu usuario.");
    router.refresh();
  }

  return (
    <form action={submit} className="surface grid gap-5 p-5 sm:p-6">
      <div>
        <h2 className="text-xl font-black">Datos del negocio</h2>
        <p className="mt-1 text-sm text-muted">Esta informacion se usa en la pagina publica de reservas y en el panel.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Nombre del negocio
          <input
            className="input-control"
            name="name"
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            required
            maxLength={120}
            placeholder="Ej: Estudio Norte"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          WhatsApp de contacto
          <input className="input-control" name="whatsappPhone" defaultValue={values.whatsappPhone} maxLength={40} placeholder="Ej: 5493515550101" />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Texto de presentacion
        <textarea className="input-control min-h-28 resize-y" name="description" defaultValue={values.description} maxLength={500} placeholder="Conta brevemente que ofrece el negocio y como trabaja." />
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        Direccion web publica
        <input className="input-control" name="publicDomain" defaultValue={values.publicDomain} maxLength={253} placeholder="reservas.negocio.com.ar" />
        <span className="text-xs font-normal leading-5 text-muted">Opcional. Si todavia no hay dominio propio, se puede completar mas adelante.</span>
      </label>

      <section className="grid gap-3 rounded-lg border border-slate-200 p-4 dark:border-white/10">
        <div>
          <h3 className="text-base font-black">Apariencia</h3>
          <p className="mt-1 text-sm text-muted">Elegí colores y estilo visual para la pagina publica.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="grid gap-2 text-sm font-semibold">
            Color principal
            <input className="input-control h-12" name="brandPrimary" type="color" defaultValue={values.brandPrimary} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Color secundario
            <input className="input-control h-12" name="brandAccent" type="color" defaultValue={values.brandAccent} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Fondo en modo color
            <input className="input-control h-12" name="themeBackground" type="color" defaultValue={values.themeBackground} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Esquinas
            <select className="input-control" name="brandRadius" defaultValue={values.brandRadius}>
              <option value="4px">Rectas</option>
              <option value="8px">Suaves</option>
              <option value="12px">Redondeadas</option>
              <option value="16px">Muy redondeadas</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Tema inicial
            <select className="input-control" name="defaultThemeMode" defaultValue={values.defaultThemeMode}>
              <option value="light">Claro</option>
              <option value="brand">Color de marca</option>
              <option value="dark">Oscuro</option>
            </select>
          </label>
        </div>
      </section>

      <section className="grid gap-3 rounded-lg border border-slate-200 p-4 dark:border-white/10">
        <div>
          <h3 className="text-base font-black">Funciones de la app publica</h3>
          <p className="mt-1 text-sm text-muted">Activa solo lo que el negocio quiere mostrar o usar con sus clientes.</p>
        </div>
        <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-md p-1 text-sm">
          <input
            checked={bottomNavEnabled}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer"
            name="publicBottomNavEnabled"
            onChange={(event) => setBottomNavEnabled(event.target.checked)}
            type="checkbox"
            value="true"
          />
          <span>
            <span className="block font-bold">Mostrar navegacion inferior</span>
            <span className="mt-1 block leading-6 text-muted">Agrega accesos a Servicios, Historial, Notificaciones y Cuenta. Dejalo apagado si solo queres mostrar la reserva simple.</span>
          </span>
        </label>
        <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-md p-1 text-sm">
          <input
            checked={notificationsEnabled}
            className="mt-1 h-5 w-5 shrink-0 cursor-pointer"
            name="notificationsEnabled"
            onChange={(event) => setNotificationsEnabled(event.target.checked)}
            type="checkbox"
            value="true"
          />
          <span>
            <span className="block font-bold">Servicio de notificaciones</span>
            <span className="mt-1 block leading-6 text-muted">Permite enviar avisos push por reservas, solicitudes y cambios de estado. Viene activo por defecto y se puede apagar cuando el negocio no quiera usar notificaciones.</span>
          </span>
        </label>
      </section>

      <button className="primary-action justify-center disabled:opacity-60" disabled={state === "saving"} type="submit">
        <Save aria-hidden="true" className="h-4 w-4" />
        {state === "saving" ? "Guardando" : business ? "Guardar cambios" : "Crear negocio"}
      </button>
      {message ? <p className={state === "error" ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-emerald-600"}>{message}</p> : null}
    </form>
  );
}
