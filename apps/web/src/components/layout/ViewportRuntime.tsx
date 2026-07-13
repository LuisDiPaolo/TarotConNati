"use client";

import { useEffect } from "react";

function resolveDisplayMode() {
  if (window.matchMedia("(display-mode: standalone)").matches) return "standalone";
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone) return "standalone";
  return "browser";
}

function resolveSurfaceMode() {
  return window.matchMedia("(pointer: coarse)").matches ? "touch" : "desktop";
}

export function ViewportRuntime() {
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    let rafId: number | null = null;
    let stableTimer: number | null = null;
    let keyboardCloseTimers: number[] = [];
    let previousKeyboardOpen: boolean | null = null;

    function syncViewport() {
      const displayMode = resolveDisplayMode();
      const surfaceMode = resolveSurfaceMode();
      const viewport = window.visualViewport;
      const rawHeight = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const keyboardInset = surfaceMode === "touch" ? Math.max(0, window.innerHeight - rawHeight - offsetTop) : 0;
      const keyboardOpen = keyboardInset > 24;
      const viewportHeight = displayMode !== "browser" && surfaceMode === "touch" && !keyboardOpen
        ? Math.max(rawHeight, window.innerHeight)
        : rawHeight;

      root.dataset.displayMode = displayMode;
      root.dataset.surfaceMode = surfaceMode;
      root.dataset.keyboardOpen = keyboardOpen ? "true" : "false";
      body.dataset.displayMode = displayMode;
      body.dataset.surfaceMode = surfaceMode;
      body.dataset.keyboardOpen = keyboardOpen ? "true" : "false";

      root.style.setProperty("--app-height", `${viewportHeight}px`);
      root.style.setProperty("--app-width", `${window.innerWidth}px`);
      root.style.setProperty("--app-keyboard-inset", `${keyboardInset}px`);
      root.style.setProperty("--app-viewport-offset-top", `${offsetTop}px`);

      if (previousKeyboardOpen === true && !keyboardOpen && displayMode !== "browser" && surfaceMode === "touch") {
        keyboardCloseTimers.forEach((timer) => window.clearTimeout(timer));
        keyboardCloseTimers = [150, 400, 800].map((delay) => window.setTimeout(syncViewport, delay));
      }
      previousKeyboardOpen = keyboardOpen;
    }

    function scheduleSync() {
      syncViewport();
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        syncViewport();
      });
      if (stableTimer !== null) window.clearTimeout(stableTimer);
      stableTimer = window.setTimeout(syncViewport, 300);
    }

    scheduleSync();
    const standaloneMedia = window.matchMedia("(display-mode: standalone)");
    const minimalUiMedia = window.matchMedia("(display-mode: minimal-ui)");

    standaloneMedia.addEventListener("change", scheduleSync);
    minimalUiMedia.addEventListener("change", scheduleSync);
    window.addEventListener("resize", scheduleSync);
    window.addEventListener("orientationchange", scheduleSync);
    window.addEventListener("focus", syncViewport);
    window.addEventListener("blur", syncViewport);
    window.addEventListener("pageshow", scheduleSync);
    document.addEventListener("focusin", syncViewport);
    document.addEventListener("focusout", scheduleSync);
    window.visualViewport?.addEventListener("resize", scheduleSync);
    window.visualViewport?.addEventListener("scroll", syncViewport);

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (stableTimer !== null) window.clearTimeout(stableTimer);
      keyboardCloseTimers.forEach((timer) => window.clearTimeout(timer));
      standaloneMedia.removeEventListener("change", scheduleSync);
      minimalUiMedia.removeEventListener("change", scheduleSync);
      window.removeEventListener("resize", scheduleSync);
      window.removeEventListener("orientationchange", scheduleSync);
      window.removeEventListener("focus", syncViewport);
      window.removeEventListener("blur", syncViewport);
      window.removeEventListener("pageshow", scheduleSync);
      document.removeEventListener("focusin", syncViewport);
      document.removeEventListener("focusout", scheduleSync);
      window.visualViewport?.removeEventListener("resize", scheduleSync);
      window.visualViewport?.removeEventListener("scroll", syncViewport);
    };
  }, []);

  return null;
}
