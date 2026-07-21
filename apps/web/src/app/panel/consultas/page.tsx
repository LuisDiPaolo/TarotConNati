import { Archive, CalendarCheck2, Inbox, MessageCircle } from "lucide-react";
import { PanelFeatureToggle } from "@/components/panel/PanelFeatureToggle";
import { PanelShell } from "@/components/panel/PanelShell";
import { InquiriesTable } from "@/components/panel/InquiriesTable";
import { getPanelInquiries } from "@/lib/operations/panel-inquiries";
import { getPanelServices } from "@/lib/operations/panel-settings";
import { requirePanelSession } from "@/lib/panel/auth";

export default async function PanelInquiriesPage() {
  await requirePanelSession();
  const [{ enabled, inquiries }, services] = await Promise.all([getPanelInquiries(), getPanelServices()]);
  const newCount = inquiries.filter((inquiry) => inquiry.status === "new").length;
  const whatsappCount = inquiries.filter((inquiry) => inquiry.status === "answered_whatsapp").length;
  const convertedCount = inquiries.filter((inquiry) => inquiry.status === "converted" || inquiry.appointmentId).length;
  const archivedCount = inquiries.filter((inquiry) => inquiry.status === "archived").length;

  return (
    <PanelShell>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Consultas</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Bandeja de contacto</h1>
        </div>
        <PanelFeatureToggle enabled={enabled} featureKey="inquiries_enabled" label="Consultas" />
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <article className="surface p-5">
          <Inbox aria-hidden="true" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-lg font-bold">Nuevas</h2>
          <p className="mt-2 text-3xl font-black">{newCount}</p>
        </article>
        <article className="surface p-5">
          <MessageCircle aria-hidden="true" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-lg font-bold">WhatsApp</h2>
          <p className="mt-2 text-3xl font-black">{whatsappCount}</p>
        </article>
        <article className="surface p-5">
          <CalendarCheck2 aria-hidden="true" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-lg font-bold">Turnos creados</h2>
          <p className="mt-2 text-3xl font-black">{convertedCount}</p>
        </article>
        <article className="surface p-5">
          <Archive aria-hidden="true" className="h-6 w-6 text-accent" />
          <h2 className="mt-4 text-lg font-bold">Archivadas</h2>
          <p className="mt-2 text-3xl font-black">{archivedCount}</p>
        </article>
      </div>

      <InquiriesTable inquiries={inquiries} services={services} />
    </PanelShell>
  );
}
