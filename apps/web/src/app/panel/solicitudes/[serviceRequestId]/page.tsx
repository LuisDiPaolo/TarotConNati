import { notFound } from "next/navigation";
import { PanelShell } from "@/components/panel/PanelShell";
import { getPanelServiceRequestDetail } from "@/lib/operations/panel-service-requests";
import { requirePanelSession } from "@/lib/panel/auth";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default async function PanelServiceRequestDetailPage({ params }: { params: Promise<{ serviceRequestId: string }> }) {
  await requirePanelSession();
  const { serviceRequestId } = await params;
  const request = await getPanelServiceRequestDetail(serviceRequestId);
  if (!request) notFound();

  return (
    <PanelShell>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Solicitud</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">{request.serviceName}</h1>
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="surface p-5">
          <h2 className="text-lg font-bold">Resumen</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="font-semibold">Ingreso</dt><dd>{formatDate(request.createdAt)}</dd></div>
            <div><dt className="font-semibold">Estado</dt><dd>{request.status}</dd></div>
            <div><dt className="font-semibold">Preferencia</dt><dd>{request.preferredDate || "Sin fecha"} · {request.preferredWindow || "Sin franja"}</dd></div>
            <div><dt className="font-semibold">Notas cliente</dt><dd>{request.customerNotes || "-"}</dd></div>
            <div><dt className="font-semibold">Notas admin</dt><dd>{request.adminNotes || "-"}</dd></div>
          </dl>
        </article>
        <article className="surface p-5">
          <h2 className="text-lg font-bold">Cliente</h2>
          <dl className="mt-4 grid gap-3 text-sm">
            <div><dt className="font-semibold">Nombre</dt><dd>{request.customerName}</dd></div>
            <div><dt className="font-semibold">Telefono</dt><dd>{request.customerPhone || "-"}</dd></div>
            <div><dt className="font-semibold">Email</dt><dd>{request.customerEmail || "-"}</dd></div>
            <div><dt className="font-semibold">Canal</dt><dd>{request.contactChannel}</dd></div>
          </dl>
        </article>
      </section>

      <section className="surface p-5">
        <h2 className="text-lg font-bold">Respuestas</h2>
        <div className="mt-4 grid gap-4">
          {request.intakeResponses.map((response, responseIndex) => (
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
          {request.intakeResponses.length === 0 ? <p className="text-sm text-slate-500">Sin respuestas registradas.</p> : null}
        </div>
      </section>
    </PanelShell>
  );
}
