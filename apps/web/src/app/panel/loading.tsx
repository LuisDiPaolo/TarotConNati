import { PanelShell } from "@/components/panel/PanelShell";

export default function PanelLoading() {
  return (
    <PanelShell>
      <section className="surface grid gap-4 p-5 sm:p-6" aria-live="polite" aria-busy="true">
        <div className="h-3 w-28 animate-pulse rounded-full bg-primary/20" />
        <div className="h-8 w-full max-w-sm animate-pulse rounded bg-muted/20" />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="h-24 animate-pulse rounded-[var(--brand-radius)] bg-muted/10" />
          <div className="h-24 animate-pulse rounded-[var(--brand-radius)] bg-muted/10" />
          <div className="h-24 animate-pulse rounded-[var(--brand-radius)] bg-muted/10" />
        </div>
      </section>
    </PanelShell>
  );
}
