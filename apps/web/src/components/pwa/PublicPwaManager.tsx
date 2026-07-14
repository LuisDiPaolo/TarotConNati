"use client";

import { useEffect } from "react";
import { updatePwaHeadLinks } from "@/lib/pwa/head-links";
import { isPanelHostname } from "@/lib/pwa/host";
import { ensurePushSubscription } from "@/lib/pwa/push-client";
import { unregisterLegacyServiceWorkers } from "@/lib/pwa/service-worker-cleanup";

export function PublicPwaManager() {
  useEffect(() => {
    if (isPanelHostname(window.location.hostname)) return;

    void updatePwaHeadLinks("/api/pwa/public-manifest", "/pwa/public/icon.svg");

    if (!("serviceWorker" in navigator)) return;
    unregisterLegacyServiceWorkers()
      .then(() => navigator.serviceWorker.register("/sw-public.js", { scope: "/", updateViaCache: "none" }))
      .then((registration) => ensurePushSubscription(registration, "public"))
      .catch(() => {});
  }, []);

  return null;
}
