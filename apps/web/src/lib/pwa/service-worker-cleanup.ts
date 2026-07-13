const CURRENT_SERVICE_WORKERS = new Set(["/sw-public.js", "/sw-panel.js"]);

function getWorkerPath(registration: ServiceWorkerRegistration) {
  const scriptUrl = registration.active?.scriptURL ?? registration.waiting?.scriptURL ?? registration.installing?.scriptURL;
  if (!scriptUrl) return null;
  return new URL(scriptUrl).pathname;
}

export async function unregisterLegacyServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map((registration) => {
      const workerPath = getWorkerPath(registration);
      if (workerPath && CURRENT_SERVICE_WORKERS.has(workerPath)) return Promise.resolve(false);
      return registration.unregister();
    }),
  );
}
