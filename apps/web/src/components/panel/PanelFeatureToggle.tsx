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
    <div className="inline-flex items-center gap-2">
      <div className="leading-tight">
        <p className="whitespace-nowrap text-sm font-bold">{label}</p>
        <p className={`text-xs font-bold ${isEnabled ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-red-300"}`}>{statusText}</p>
        {error ? <p className="mt-1 text-xs font-bold text-red-500">{error}</p> : null}
      </div>
      {isSaving || isPending ? <Loader2 aria-hidden="true" className="h-4 w-4 shrink-0 animate-spin text-muted" /> : null}
      <button
        aria-busy={isSaving || isPending}
        aria-checked={isEnabled}
        aria-label={`${actionText} ${label}`}
        className={`relative h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${isEnabled ? "bg-emerald-500 focus-visible:ring-emerald-500" : "bg-red-500 focus-visible:ring-red-500"}`}
        disabled={isSaving || isPending}
        onClick={() => updateFeature(!isEnabled)}
        role="switch"
        title={`${label}: ${statusText}`}
        type="button"
      >
        <span
          aria-hidden="true"
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${isEnabled ? "translate-x-5" : "translate-x-0"}`}
        />
      </button>
    </div>
  );
}
