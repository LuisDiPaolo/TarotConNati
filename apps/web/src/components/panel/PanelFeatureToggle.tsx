"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import type { FeatureKey } from "@/shared";

type PanelFeatureToggleProps = {
  featureKey: FeatureKey;
  label: string;
  enabled: boolean;
};

export function PanelFeatureToggle({ featureKey, label, enabled }: PanelFeatureToggleProps) {
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  async function updateFeature(nextEnabled: boolean) {
    if (isSaving) return;

    const previousEnabled = isEnabled;
    setError(null);
    setIsSaving(true);
    setIsEnabled(nextEnabled);

    try {
      const response = await fetch("/api/panel/features", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureKey, enabled: nextEnabled }),
      });

      if (!response.ok) {
        setIsEnabled(previousEnabled);
        setError("No se pudo guardar.");
        return;
      }

      const payload = await response.json().catch(() => null);
      if (typeof payload?.data?.enabled === "boolean") {
        setIsEnabled(payload.data.enabled);
      }
    } catch {
      setIsEnabled(previousEnabled);
      setError("No se pudo guardar.");
    } finally {
      setIsSaving(false);
    }
  }

  const statusText = isEnabled ? "Activo" : "Inactivo";

  return (
    <div className="surface inline-flex items-center gap-3 px-3 py-2 text-sm">
      <div className="grid leading-tight">
        <span className="whitespace-nowrap font-bold">{label}</span>
        <span
          className={`mt-1 w-fit rounded-full px-2 py-0.5 text-[11px] font-black ${isEnabled ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-700 dark:text-red-300"}`}
        >
          {statusText}
        </span>
        {error ? <span className="mt-1 whitespace-nowrap text-xs font-bold text-red-500">{error}</span> : null}
      </div>
      {isSaving ? <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin text-muted" /> : null}
      <button
        aria-busy={isSaving}
        aria-checked={isEnabled}
        aria-label={`${isEnabled ? "Desactivar" : "Activar"} ${label}`}
        className="relative shrink-0 rounded-full border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSaving}
        onClick={() => updateFeature(!isEnabled)}
        role="switch"
        style={{
          width: 56,
          minWidth: 44,
          height: 28,
          minHeight: 28,
          backgroundColor: isEnabled ? "rgb(var(--color-foreground) / 0.10)" : "rgb(var(--color-muted) / 0.10)",
          borderColor: isEnabled ? "rgb(var(--color-foreground) / 0.22)" : "rgb(var(--color-border))",
          borderWidth: 1.5,
        }}
        type="button"
      >
        <span
          aria-hidden="true"
          className="absolute rounded-full transition-all"
          style={{
            left: isEnabled ? "calc(100% - 22px)" : 2,
            top: 2,
            width: 20,
            height: 20,
            backgroundColor: isEnabled ? "rgb(var(--color-foreground))" : "rgb(var(--color-muted) / 0.58)",
          }}
        />
      </button>
    </div>
  );
}
