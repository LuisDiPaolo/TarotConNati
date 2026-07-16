"use client";

import { Bell, ChevronDown, Palette, Save, Sparkles } from "lucide-react";
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

function SetupStep({ number, title, copy }: { number: string; title: string; copy: string }) {
  return (
    <li className="flex gap-3 rounded-lg border border-slate-200 bg-white/60 p-3 text-sm dark:border-white/10 dark:bg-white/5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--brand-primary)] text-xs font-black text-white">{number}</span>
      <span>
        <span className="block font-black">{title}</span>
        <span className="mt-1 block leading-5 text-muted">{copy}</span>
      </span>
    </li>
  );
}

export function BusinessSettingsForm({ business }: { business: PanelBusinessSettings | null }) {
  const router = useRouter();
  const values = business ?? DEFAULT_BUSINESS;
  const [businessName, setBusinessName] = useState(values.name);
  const [bottomNavEnabled, setBottomNavEnabled] = useState(values.publicBottomNavEnabled);
  const [notificationsEnabled, setNotificationsEnabled] = useState(values.notificationsEnabled);
  const [showAdvanced, setShowAdvanced] = useState(Boolean(business));
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    if (state === "saving") return;
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
        publicAppName,
        panelAppName,
        publicShortName: values.publicShortName || shortNameFromName(name, "Turnos"),
        panelShortName: values.panelShortName || "Panel",
        onboardingStatus: values.onboardingStatus,
        brandPrimary: String(formData.get("brandPrimary") ?? DEFAULT_BUSINESS.brandPrimary),
        brandAccent: String(formData.get("brandAccent") ?? DEFAULT_BUSINESS.brandAccent),
        themeBackground: String(formData.get("themeBackground") ?? DEFAULT_BUSINESS.themeBackground),
        brandRadius: String(formData.get("brandRadius") ?? DEFAULT_BUSINESS.brandRadius),
        defaultThemeMode: String(formData.get("defaultThemeMode") ?? DEFAULT_BUSINESS.defaultThemeMode),
        publicBottomNavEnabled: bottomNavEnabled,
        notificationsEnabled,
      }),
    }).catch(() => null);

    if (!response?.ok) {
      setState("error");
      setMessage("No se pudo guardar. Revisa el nombre o WhatsApp e intenta de nuevo.");
      return;
    }

    setState("saved");
    setMessage(business ? "Negocio actualizado." : "Negocio creado. Ahora podes cargar servicios y horarios.");
    router.refresh();
  }

  return (
    <form action={submit} className="surface grid gap-5 p-5 sm:p-6">
      <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.14em] text-accent">Asistente de alta</p>
          <h2 className="mt-2 text-2xl font-black">Dejar listo el negocio</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Completa la identidad inicial del negocio. Los dominios publico y de panel ya quedan definidos en el alta tecnica del servicio.
          </p>
        </div>
        <ul className="grid gap-2">
          <SetupStep number="1" title="Identidad" copy="Nombre, contacto y presentacion publica." />
          <SetupStep number="2" title="Marca" copy="Logo, colores y apariencia se pueden ajustar ahora o despues." />
          <SetupStep number="3" title="Operativa" copy="Luego se cargan servicios, horarios y preguntas." />
        </ul>
      </div>

      <section className="grid gap-4 rounded-lg border border-slate-200 p-4 dark:border-white/10">
        <div className="flex items-start gap-3">
          <Sparkles aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <h3 className="text-base font-black">Informacion principal</h3>
            <p className="mt-1 text-sm text-muted">Esto es lo que el cliente ve al entrar a la pagina publica.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Nombre del negocio
            <input
              autoComplete="organization"
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
            WhatsApp para reservas
            <input
              autoComplete="tel"
              className="input-control"
              inputMode="tel"
              name="whatsappPhone"
              defaultValue={values.whatsappPhone}
              maxLength={40}
              placeholder="Ej: 5493515550101"
            />
            <span className="text-xs font-normal leading-5 text-muted">Acepta numero local o formato Argentina; el sistema lo normaliza al generar mensajes.</span>
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold">
          Presentacion breve
          <textarea
            className="input-control min-h-28 resize-y"
            name="description"
            defaultValue={values.description}
            maxLength={500}
            placeholder="Conta que ofrece el negocio, como trabaja y que puede reservar el cliente."
          />
        </label>
      </section>


      <button
        aria-expanded={showAdvanced}
        className="secondary-action justify-between"
        disabled={state === "saving"}
        onClick={() => setShowAdvanced((current) => !current)}
        type="button"
      >
        <span className="flex items-center gap-2">
          <Palette aria-hidden="true" className="h-4 w-4" />
          Ajustes visuales y funciones
        </span>
        <ChevronDown aria-hidden="true" className={showAdvanced ? "h-4 w-4 rotate-180 transition" : "h-4 w-4 transition"} />
      </button>

      {showAdvanced ? (
        <div className="grid gap-4">
          <section className="grid gap-3 rounded-lg border border-slate-200 p-4 dark:border-white/10">
            <div>
              <h3 className="text-base font-black">Apariencia</h3>
              <p className="mt-1 text-sm text-muted">Se puede ajustar ahora o despues. No bloquea la carga inicial del negocio.</p>
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
            <div className="flex items-start gap-3">
              <Bell aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <div>
                <h3 className="text-base font-black">Funciones de la app publica</h3>
                <p className="mt-1 text-sm text-muted">Activa solo lo que el negocio quiere mostrar o usar con sus clientes.</p>
              </div>
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
        </div>
      ) : (
        <div className="hidden">
          <input name="brandPrimary" readOnly value={values.brandPrimary} />
          <input name="brandAccent" readOnly value={values.brandAccent} />
          <input name="themeBackground" readOnly value={values.themeBackground} />
          <input name="brandRadius" readOnly value={values.brandRadius} />
          <input name="defaultThemeMode" readOnly value={values.defaultThemeMode} />
        </div>
      )}

      <button className="primary-action justify-center disabled:opacity-60" disabled={state === "saving"} type="submit">
        <Save aria-hidden="true" className="h-4 w-4" />
        {state === "saving" ? "Guardando" : business ? "Guardar negocio" : "Crear negocio y continuar"}
      </button>
      {message ? <p className={state === "error" ? "text-sm font-semibold text-red-600" : "text-sm font-semibold text-emerald-600"}>{message}</p> : null}
    </form>
  );
}
