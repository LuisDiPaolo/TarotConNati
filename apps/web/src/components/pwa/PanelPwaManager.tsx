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

export function PanelPwaManager() {
  useEffect(() => {
    if (!isPanelHostname(window.location.hostname)) return;

    const assetsPromise = updatePwaHeadLinks("/api/pwa/panel-manifest", "/pwa/panel/icon.svg");

    if (!("serviceWorker" in navigator)) return;
    unregisterOtherServiceWorkers("/sw-panel.js")
      .then(() => navigator.serviceWorker.register("/sw-panel.js", { scope: "/", updateViaCache: "none" }))
      .then(async (registration) => {
        sendBrandAssetsToWorker(registration, await assetsPromise);
        return ensurePushSubscription(registration, "panel");
      })
      .catch(() => {});
  }, []);

  return null;
}
