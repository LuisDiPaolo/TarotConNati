"use client";

import { useEffect } from "react";
import { updatePwaHeadLinks } from "@/lib/pwa/head-links";
import { isPanelHostname } from "@/lib/pwa/host";
import { ensurePushSubscription } from "@/lib/pwa/push-client";
import { unregisterLegacyServiceWorkers } from "@/lib/pwa/service-worker-cleanup";

export function PanelPwaManager() {
  useEffect(() => {
    if (!isPanelHostname(window.location.hostname) && !window.location.pathname.startsWith("/panel")) return;

    void updatePwaHeadLinks("/api/pwa/panel-manifest", "/pwa/panel/icon.svg");

    if (!("serviceWorker" in navigator)) return;
    unregisterLegacyServiceWorkers()
      .then(() => navigator.serviceWorker.register("/sw-panel.js", { scope: "/", updateViaCache: "none" }))
      .then((registration) => ensurePushSubscription(registration, "panel"))
      .catch(() => {});
  }, []);

  return null;
}
