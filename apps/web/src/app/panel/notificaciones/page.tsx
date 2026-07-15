import { Bell, Send } from "lucide-react";
import { PanelShell } from "@/components/panel/PanelShell";
import { getPanelNotificationRecords } from "@/lib/operations/panel-notifications";
import { requirePanelSession } from "@/lib/panel/auth";

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function PanelNotificationsPage() {
  await requirePanelSession();
  const records = await getPanelNotificationRecords();

  return (
    <PanelShell>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Notificaciones</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">Avisos enviados</h1>
      </header>

      <section className="surface grid gap-4 p-5">
        {records.length > 0 ? records.map((record) => (
          <article className="flex gap-3 rounded-lg border border-slate-200/80 p-4 dark:border-white/10" key={record.id}>
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Bell aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-black">{record.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{record.body}</p>
                </div>
                <span className="rounded-full bg-slate-950/5 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {record.surface === "public" ? "Cliente" : "Panel"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>{formatDate(record.createdAt)}</span>
                <span className="inline-flex items-center gap-1"><Send aria-hidden="true" className="h-3.5 w-3.5" /> {record.deliveredCount} enviados</span>
                {record.failedCount > 0 ? <span>{record.failedCount} fallidos</span> : null}
              </div>
            </div>
          </article>
        )) : (
          <div className="py-8 text-center">
            <Bell aria-hidden="true" className="mx-auto h-8 w-8 text-accent" />
            <h2 className="mt-3 text-lg font-black">Todavia no hay avisos</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">Cuando se envien notificaciones push al panel o a clientes, van a quedar listadas aca.</p>
          </div>
        )}
      </section>
    </PanelShell>
  );
}
