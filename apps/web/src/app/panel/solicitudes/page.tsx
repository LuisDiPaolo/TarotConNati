import { ClipboardList, MessageCircle, TimerReset } from "lucide-react";
import { PanelShell } from "@/components/panel/PanelShell";
import { ServiceRequestsTable } from "@/components/panel/ServiceRequestsTable";
import { getPanelServiceRequests } from "@/lib/operations/panel-service-requests";
import { requirePanelSession } from "@/lib/panel/auth";

export default async function PanelServiceRequestsPage() {
  await requirePanelSession();
  const requests = await getPanelServiceRequests();
  const pendingReviewCount = requests.filter((request) => request.status === "pending_review").length;
  const coordinationCount = requests.filter((request) => request.status === "pending_coordination").length;
  const closedCount = requests.filter((request) => request.status === "closed" || request.status === "converted").length;

  return (
    <PanelShell>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Solicitudes</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Turnos sin horario</h1>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="surface p-5">
          <ClipboardList aria-hidden="true" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-lg font-bold">Para revisar</h2>
          <p className="mt-2 text-3xl font-black">{pendingReviewCount}</p>
        </article>
        <article className="surface p-5">
          <MessageCircle aria-hidden="true" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-lg font-bold">En coordinacion</h2>
          <p className="mt-2 text-3xl font-black">{coordinationCount}</p>
        </article>
        <article className="surface p-5">
          <TimerReset aria-hidden="true" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-lg font-bold">Cerradas</h2>
          <p className="mt-2 text-3xl font-black">{closedCount}</p>
        </article>
      </div>

      <ServiceRequestsTable requests={requests} />
    </PanelShell>
  );
}
