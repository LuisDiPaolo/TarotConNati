function getWorkerPath(registration: ServiceWorkerRegistration) {
  const scriptUrl = registration.active?.scriptURL ?? registration.waiting?.scriptURL ?? registration.installing?.scriptURL;
  if (!scriptUrl) return null;
  return new URL(scriptUrl).pathname;
}

export async function unregisterOtherServiceWorkers(expectedWorkerPath: "/sw-public.js" | "/sw-panel.js") {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations.map((registration) => {
      const workerPath = getWorkerPath(registration);
      if (workerPath === expectedWorkerPath) return Promise.resolve(false);
      return registration.unregister();
    }),
  );
}
