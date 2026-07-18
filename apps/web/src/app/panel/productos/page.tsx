import { Package } from "lucide-react";
import { PanelShell } from "@/components/panel/PanelShell";
import { PanelSetupRequired } from "@/components/panel/PanelSetupRequired";
import { ProductsManager } from "@/components/panel/ProductsManager";
import { getPanelBusinessSettings } from "@/lib/operations/panel-settings";
import { getPanelProducts } from "@/lib/operations/panel-products";
import { requirePanelSession } from "@/lib/panel/auth";

export default async function PanelProductsPage() {
  await requirePanelSession();
  const business = await getPanelBusinessSettings();
  const { enabled, products, orders } = business ? await getPanelProducts() : { enabled: false, products: [], orders: [] };
  const activeCount = products.filter((product) => product.active).length;
  const paidCount = orders.filter((order) => order.status === "paid").length;

  return (
    <PanelShell>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Comercio</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Productos</h1>
        </div>
      </header>

      {!business ? (
        <PanelSetupRequired text="Crea el negocio para poder cargar productos que van a aparecer en la pagina publica." />
      ) : enabled ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="surface p-5">
              <Package aria-hidden="true" className="h-6 w-6 text-accent" />
              <h2 className="mt-4 text-lg font-bold">Productos</h2>
              <p className="mt-2 text-3xl font-black">{products.length}</p>
            </article>
            <article className="surface p-5">
              <Package aria-hidden="true" className="h-6 w-6 text-accent" />
              <h2 className="mt-4 text-lg font-bold">Publicados</h2>
              <p className="mt-2 text-3xl font-black">{activeCount}</p>
            </article>
            <article className="surface p-5">
              <Package aria-hidden="true" className="h-6 w-6 text-accent" />
              <h2 className="mt-4 text-lg font-bold">Compras pagadas</h2>
              <p className="mt-2 text-3xl font-black">{paidCount}</p>
            </article>
          </div>

          <ProductsManager products={products} orders={orders} />
        </>
      ) : (
        <section className="surface p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Modulo no habilitado</p>
          <h2 className="mt-3 text-2xl font-black">Productos simples</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Este negocio todavia no tiene activo el modulo de productos. Cuando se habilite, vas a poder vender productos con pago total y retiro en el negocio.
          </p>
        </section>
      )}
    </PanelShell>
  );
}
