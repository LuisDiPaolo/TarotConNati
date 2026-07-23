import { CustomersManager } from "@/components/panel/CustomersManager";
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

      <CustomersManager customers={customers} />
    </PanelShell>
  );
}
