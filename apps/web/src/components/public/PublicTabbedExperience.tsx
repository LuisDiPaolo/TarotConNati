"use client";

import { Bell, CalendarDays, History, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PublicGiftCards } from "@/components/public/PublicGiftCards";
import { PublicInquiryForm } from "@/components/public/PublicInquiryForm";
import { PublicPortfolioGallery } from "@/components/public/PublicPortfolioGallery";
import { PublicProductsCatalog } from "@/components/public/PublicProductsCatalog";
import { PublicPromotionsBanner } from "@/components/public/PublicPromotionsBanner";
import { ReservationForm } from "@/components/public/ReservationForm";
import type { PublicIntakeForm, PublicPortfolioItem, PublicProduct, PublicPromotion, PublicService, PublicSlot } from "@/lib/operations/booking.types";
import { syncCurrentPushSubscription } from "@/lib/pwa/push-client";

type PublicTab = "services" | "history" | "notifications" | "account";

type PublicHistoryItem = {
  id: string;
  serviceName: string;
  serviceCategory: string;
  startsAt: string;
  createdAt: string;
  status: "active" | "pending" | "completed";
  kind: "appointment" | "request";
  message: string;
};

type PublicNotificationItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

type PushMessagePayload = {
  type?: string;
  payload?: {
    eventId?: string;
    title?: string;
    body?: string;
    receivedAt?: string;
  };
};

type PublicAccount = {
  fullName: string;
  phone: string;
  email: string;
};

type PublicTabbedExperienceProps = {
  description: string;
  services: PublicService[];
  slotsByService: Record<string, PublicSlot[]>;
  intakeFormsByService: Record<string, PublicIntakeForm[]>;
  serviceImageFallbackUrl: string;
  bottomNavigationEnabled: boolean;
  inquiriesEnabled: boolean;
  portfolioItems: PublicPortfolioItem[];
  portfolioSectionTitle: string;
  products: PublicProduct[];
  promotions: PublicPromotion[];
  giftCardsEnabled: boolean;
};

const historyStorageKey = "turnos-public-history";
const notificationsStorageKey = "turnos-public-notifications";
const accountStorageKey = "turnos-public-account";

function readStoredArray<T>(key: string): T[] {
  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return [];
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function persistPublicNotification(item: PublicNotificationItem) {
  try {
    const currentItems = readStoredArray<PublicNotificationItem>(notificationsStorageKey);
    const nextItems = [item, ...currentItems.filter((current) => current.id !== item.id)].slice(0, 50);
    window.localStorage.setItem(notificationsStorageKey, JSON.stringify(nextItems));
    window.dispatchEvent(new Event("turnos-public-notifications-updated"));
  } catch {
    // Notification history is local-only and must never block the PWA.
  }
}

function readStoredAccount(): PublicAccount {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(accountStorageKey) ?? "{}");
    return {
      fullName: typeof parsed.fullName === "string" ? parsed.fullName : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      email: typeof parsed.email === "string" ? parsed.email : "",
    };
  } catch {
    return { fullName: "", phone: "", email: "" };
  }
}

function formatStoredDate(value: string) {
  if (!value) return "Sin horario exacto";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <section className="surface p-6 text-center sm:p-8">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">{text}</p>
    </section>
  );
}

function PublicBottomNav({ activeTab, onChange }: { activeTab: PublicTab; onChange: (tab: PublicTab) => void }) {
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const tabs = useMemo(() => [
    { id: "services" as const, label: "Servicios", Icon: CalendarDays },
    { id: "history" as const, label: "Historial", Icon: History },
    { id: "notifications" as const, label: "Notificaciones", Icon: Bell },
    { id: "account" as const, label: "Cuenta", Icon: UserRound },
  ], []);

  useEffect(() => {
    function syncKeyboardState() {
      const viewport = window.visualViewport;
      const touchSurface = window.matchMedia("(pointer: coarse)").matches;
      if (!viewport || !touchSurface) {
        setKeyboardOpen(false);
        return;
      }

      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardOpen(inset > 24);
    }

    syncKeyboardState();
    window.visualViewport?.addEventListener("resize", syncKeyboardState);
    window.visualViewport?.addEventListener("scroll", syncKeyboardState);
    return () => {
      window.visualViewport?.removeEventListener("resize", syncKeyboardState);
      window.visualViewport?.removeEventListener("scroll", syncKeyboardState);
    };
  }, []);

  if (keyboardOpen) return null;

  return (
    <nav className="app-bottom-nav public-bottom-nav" data-app-bottom-nav="true" aria-label="Navegacion publica">
      <div className="app-bottom-nav__surface">
        <div className="app-bottom-nav__items">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                aria-current={active ? "page" : undefined}
                aria-label={tab.label}
                className="app-bottom-nav__item"
                data-active={active ? "true" : "false"}
                key={tab.id}
                onClick={() => {
                  if (!active) onChange(tab.id);
                }}
                style={{ WebkitTapHighlightColor: "transparent" }}
                type="button"
              >
                <span className="app-bottom-nav__active-pill" aria-hidden="true" />
                <tab.Icon aria-hidden="true" className="app-bottom-nav__icon" />
                <span className="app-bottom-nav__label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export function PublicTabbedExperience({ description, services, slotsByService, intakeFormsByService, serviceImageFallbackUrl, bottomNavigationEnabled, inquiriesEnabled, portfolioItems, portfolioSectionTitle, products, promotions, giftCardsEnabled }: PublicTabbedExperienceProps) {
  const [activeTab, setActiveTab] = useState<PublicTab>("services");
  const [history, setHistory] = useState<PublicHistoryItem[]>([]);
  const [notifications, setNotifications] = useState<PublicNotificationItem[]>([]);
  const [account, setAccount] = useState<PublicAccount>({ fullName: "", phone: "", email: "" });
  const [notificationPermission, setNotificationPermission] = useState("default");
  const [notificationBusy, setNotificationBusy] = useState(false);

  useEffect(() => {
    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (requestedTab === "history" || requestedTab === "notifications" || requestedTab === "account" || requestedTab === "services") {
      setActiveTab(requestedTab);
    }

    function syncStoredState() {
      setHistory(readStoredArray<PublicHistoryItem>(historyStorageKey));
      setNotifications(readStoredArray<PublicNotificationItem>(notificationsStorageKey));
      setAccount(readStoredAccount());
      setNotificationPermission(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    }

    syncStoredState();
    function storePushNotification(event: MessageEvent) {
      const data = event.data as PushMessagePayload;
      if (data?.type !== "TURNOS_PUSH_NOTIFICATION") return;
      const payload = data.payload;
      if (!payload?.title && !payload?.body) return;

      persistPublicNotification({
        id: payload.eventId || `${Date.now()}`,
        title: payload.title || "Turnos",
        body: payload.body || "Tenes una notificacion nueva.",
        createdAt: payload.receivedAt || new Date().toISOString(),
        read: false,
      });
      syncStoredState();
    }

    window.addEventListener("turnos-public-history-updated", syncStoredState);
    window.addEventListener("turnos-public-notifications-updated", syncStoredState);
    window.addEventListener("storage", syncStoredState);
    navigator.serviceWorker?.addEventListener("message", storePushNotification);
    return () => {
      window.removeEventListener("turnos-public-history-updated", syncStoredState);
      window.removeEventListener("turnos-public-notifications-updated", syncStoredState);
      window.removeEventListener("storage", syncStoredState);
      navigator.serviceWorker?.removeEventListener("message", storePushNotification);
    };
  }, []);

  function saveAccount(formData: FormData) {
    const nextAccount = {
      fullName: String(formData.get("fullName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
    };
    window.localStorage.setItem(accountStorageKey, JSON.stringify(nextAccount));
    setAccount(nextAccount);
  }

  async function requestNotificationPermission() {
    if (notificationBusy) return;
    setNotificationBusy(true);
    try {
      if (typeof Notification === "undefined") {
        setNotificationPermission("unsupported");
        return;
      }
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission === "granted") await syncCurrentPushSubscription("public").catch(() => null);
    } finally {
      setNotificationBusy(false);
    }
  }

  const servicesSection = (
    <div className="grid gap-6">
      <section className="surface p-6 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Antes de reservar</p>
        <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">Coordina tu turno en pocos pasos</h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          {description || "Completa tus datos, revisa las opciones disponibles y confirma la reserva desde el formulario."}
        </p>
        <div className="mt-6 grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-zinc-800">
          <div>
            <p className="text-sm font-bold">Confirmacion clara</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Al finalizar vas a ver el estado de tu reserva y los datos importantes del turno.</p>
          </div>
          <div>
            <p className="text-sm font-bold">Datos necesarios</p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">El formulario puede pedir informacion extra para preparar mejor la atencion.</p>
          </div>
        </div>
      </section>

      <PublicPromotionsBanner promotions={promotions} />
      <ReservationForm services={services} slotsByService={slotsByService} intakeFormsByService={intakeFormsByService} serviceImageFallbackUrl={serviceImageFallbackUrl} />
      <PublicProductsCatalog products={products} />
      {giftCardsEnabled ? <PublicGiftCards services={services} /> : null}
      <PublicPortfolioGallery items={portfolioItems} sectionTitle={portfolioSectionTitle} />
      {inquiriesEnabled ? <PublicInquiryForm /> : null}
    </div>
  );

  if (!bottomNavigationEnabled) return servicesSection;

  return (
    <div className="public-tabbed-shell">
      <div className={activeTab === "services" ? "grid gap-6" : "hidden"}>{servicesSection}</div>

      <div className={activeTab === "history" ? "grid gap-4" : "hidden"}>
        <header className="surface p-5">
          <p className="text-sm font-semibold text-primary">Historial</p>
          <h2 className="mt-1 text-2xl font-black">Tus turnos y solicitudes</h2>
        </header>
        {history.length > 0 ? history.map((item) => (
          <article className="surface grid gap-2 p-4" key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-black">{item.serviceName}</h3>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">{item.serviceCategory}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{item.kind === "appointment" ? "Turno" : "Solicitud"}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{formatStoredDate(item.startsAt)}</p>
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.message}</p>
          </article>
        )) : <EmptyState title="Todavia no hay historial" text="Cuando envies una reserva o solicitud desde esta PWA, se guardara aca en este dispositivo." />}
      </div>

      <div className={activeTab === "notifications" ? "grid gap-4" : "hidden"}>
        <header className="surface p-5">
          <p className="text-sm font-semibold text-primary">Notificaciones</p>
          <h2 className="mt-1 text-2xl font-black">Avisos recibidos</h2>
        </header>
        {notifications.length > 0 ? notifications.map((item) => (
          <article className="surface flex gap-3 p-4" key={item.id}>
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-black">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.body}</p>
              <p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">{formatStoredDate(item.createdAt)}</p>
            </div>
          </article>
        )) : <EmptyState title="Sin avisos guardados" text="Las notificaciones push que se reciban en esta PWA podran listarse aca como cards horizontales." />}
      </div>

      <div className={activeTab === "account" ? "grid gap-4" : "hidden"}>
        <form action={saveAccount} className="surface grid gap-4 p-5">
          <div>
            <p className="text-sm font-semibold text-primary">Cuenta</p>
            <h2 className="mt-1 text-2xl font-black">Datos de cliente</h2>
          </div>
          <label className="grid gap-2 text-sm font-semibold">
            Nombre
            <input className="input-control" name="fullName" defaultValue={account.fullName} autoComplete="name" maxLength={120} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Telefono
            <input className="input-control" name="phone" defaultValue={account.phone} autoComplete="tel" maxLength={40} />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Email
            <input className="input-control" name="email" defaultValue={account.email} autoComplete="email" type="email" maxLength={160} />
          </label>
          <button className="primary-action justify-center" type="submit">Guardar datos</button>
        </form>

        <section className="surface grid gap-3 p-5">
          <h3 className="text-lg font-black">Permisos</h3>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/80 p-3 dark:border-white/10">
            <div>
              <p className="text-sm font-bold">Notificaciones</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Estado: {notificationPermission}</p>
            </div>
            <button className="secondary-action" type="button" disabled={notificationBusy} onClick={() => void requestNotificationPermission()}>{notificationBusy ? "Activando" : "Activar"}</button>
          </div>
          <div className="rounded-lg border border-slate-200/80 p-3 dark:border-white/10">
            <p className="text-sm font-bold">Ubicacion</p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Reservado para futuras funciones que requieran ubicacion del cliente.</p>
          </div>
        </section>
      </div>

      <PublicBottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
