import { MonitorSmartphone } from "lucide-react";
import type { PanelBusinessSettings } from "@/lib/operations/panel-settings.types";

function truncate(value: string, maxLength: number) {
  return value.length <= maxLength ? value : value.slice(0, maxLength).trim();
}

function PreviewCard({
  title,
  appName,
  shortName,
  iconUrl,
  fallbackInitial,
  background,
  accent,
}: {
  title: string;
  appName: string;
  shortName: string;
  iconUrl: string;
  fallbackInitial: string;
  background: string;
  accent: string;
}) {
  return (
    <article className="grid gap-4 rounded-lg border border-slate-200 bg-white/60 p-4 dark:border-neutral-700 dark:bg-neutral-900/50">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] text-lg font-black text-white shadow-sm" style={{ background }}>
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="h-full w-full object-cover" src={iconUrl} />
          ) : fallbackInitial}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">{title}</p>
          <h3 className="truncate text-base font-black">{appName}</h3>
          <p className="truncate text-sm text-muted">{shortName}</p>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-neutral-700 dark:bg-neutral-950">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs text-muted dark:border-neutral-800">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <span className="ml-2 truncate">{appName}</span>
        </div>
        <div className="mt-3 grid gap-2">
          <div className="h-2 w-24 rounded-full" style={{ background: accent }} />
          <div className="h-2 w-3/4 rounded-full bg-slate-200 dark:bg-neutral-800" />
          <div className="h-2 w-1/2 rounded-full bg-slate-200 dark:bg-neutral-800" />
        </div>
      </div>
    </article>
  );
}

export function PwaBrandPreview({ business }: { business: PanelBusinessSettings | null }) {
  if (!business) return null;

  const publicAppName = business.publicAppName || business.name;
  const panelAppName = business.panelAppName || `${business.name} - Panel`;
  const publicShortName = business.publicShortName || truncate(business.name, 24);
  const panelShortName = business.panelShortName || `Panel ${truncate(business.name, 18)}`;
  const initial = business.name.trim().charAt(0).toUpperCase() || "T";

  return (
    <section className="surface grid gap-4 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <MonitorSmartphone aria-hidden="true" className="h-5 w-5 text-accent" />
        <div>
          <h2 className="text-xl font-black">Preview PWA y navegador</h2>
          <p className="text-sm text-muted">Mismo icono de app para instalacion y favicon desktop.</p>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <PreviewCard
          title="Publica"
          appName={publicAppName}
          shortName={publicShortName}
          iconUrl={business.publicAppIconUrl}
          fallbackInitial={initial}
          background={business.themeBackground}
          accent={business.brandAccent}
        />
        <PreviewCard
          title="Panel"
          appName={panelAppName}
          shortName={panelShortName}
          iconUrl={business.panelAppIconUrl}
          fallbackInitial={initial}
          background={business.brandPrimary}
          accent={business.brandAccent}
        />
      </div>
    </section>
  );
}
