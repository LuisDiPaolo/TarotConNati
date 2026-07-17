import { IntakeFormsManager } from "@/components/panel/IntakeFormsManager";
import { PanelShell } from "@/components/panel/PanelShell";
import { PanelSetupRequired } from "@/components/panel/PanelSetupRequired";
import { getPanelBusinessSettings, getPanelIntakeForms, getPanelServices } from "@/lib/operations/panel-settings";
import { requirePanelSession } from "@/lib/panel/auth";

export default async function PanelIntakeFormsPage() {
  await requirePanelSession();
  const business = await getPanelBusinessSettings();
  const [forms, services] = business ? await Promise.all([getPanelIntakeForms(), getPanelServices()]) : [[], []];

  return (
    <PanelShell>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Datos de reserva</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">Formularios</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Configura preguntas adicionales para que lleguen junto con la reserva al panel.
        </p>
      </header>

      {business ? (
        <IntakeFormsManager forms={forms} services={services} />
      ) : (
        <PanelSetupRequired text="Crea el negocio y despues carga las preguntas que el cliente debera responder al reservar." />
      )}
    </PanelShell>
  );
}
