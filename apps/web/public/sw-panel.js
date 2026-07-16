const CACHE_NAME = "turnos-panel-v2";
const NEVER_CACHE_PREFIXES = ["/api/"];
let vapidPublicKey = null;
let brandAssets = {
  iconUrl: "/pwa/panel/icon.svg",
  maskableIconUrl: "/pwa/panel/maskable.svg",
};

function isNeverCachePath(pathname) {
  return NEVER_CACHE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isNeverCachePath(url.pathname)) return;

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(fetch(request).catch(() => new Response("Panel sin conexion", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })));
  }
});

function urlBase64ToUint8Array(value) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function resolveNotificationUrl(value) {
  try {
    const url = new URL(value || "/", self.location.origin);
    if (url.origin !== self.location.origin) return "/";
    if (url.pathname.startsWith("/api/")) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

async function notifyWindowClients(payload) {
  const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  await Promise.all(windowClients.map((client) => client.postMessage({
    type: "TURNOS_PUSH_NOTIFICATION",
    payload,
  })));
}

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let payload = {};
    try {
      payload = event.data?.json() ?? {};
    } catch {
      payload = { body: event.data?.text() };
    }

    const title = typeof payload.title === "string" ? payload.title : "Panel Turnos";
    const body = typeof payload.body === "string" ? payload.body : "Tenes una notificacion nueva del panel.";
    const targetUrl = resolveNotificationUrl(payload.url);
    const normalizedPayload = {
      ...payload,
      title,
      body,
      url: targetUrl,
      eventId: typeof payload.eventId === "string" ? payload.eventId : `${Date.now()}`,
      receivedAt: new Date().toISOString(),
    };

    await self.registration.showNotification(title, {
      body,
      data: { url: targetUrl, payload: normalizedPayload },
      icon: typeof payload.icon === "string" ? payload.icon : brandAssets.iconUrl,
      badge: brandAssets.maskableIconUrl,
      tag: typeof payload.tag === "string" ? payload.tag : "turnos-panel-notification",
      renotify: typeof payload.tag === "string",
    });
    await notifyWindowClients(normalizedPayload).catch(() => null);
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = resolveNotificationUrl(event.notification.data?.url);

  event.waitUntil((async () => {
    const windowClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existingClient = windowClients.find((client) => {
      const clientUrl = new URL(client.url);
      return `${clientUrl.pathname}${clientUrl.search}${clientUrl.hash}` === targetUrl;
    });
    if (existingClient) return existingClient.focus();
    return self.clients.openWindow(targetUrl);
  })());
});

self.addEventListener("pushsubscriptionchange", (event) => {
  if (!vapidPublicKey) return;

  event.waitUntil((async () => {
    const subscription = await self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: subscription.toJSON(), surface: "panel" }),
    }).catch(() => null);
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "SET_VAPID_PUBLIC_KEY" && typeof event.data.value === "string") {
    vapidPublicKey = event.data.value;
  }
  if (event.data?.type === "SET_BRAND_ASSETS" && event.data.value) {
    if (typeof event.data.value.iconUrl === "string") brandAssets.iconUrl = event.data.value.iconUrl;
    if (typeof event.data.value.maskableIconUrl === "string") brandAssets.maskableIconUrl = event.data.value.maskableIconUrl;
  }
});
