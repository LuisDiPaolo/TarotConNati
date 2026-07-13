"use client";

import Image from "next/image";
import { useState } from "react";

export function StudioEquisCredit() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="fixed left-3 z-40 flex items-center gap-2 sm:left-4"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
    >
      <button
        type="button"
        aria-label="Creditos de desarrollo"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="studio-equis-credit-button relative h-10 w-10 overflow-hidden rounded-full border active:scale-95"
        style={{
          background: "rgba(8, 15, 8, 0.72)",
          borderColor: "rgba(255, 255, 255, 0.18)",
          boxShadow: "0 10px 24px rgba(0, 0, 0, 0.28)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <Image
          src="/estudio-equis-logo.png"
          alt="Estudio Equis"
          fill
          sizes="40px"
          className="object-contain p-1.5"
        />
      </button>

      {expanded ? (
        <div
          className="max-w-[190px] rounded-full px-3 py-2 text-[11px] leading-none shadow-lg"
          style={{
            background: "rgba(8, 15, 8, 0.82)",
            border: "1px solid rgba(255, 255, 255, 0.16)",
            color: "rgba(255, 255, 255, 0.78)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
          }}
        >
          Desarrollado por{" "}
          <a
            href="https://www.estudioequis.com.ar"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2"
            style={{ color: "rgb(var(--brand-accent))" }}
          >
            Estudio Equis
          </a>
        </div>
      ) : null}
    </div>
  );
}
