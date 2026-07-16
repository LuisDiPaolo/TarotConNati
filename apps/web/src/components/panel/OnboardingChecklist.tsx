import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getConfiguredPublicOrigin } from "@/lib/business/instance";
import type { PanelBusinessSettings } from "@/lib/operations/panel-settings.types";

type ChecklistItem = {
  label: string;
  copy: string;
  done: boolean;
  href?: string;
  action?: string;
};

function ChecklistRow({ item }: { item: ChecklistItem }) {
  const Icon = item.done ? CheckCircle2 : Circle;
  const internalHref = item.href?.startsWith("/");

  return (
    <li className="flex min-h-20 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/60 px-3 py-3 text-sm dark:border-neutral-700 dark:bg-neutral-900/40">
      <span className="flex min-w-0 items-start gap-3">
        <Icon aria-hidden="true" className={item.done ? "mt-0.5 h-5 w-5 shrink-0 text-emerald-600" : "mt-0.5 h-5 w-5 shrink-0 text-muted"} />
        <span>
          <span className="block font-black">{item.label}</span>
          <span className="mt-1 block leading-5 text-muted">{item.copy}</span>
        </span>
      </span>
      {internalHref && item.href ? (
        <Link className="secondary-action shrink-0" href={item.href} title={item.label}>
          {item.action ?? "Abrir"}
          <ExternalLink aria-hidden="true" className="h-4 w-4" />
        </Link>
      ) : item.href ? (
        <a className="secondary-action shrink-0" href={item.href} title={item.label}>
          {item.action ?? "Abrir"}
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
  const hasBrandAssets = Boolean(business?.publicAppIconUrl || business?.logoUrl || business?.logoLightUrl || business?.logoDarkUrl);
  const publicPreviewHref = getConfiguredPublicOrigin() || "/";
  const items: ChecklistItem[] = [
    {
      label: "Crear negocio",
      copy: business ? "El panel ya esta asociado a un negocio." : "Completa nombre, WhatsApp y presentacion para crear la base operativa.",
      done: Boolean(business),
      href: "/configuracion",
      action: business ? "Revisar" : "Completar",
    },
    {
      label: "Cargar servicios",
      copy: "Agrega lo que el cliente puede reservar o solicitar desde la pagina publica.",
      done: servicesCount > 0,
      href: "/servicios",
      action: servicesCount > 0 ? "Editar" : "Cargar",
    },
    {
      label: "Definir disponibilidad",
      copy: "Configura horarios si algun servicio toma turnos con agenda.",
      done: schedulesCount > 0 || servicesCount === 0,
      href: "/agenda",
      action: schedulesCount > 0 ? "Editar" : "Configurar",
    },
    {
      label: "Preguntas al cliente",
      copy: "Opcional: datos extra que el cliente completa al reservar.",
      done: formsCount > 0,
      href: "/formularios",
      action: formsCount > 0 ? "Editar" : "Agregar",
    },
    {
      label: "Logo e imagen de app",
      copy: "Opcional, pero recomendado antes de compartir la app con clientes.",
      done: hasBrandAssets,
      href: "/configuracion",
      action: hasBrandAssets ? "Revisar" : "Cargar",
    },
    {
      label: "Probar reserva real",
      copy: "Abrir la web publica y crear una reserva o solicitud de prueba.",
      done: false,
      href: publicPreviewHref,
      action: "Probar",
    },
  ];
  const completedCount = items.filter((item) => item.done).length;

  return (
    <section className="surface grid gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Asistente de puesta en marcha</h2>
          <p className="text-sm text-muted">Orden recomendado para pasar de una base limpia a una pagina publica usable.</p>
        </div>
        <p className="text-sm font-black text-accent">{completedCount}/{items.length}</p>
      </div>
      <ul className="grid gap-2">
        {items.map((item) => <ChecklistRow item={item} key={item.label} />)}
      </ul>
    </section>
  );
}
