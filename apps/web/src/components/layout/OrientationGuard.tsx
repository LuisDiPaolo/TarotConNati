"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

function shouldShowOrientationGuard() {
  if (typeof window === "undefined") return false;

  const isLandscape = window.innerWidth > window.innerHeight;
  const isTouchLike = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const isMobileWidth = window.innerWidth < 1024;

  return isLandscape && isTouchLike && isMobileWidth;
}

export function OrientationGuard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function sync() {
      setVisible(shouldShowOrientationGuard());
    }

    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    window.visualViewport?.addEventListener("resize", sync);
    try {
      screen.orientation?.addEventListener("change", sync);
    } catch {
      // Resize and visualViewport cover older Safari.
    }

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.visualViewport?.removeEventListener("resize", sync);
      try {
        screen.orientation?.removeEventListener("change", sync);
      } catch {
        // Resize and visualViewport cover older Safari.
      }
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-label="Gira el dispositivo"
      aria-modal="true"
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-black px-6"
      role="dialog"
      style={{ minHeight: "var(--app-height, 100dvh)", touchAction: "none" }}
    >
      <Image
        alt="Gira el dispositivo. La experiencia esta optimizada para modo vertical."
        className="max-h-[76vh] w-[min(86vw,760px)] object-contain"
        draggable={false}
        height={520}
        priority
        src="/orientation/rotate-device.svg"
        width={760}
      />
    </div>
  );
}
