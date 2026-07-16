import { BarChart3, CalendarCheck, CreditCard, MessageCircle } from "lucide-react";
import { PanelShell } from "@/components/panel/PanelShell";
import { getPanelReports } from "@/lib/operations/panel-reports";
import { requirePanelSession } from "@/lib/panel/auth";

export default async function PanelReportsPage() {
  await requirePanelSession();
  const reports = await getPanelReports();

  return (
    <PanelShell>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Reportes</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">Resumen operativo</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface p-5">
          <CalendarCheck aria-hidden="true" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-lg font-bold">Turnos</h2>
          <p className="mt-2 text-3xl font-black">{reports.appointments.total}</p>
          <p className="mt-2 text-sm text-slate-500">{reports.appointments.confirmed} confirmados · {reports.appointments.completed} realizados</p>
        </article>
        <article className="surface p-5">
          <MessageCircle aria-hidden="true" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-lg font-bold">Solicitudes</h2>
          <p className="mt-2 text-3xl font-black">{reports.requests.total}</p>
          <p className="mt-2 text-sm text-slate-500">{reports.requests.pendingReview} para revisar · {reports.requests.converted} convertidas</p>
        </article>
        <article className="surface p-5">
          <CreditCard aria-hidden="true" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-lg font-bold">Pagos aprobados</h2>
          <p className="mt-2 text-3xl font-black">{reports.payments.approvedAmount}</p>
          <p className="mt-2 text-sm text-slate-500">{reports.payments.approvedCount} pagos</p>
        </article>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="surface p-5">
          <BarChart3 aria-hidden="true" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-lg font-bold">Estados de turnos</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between"><dt>Pendientes</dt><dd className="font-bold">{reports.appointments.pending}</dd></div>
            <div className="flex justify-between"><dt>Confirmados</dt><dd className="font-bold">{reports.appointments.confirmed}</dd></div>
            <div className="flex justify-between"><dt>Realizados</dt><dd className="font-bold">{reports.appointments.completed}</dd></div>
            <div className="flex justify-between"><dt>Cancelados</dt><dd className="font-bold">{reports.appointments.cancelled}</dd></div>
            <div className="flex justify-between"><dt>Ausentes</dt><dd className="font-bold">{reports.appointments.noShow}</dd></div>
          </dl>
        </article>
        <article className="surface p-5">
          <MessageCircle aria-hidden="true" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-lg font-bold">Estados de solicitudes</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div className="flex justify-between"><dt>Para revisar</dt><dd className="font-bold">{reports.requests.pendingReview}</dd></div>
            <div className="flex justify-between"><dt>En coordinacion</dt><dd className="font-bold">{reports.requests.pendingCoordination}</dd></div>
            <div className="flex justify-between"><dt>Convertidas</dt><dd className="font-bold">{reports.requests.converted}</dd></div>
            <div className="flex justify-between"><dt>Cerradas</dt><dd className="font-bold">{reports.requests.closed}</dd></div>
            <div className="flex justify-between"><dt>Canceladas</dt><dd className="font-bold">{reports.requests.cancelled}</dd></div>
          </dl>
        </article>
      </section>
    </PanelShell>
  );
}
