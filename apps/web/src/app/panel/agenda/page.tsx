import { PanelShell } from "@/components/panel/PanelShell";
import { ScheduleManager } from "@/components/panel/ScheduleManager";
import { ScheduleOverridesManager } from "@/components/panel/ScheduleOverridesManager";
import { getPanelScheduleOverrides, getPanelSchedules } from "@/lib/operations/panel-settings";
import { requirePanelSession } from "@/lib/panel/auth";

export default async function PanelSchedulePage() {
  await requirePanelSession();
  const [schedules, overrides] = await Promise.all([
    getPanelSchedules(),
    getPanelScheduleOverrides(),
  ]);

  return (
    <PanelShell>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Agenda</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">Horarios de atencion</h1>
      </header>

      <ScheduleManager schedules={schedules} />
      <ScheduleOverridesManager overrides={overrides} />
    </PanelShell>
  );
}
