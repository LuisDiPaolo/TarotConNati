import { PanelShell } from "@/components/panel/PanelShell";
import { getPanelCustomers } from "@/lib/operations/panel-customers";
import { requirePanelSession } from "@/lib/panel/auth";

export default async function PanelCustomersPage() {
  await requirePanelSession();
  const customers = await getPanelCustomers();

  return (
    <PanelShell>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Clientes</p>
        <h1 className="mt-2 text-3xl font-black sm:text-5xl">Ficha de clientes</h1>
      </header>

      <div className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Contacto</th>
                <th className="px-4 py-3">Notas</th>
                <th className="px-4 py-3 text-right">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/10">
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-4 py-3 font-semibold">{customer.fullName}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    <p>{customer.phone || "Sin telefono"}</p>
                    <p className="text-xs text-slate-500">{customer.email || "Sin email"}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{customer.notes || "-"}</td>
                  <td className="px-4 py-3 text-right">
                    <a className="primary-action inline-flex" href={`/clientes/${customer.id}`}>Ver ficha</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PanelShell>
  );
}
