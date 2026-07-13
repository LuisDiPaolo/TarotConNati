import { notFound } from "next/navigation";
import { PanelShell } from "@/components/panel/PanelShell";
import { getPanelCustomerDetail } from "@/lib/operations/panel-customers";
import { requirePanelSession } from "@/lib/panel/auth";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function PanelCustomerDetailPage({ params }: { params: Promise<{ customerId: string }> }) {
  await requirePanelSession();
  const { customerId } = await params;
  const customer = await getPanelCustomerDetail(customerId);
  if (!customer) notFound();

  return (
    <PanelShell>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Cliente</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">{customer.fullName}</h1>
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="surface p-5">
          <h2 className="text-lg font-bold">Datos</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="font-semibold">Telefono</dt><dd className="text-slate-600 dark:text-slate-300">{customer.phone || "-"}</dd></div>
            <div><dt className="font-semibold">Email</dt><dd className="text-slate-600 dark:text-slate-300">{customer.email || "-"}</dd></div>
            <div><dt className="font-semibold">Notas</dt><dd className="text-slate-600 dark:text-slate-300">{customer.notes || "-"}</dd></div>
          </dl>
        </article>

        <article className="surface p-5">
          <h2 className="text-lg font-bold">Turnos</h2>
          <div className="mt-4 grid gap-3">
            {customer.appointments.map((appointment) => (
              <div className="rounded-md border border-slate-200 p-3 text-sm dark:border-white/10" key={appointment.id}>
                <p className="font-semibold">{appointment.serviceName}</p>
                <p className="text-slate-600 dark:text-slate-300">{formatDate(appointment.startsAt)} · {appointment.status}</p>
              </div>
            ))}
            {customer.appointments.length === 0 ? <p className="text-sm text-slate-500">Sin turnos registrados.</p> : null}
          </div>
        </article>
      </section>

      <section className="surface p-5">
        <h2 className="text-lg font-bold">Solicitudes</h2>
        <div className="mt-4 grid gap-3">
          {customer.requests.map((request) => (
            <div className="rounded-md border border-slate-200 p-3 text-sm dark:border-white/10" key={request.id}>
              <p className="font-semibold">{request.serviceName}</p>
              <p className="text-slate-600 dark:text-slate-300">{formatDate(request.createdAt)} · {request.status}</p>
              <p className="text-xs text-slate-500">{request.preferredDate || "Sin fecha"} · {request.preferredWindow || "Sin franja"}</p>
            </div>
          ))}
          {customer.requests.length === 0 ? <p className="text-sm text-slate-500">Sin solicitudes registradas.</p> : null}
        </div>
      </section>
    </PanelShell>
  );
}
