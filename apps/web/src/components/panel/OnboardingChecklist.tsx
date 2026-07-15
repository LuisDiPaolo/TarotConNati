import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import type { PanelBusinessSettings } from "@/lib/operations/panel-settings.types";

type ChecklistItem = {
  label: string;
  done: boolean;
  href?: string;
};

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const Icon = item.done ? CheckCircle2 : Circle;

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm font-semibold dark:border-neutral-700 dark:bg-neutral-900/40">
      <span className="flex min-w-0 items-center gap-2">
        <Icon aria-hidden="true" className={item.done ? "h-4 w-4 shrink-0 text-emerald-600" : "h-4 w-4 shrink-0 text-muted"} />
        {item.label}
      </span>
      {item.href ? (
        <a className="icon-action h-8 w-8" href={item.href} title={item.label}>
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
        </a>
      ) : null}
    </li>
  );
}

export function OnboardingChecklist({
  business,
  servicesCount,
  schedulesCount,
  formsCount,
}: {
  business: PanelBusinessSettings | null;
  servicesCount: number;
  schedulesCount: number;
  formsCount: number;
}) {
  const hasBrandAssets = Boolean(business?.publicAppIconUrl && business.panelAppIconUrl && business.maskableIconUrl && business.appleTouchIconUrl);
  const items: ChecklistItem[] = [
    { label: "Negocio creado", done: Boolean(business), href: "/panel/configuracion" },
    { label: "Logo e iconos cargados", done: hasBrandAssets, href: "/panel/configuracion" },
    { label: "Servicios cargados", done: servicesCount > 0, href: "/panel/servicios" },
    { label: "Forma de reserva definida", done: schedulesCount > 0 || servicesCount > 0, href: "/panel/agenda" },
    { label: "Preguntas al cliente cargadas", done: formsCount > 0, href: "/panel/formularios" },
    { label: "Pagos revisados", done: false },
    { label: "Avisos al cliente probados", done: false },
    { label: "Reserva o solicitud de prueba", done: false, href: "/" },
  ];
  const completedCount = items.filter((item) => item.done).length;

  return (
    <section className="surface grid gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Puesta en marcha</h2>
          <p className="text-sm text-muted">Pasos basicos para dejar el negocio listo para recibir reservas.</p>
        </div>
        <p className="text-sm font-black text-accent">{completedCount}/{items.length}</p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => <ChecklistRow item={item} key={item.label} />)}
      </ul>
    </section>
  );
}
