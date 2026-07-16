"use client";

import { RotateCw } from "lucide-react";
import { PanelShell } from "@/components/panel/PanelShell";

export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  void error;

  return (
    <PanelShell>
      <section className="surface grid gap-4 p-5 sm:p-6" role="alert">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Panel</p>
          <h1 className="mt-2 text-2xl font-black">No se pudo cargar esta seccion</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            La navegacion esta activa, pero la seccion no recibio una respuesta valida. Reintenta sin perder la sesion.
          </p>
        </div>
        <button className="primary-action w-full justify-center sm:w-auto" onClick={reset} type="button">
          <RotateCw aria-hidden="true" className="h-4 w-4" />
          Reintentar
        </button>
      </section>
    </PanelShell>
  );
}
