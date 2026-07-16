import { ArrowRight, Store } from "lucide-react";
import Link from "next/link";

export function PanelSetupRequired({
  title = "Primero crea el negocio",
  text = "Antes de cargar turnos, servicios o agenda, completa los datos basicos del negocio. No hace falta configurar nada tecnico.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="surface grid gap-4 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Store aria-hidden="true" className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-xl font-black">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{text}</p>
        </div>
      </div>
      <div>
        <Link className="primary-action inline-flex" href="/configuracion">
          Completar negocio
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
