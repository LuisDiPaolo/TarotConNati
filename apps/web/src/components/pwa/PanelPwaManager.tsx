"use client";

import { useEffect } from "react";
import { isPanelHostname } from "@/lib/pwa/host";
import { ensurePushSubscription } from "@/lib/pwa/push-client";
import { unregisterLegacyServiceWorkers } from "@/lib/pwa/service-worker-cleanup";

function replaceHeadLink(rel: string, href: string, attributes: Record<string, string> = {}) {
  document.head.querySelectorAll<HTMLLinkElement>(`link[rel="${rel}"]`).forEach((link) => link.remove());
  const link = document.createElement("link");
  link.rel = rel;
  link.href = href;
  for (const [name, value] of Object.entries(attributes)) link.setAttribute(name, value);
  document.head.appendChild(link);
}

export function PanelPwaManager() {
  useEffect(() => {
    if (!isPanelHostname(window.location.hostname) && !window.location.pathname.startsWith("/panel")) return;

    replaceHeadLink("manifest", "/api/pwa/panel-manifest");
    replaceHeadLink("icon", "/pwa/panel/icon.svg", { type: "image/svg+xml" });
    replaceHeadLink("apple-touch-icon", "/pwa/panel/icon.svg");

    if (!("serviceWorker" in navigator)) return;
    unregisterLegacyServiceWorkers()
      .then(() => navigator.serviceWorker.register("/sw-panel.js", { scope: "/", updateViaCache: "none" }))
      .then((registration) => ensurePushSubscription(registration, "panel"))
      .catch(() => {});
  }, []);

  return null;
}
