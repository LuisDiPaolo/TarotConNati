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

  return (
    <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="mt-1 text-xs font-semibold text-muted">{isEnabled ? "Visible y editable" : "Oculto y bloqueado"}</p>
      </div>
      <div className="flex items-center gap-3">
        {error ? <span className="text-xs font-bold text-red-500">{error}</span> : null}
        {isSaving || isPending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin text-muted" /> : null}
        <button
          aria-checked={isEnabled}
          className={`relative h-8 w-14 rounded-full border transition ${isEnabled ? "border-accent bg-accent" : "border-border bg-muted/20"}`}
          disabled={isSaving || isPending}
          onClick={() => updateFeature(!isEnabled)}
          role="switch"
          type="button"
        >
          <span
            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-lg transition-transform ${isEnabled ? "translate-x-6" : "translate-x-1"}`}
          />
        </button>
      </div>
    </div>
  );
}
