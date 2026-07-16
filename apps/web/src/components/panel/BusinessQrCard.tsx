import { QrCode } from "lucide-react";
import { getConfiguredPublicOrigin } from "@/lib/business/instance";
import type { PanelBusinessSettings } from "@/lib/operations/panel-settings.types";

function normalizePublicUrl(fallbackOrigin: string) {
  return getConfiguredPublicOrigin() || process.env.APP_BASE_URL || fallbackOrigin || "/";
}

export function BusinessQrCard({ business, fallbackOrigin }: { business: PanelBusinessSettings; fallbackOrigin: string }) {
  const publicUrl = normalizePublicUrl(fallbackOrigin);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=12&data=${encodeURIComponent(publicUrl)}`;

  return (
    <section className="surface grid gap-4 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <QrCode aria-hidden="true" className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-black">QR publico</h2>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={`QR de reservas para ${business.name}`} className="h-44 w-44 rounded-lg border border-slate-200 bg-white p-2" src={qrUrl} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted">URL de reservas</p>
          <a className="mt-2 block break-all text-sm font-bold text-primary" href={publicUrl} target="_blank" rel="noreferrer">
            {publicUrl}
          </a>
        </div>
      </div>
    </section>
  );
}
