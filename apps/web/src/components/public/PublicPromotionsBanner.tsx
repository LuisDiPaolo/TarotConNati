import { Tags } from "lucide-react";
import type { PublicPromotion } from "@/lib/operations/booking.types";

function formatValidityLabel(promotion: PublicPromotion) {
  if (promotion.startsAt && promotion.endsAt) return "Promo por tiempo limitado";
  if (promotion.endsAt) return "Disponible por tiempo limitado";
  return "Promo disponible";
}

export function PublicPromotionsBanner({ promotions }: { promotions: PublicPromotion[] }) {
  if (promotions.length === 0) return null;

  return (
    <section className="surface overflow-hidden p-6 sm:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Promociones</p>
          <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">Beneficios activos</h2>
        </div>
        <Tags aria-hidden="true" className="h-7 w-7 text-primary" />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {promotions.map((promotion) => (
          <article className="rounded-lg border border-primary/20 bg-primary/5 p-4 shadow-sm dark:border-primary/30 dark:bg-primary/10" key={promotion.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">{formatValidityLabel(promotion)}</p>
                <h3 className="mt-2 text-lg font-black leading-tight">{promotion.title}</h3>
              </div>
              <span className="shrink-0 rounded-full bg-primary px-3 py-1 text-sm font-black text-white shadow-sm">
                {promotion.discountLabel}
              </span>
            </div>
            {promotion.description ? <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{promotion.description}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
