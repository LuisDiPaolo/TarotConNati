import { Suspense } from "react";
import { PanelLoginForm } from "@/components/panel/PanelLoginForm";

export default function PanelLoginPage() {
  return (
    <main className="panel-shell flex items-center justify-center">
      <section className="surface w-full max-w-md p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Acceso panel</p>
        <h1 className="mt-3 text-3xl font-black">Login del negocio</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          El acceso operativo usa Supabase Auth y se valida tambien del lado del servidor antes de mostrar el panel.
        </p>
        <Suspense fallback={<p className="mt-6 text-sm text-muted">Cargando acceso...</p>}>
          <PanelLoginForm />
        </Suspense>
      </section>
    </main>
  );
}
