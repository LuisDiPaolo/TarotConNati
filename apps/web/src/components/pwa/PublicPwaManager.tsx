"use client";

import { useEffect } from "react";
import { updatePwaHeadLinks, type PwaHeadAssets } from "@/lib/pwa/head-links";
import { isPanelHostname } from "@/lib/pwa/host";
import { ensurePushSubscription } from "@/lib/pwa/push-client";
import { unregisterOtherServiceWorkers } from "@/lib/pwa/service-worker-cleanup";

function sendBrandAssetsToWorker(registration: ServiceWorkerRegistration, assets: PwaHeadAssets) {
  registration.active?.postMessage({ type: "SET_BRAND_ASSETS", value: assets });
  navigator.serviceWorker.controller?.postMessage({ type: "SET_BRAND_ASSETS", value: assets });
}

export function PublicPwaManager() {
  useEffect(() => {
    if (isPanelHostname(window.location.hostname)) return;

    const assetsPromise = updatePwaHeadLinks("/api/pwa/public-manifest", "/pwa/public/icon.svg");

    if (!("serviceWorker" in navigator)) return;
    unregisterOtherServiceWorkers("/sw-public.js")
      .then(() => navigator.serviceWorker.register("/sw-public.js", { scope: "/", updateViaCache: "none" }))
      .then(async (registration) => {
        sendBrandAssetsToWorker(registration, await assetsPromise);
        return ensurePushSubscription(registration, "public");
      })
      .catch(() => {});
  }, []);

  return null;
}
