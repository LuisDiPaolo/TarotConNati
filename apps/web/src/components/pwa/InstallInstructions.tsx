"use client";

import { Bell, Download, MonitorSmartphone, Share, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";
import { ensurePushSubscription } from "@/lib/pwa/push-client";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallInstructionsProps = {
  surface: "public" | "panel";
};

function resolvePlatform() {
  if (typeof navigator === "undefined") return "desktop";
  const userAgent = navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  if (isIos) return "ios";
  if (isAndroid) return "android";
  return "desktop";
}

export function InstallInstructions({ surface }: InstallInstructionsProps) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState("Notification" in globalThis ? Notification.permission : "unsupported");
  const [platform] = useState(() => resolvePlatform());
  const title = surface === "panel" ? "Instalar panel" : "Instalar reservas";

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function handleInstalled() {
      setInstalled(true);
      setInstallEvent(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function requestInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice.catch(() => null);
    setInstallEvent(null);
  }

  async function requestNotifications() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    const permission = await Notification.requestPermission();
    setNotificationStatus(permission);
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.ready;
    await ensurePushSubscription(registration, surface);
  }

  return (
    <main className="app-screen flex items-center justify-center py-10">
      <section className="w-full max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">PWA</p>
        <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Cada superficie se instala desde su propio origen: el sitio publico desde el dominio principal y el panel desde el subdominio operativo.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <article className="surface p-5">
            <MonitorSmartphone aria-hidden="true" className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-lg font-bold">Origen separado</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Manifest y service worker se resuelven por hostname.</p>
          </article>
          <article className="surface p-5">
            <Smartphone aria-hidden="true" className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-lg font-bold">iOS</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Usar Compartir y luego Agregar a inicio.</p>
          </article>
          <article className="surface p-5">
            <Share aria-hidden="true" className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-lg font-bold">Android/desktop</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">El navegador puede mostrar el prompt nativo de instalacion.</p>
          </article>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button className="primary-action" disabled={!installEvent || installed} onClick={requestInstall} type="button">
            <Download aria-hidden="true" className="h-5 w-5" />
            {installed ? "Instalada" : installEvent ? "Instalar" : platform === "ios" ? "Instalacion manual" : "Prompt no disponible"}
          </button>
          <button className="primary-action bg-accent" disabled={notificationStatus === "unsupported" || notificationStatus === "granted"} onClick={requestNotifications} type="button">
            <Bell aria-hidden="true" className="h-5 w-5" />
            {notificationStatus === "granted" ? "Notificaciones activas" : "Activar notificaciones"}
          </button>
          <a className="primary-action" href={surface === "panel" ? "/api/pwa/panel-manifest" : "/api/pwa/public-manifest"}>Ver manifest</a>
        </div>
      </section>
    </main>
  );
}
