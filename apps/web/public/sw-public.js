const CACHE_NAME = "turnos-public-v1";
const STATIC_CACHE = "turnos-public-static-v1";
const PRECACHE_URLS = ["/", "/api/pwa/public-manifest"];
const NEVER_CACHE_PREFIXES = ["/api/", "/panel"];
let vapidPublicKey = null;

function isNeverCachePath(pathname) {
  return NEVER_CACHE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isSafeStaticRequest(request, url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  return ["style", "script", "font", "image", "manifest"].includes(request.destination);
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type !== "opaque") {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) ?? (await caches.match("/")) ?? new Response("Sin conexion", { status: 503 });
  }
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {})));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith("turnos-public-") && name !== CACHE_NAME && name !== STATIC_CACHE).map((name) => caches.delete(name)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isNeverCachePath(url.pathname)) return;

  if (isSafeStaticRequest(request, url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirstNavigation(request));
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
    if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/panel")) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let payload = {};
    try {
      payload = event.data?.json() ?? {};
    } catch {
      payload = { body: event.data?.text() };
    }

    const title = typeof payload.title === "string" ? payload.title : "Turnos";
    const body = typeof payload.body === "string" ? payload.body : "Tenes una notificacion nueva.";
    const targetUrl = resolveNotificationUrl(payload.url);

    await self.registration.showNotification(title, {
      body,
      data: { url: targetUrl },
      icon: "/pwa/public/icon.svg",
      badge: "/pwa/public/maskable.svg",
      tag: typeof payload.tag === "string" ? payload.tag : undefined,
    });
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
      body: JSON.stringify({ subscription: subscription.toJSON(), surface: "public" }),
    }).catch(() => null);
  })());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "SET_VAPID_PUBLIC_KEY" && typeof event.data.value === "string") {
    vapidPublicKey = event.data.value;
  }
});
