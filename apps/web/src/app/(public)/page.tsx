import { CalendarDays, Clock, CreditCard } from "lucide-react";
import { headers } from "next/headers";
import { ReservationForm } from "@/components/public/ReservationForm";
import { resolveBusinessForHostname } from "@/lib/business/resolve";
import { getPublicBookingData } from "@/lib/operations/booking";
import { buildBrandStyle } from "@/lib/theme/brand-style";

export const dynamic = "force-dynamic";

export default async function PublicHomePage() {
  const headerStore = await headers();
  const business = await resolveBusinessForHostname(headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "");
  const bookingData = business ? await getPublicBookingData(business) : null;

  if (!bookingData) {
    return (
      <main className="app-screen flex items-center justify-center py-10">
        <section className="surface w-full max-w-xl p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Sin configuracion</p>
          <h1 className="mt-3 text-3xl font-black">No se encontro el negocio</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">Revisa dominio, seed o variables de Supabase.</p>
        </section>
      </main>
    );
  }

  const { business: publicBusiness, services, slotsByService, intakeFormsByService } = bookingData;
  const lightLogoUrl = publicBusiness.logoLightUrl || publicBusiness.logoUrl || publicBusiness.publicAppIconUrl;
  const darkLogoUrl = publicBusiness.logoDarkUrl || publicBusiness.logoUrl || publicBusiness.publicAppIconUrl;
  const hasLogo = Boolean(lightLogoUrl || darkLogoUrl);

  return (
    <main className="app-screen py-8 sm:py-12" style={buildBrandStyle(publicBusiness)}>
      <section className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Reservas online</p>
          {hasLogo ? (
            <>
              <h1 className="sr-only">{publicBusiness.name}</h1>
              <div className="mt-5 flex min-h-[120px] w-full max-w-xl items-center sm:min-h-[150px] lg:min-h-[180px]">
                {lightLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="brand-logo-light max-h-[180px] w-auto max-w-full object-contain object-left" src={lightLogoUrl} />
                ) : null}
                {darkLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="brand-logo-dark hidden max-h-[180px] w-auto max-w-full object-contain object-left" src={darkLogoUrl} />
                ) : null}
              </div>
            </>
          ) : (
            <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">{publicBusiness.name}</h1>
          )}
          {publicBusiness.description ? (
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">{publicBusiness.description}</p>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="surface p-5">
              <CalendarDays aria-hidden="true" className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-lg font-bold">Servicios</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{services.length} opciones activas.</p>
            </article>
            <article className="surface p-5">
              <Clock aria-hidden="true" className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-lg font-bold">Horarios</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Disponibilidad calculada en {publicBusiness.timezone}.</p>
            </article>
            <article className="surface p-5">
              <CreditCard aria-hidden="true" className="h-6 w-6 text-primary" />
              <h2 className="mt-4 text-lg font-bold">Señas</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Mercado Pago confirma el turno por webhook.</p>
            </article>
          </div>
        </div>

        <ReservationForm services={services} slotsByService={slotsByService} intakeFormsByService={intakeFormsByService} />
      </section>
    </main>
  );
}
