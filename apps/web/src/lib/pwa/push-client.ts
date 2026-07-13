function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = `${value}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function postSubscription(subscription: PushSubscription, surface: "public" | "panel") {
  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: subscription.toJSON(), surface }),
  }).catch(() => null);
}

export async function ensurePushSubscription(registration: ServiceWorkerRegistration, surface: "public" | "panel") {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) return;

  registration.active?.postMessage({ type: "SET_VAPID_PUBLIC_KEY", value: vapidPublicKey });

  if (!("Notification" in window) || !("PushManager" in window)) return;
  if (Notification.permission !== "granted") return;

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    await postSubscription(existing, surface);
    return;
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  await postSubscription(subscription, surface);
}
