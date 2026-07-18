"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { FeatureKey } from "@/shared";

type PanelFeatureToggleProps = {
  featureKey: FeatureKey;
  label: string;
  enabled: boolean;
};

export function PanelFeatureToggle({ featureKey, label, enabled }: PanelFeatureToggleProps) {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setIsEnabled(enabled);
  }, [enabled]);

  async function updateFeature(nextEnabled: boolean) {
    if (isSaving || isPending) return;
    setError(null);
    setIsSaving(true);
    setIsEnabled(nextEnabled);

    const response = await fetch("/api/panel/features", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featureKey, enabled: nextEnabled }),
    }).catch(() => null);

    if (!response?.ok) {
      setIsEnabled(!nextEnabled);
      setError("No se pudo guardar.");
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    startTransition(() => router.refresh());
  }

  const statusText = isEnabled ? "Activo" : "Inactivo";
  const actionText = isEnabled ? "Desactivar" : "Activar";

  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-white/85 px-3 py-2.5 shadow-sm dark:bg-white/[0.04] sm:min-w-72">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-black">{label}</p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-black ${isEnabled ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-red-500/10 text-red-700 dark:text-red-300"}`}
          >
            {statusText}
          </span>
        </div>
        {error ? <p className="mt-1 text-xs font-bold text-red-500">{error}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {isSaving || isPending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-muted" /> : null}
        <button
          aria-busy={isSaving || isPending}
          aria-checked={isEnabled}
          aria-label={`${actionText} ${label}`}
          className={`relative h-7 w-12 rounded-full shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${isEnabled ? "bg-emerald-500 focus-visible:ring-emerald-500" : "bg-red-500 focus-visible:ring-red-500"}`}
          disabled={isSaving || isPending}
          onClick={() => updateFeature(!isEnabled)}
          role="switch"
          title={`${label}: ${statusText}`}
          type="button"
        >
          <span
            aria-hidden="true"
            className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform ${isEnabled ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>
    </div>
  );
}
