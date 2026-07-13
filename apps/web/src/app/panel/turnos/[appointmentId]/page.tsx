import { notFound } from "next/navigation";
import { PanelShell } from "@/components/panel/PanelShell";
import { getPanelAppointmentDetail } from "@/lib/operations/panel-appointments";
import { requirePanelSession } from "@/lib/panel/auth";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default async function PanelAppointmentDetailPage({ params }: { params: Promise<{ appointmentId: string }> }) {
  await requirePanelSession();
  const { appointmentId } = await params;
  const appointment = await getPanelAppointmentDetail(appointmentId);
  if (!appointment) notFound();

  return (
    <PanelShell>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Turno</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">{appointment.serviceName}</h1>
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="surface p-5">
          <h2 className="text-lg font-bold">Resumen</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="font-semibold">Horario</dt><dd>{formatDate(appointment.startsAt)}</dd></div>
            <div><dt className="font-semibold">Estado</dt><dd>{appointment.status}</dd></div>
            <div><dt className="font-semibold">Pago</dt><dd>{appointment.paymentAmount} · {appointment.paymentStatus}</dd></div>
            <div><dt className="font-semibold">Notas</dt><dd>{appointment.notes || "-"}</dd></div>
          </dl>
        </article>
        <article className="surface p-5">
          <h2 className="text-lg font-bold">Cliente</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="font-semibold">Nombre</dt><dd>{appointment.customerName}</dd></div>
            <div><dt className="font-semibold">Telefono</dt><dd>{appointment.customerPhone || "-"}</dd></div>
            <div><dt className="font-semibold">Email</dt><dd>{appointment.customerEmail || "-"}</dd></div>
          </dl>
        </article>
      </section>

      <section className="surface p-5">
        <h2 className="text-lg font-bold">Respuestas</h2>
        <div className="mt-4 grid gap-4">
          {appointment.intakeResponses.map((response, responseIndex) => (
            <article className="rounded-md border border-slate-200 p-4 dark:border-white/10" key={`${response.formName}-${responseIndex}`}>
              <h3 className="font-bold">{response.formName}</h3>
              <dl className="mt-3 grid gap-3 text-sm">
                {response.answers.map((answer, answerIndex) => (
                  <div key={`${answer.label}-${answerIndex}`}>
                    <dt className="font-semibold">{answer.label}</dt>
                    <dd className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{answer.value}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
          {appointment.intakeResponses.length === 0 ? <p className="text-sm text-slate-500">Sin respuestas registradas.</p> : null}
        </div>
      </section>
    </PanelShell>
  );
}
