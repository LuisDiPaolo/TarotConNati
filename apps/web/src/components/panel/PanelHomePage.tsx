import { CalendarCheck, Clock, CreditCard } from "lucide-react";
import { AppointmentsTable } from "@/components/panel/AppointmentsTable";
import { PanelSetupRequired } from "@/components/panel/PanelSetupRequired";
import { PanelShell } from "@/components/panel/PanelShell";
import { getPanelAppointments } from "@/lib/operations/panel-appointments";
import { getPanelBusinessSettings, getPanelServices } from "@/lib/operations/panel-settings";
import { requirePanelSession } from "@/lib/panel/auth";

export async function PanelHomePage() {
  await requirePanelSession();
  const business = await getPanelBusinessSettings();
  const [appointments, services] = business ? await Promise.all([getPanelAppointments(), getPanelServices()]) : [[], []];
  const pendingCount = appointments.filter((appointment) => appointment.status === "pending").length;
  const confirmedCount = appointments.filter((appointment) => appointment.status === "confirmed").length;
  const paidCount = appointments.filter((appointment) => appointment.paymentStatus === "approved").length;

  return (
    <PanelShell>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Panel operativo</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Turnos del negocio</h1>
        </div>
      </header>

      {business ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="surface p-5">
              <Clock aria-hidden="true" className="h-6 w-6 text-accent" />
              <h2 className="mt-4 text-lg font-bold">Pendientes</h2>
              <p className="mt-2 text-3xl font-black">{pendingCount}</p>
            </article>
            <article className="surface p-5">
              <CalendarCheck aria-hidden="true" className="h-6 w-6 text-accent" />
              <h2 className="mt-4 text-lg font-bold">Confirmados</h2>
              <p className="mt-2 text-3xl font-black">{confirmedCount}</p>
            </article>
            <article className="surface p-5">
              <CreditCard aria-hidden="true" className="h-6 w-6 text-accent" />
              <h2 className="mt-4 text-lg font-bold">Pagos aprobados</h2>
              <p className="mt-2 text-3xl font-black">{paidCount}</p>
            </article>
          </div>

          <AppointmentsTable appointments={appointments} services={services} />
        </>
      ) : (
        <PanelSetupRequired text="Completa los datos del negocio para activar turnos, servicios, agenda y formularios desde el panel." />
      )}
    </PanelShell>
  );
}
