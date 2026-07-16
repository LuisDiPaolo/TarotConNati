import { CalendarDays, Clock, CreditCard } from "lucide-react";
import { headers } from "next/headers";
import { PublicTabbedExperience } from "@/components/public/PublicTabbedExperience";
import { StudioEquisCredit } from "@/components/public/StudioEquisCredit";
import { getConfiguredPanelOrigin } from "@/lib/business/instance";
import { resolveBusinessForHostname } from "@/lib/business/resolve";
import { getPublicBookingData } from "@/lib/operations/booking";
import { buildBrandStyle } from "@/lib/theme/brand-style";

export const dynamic = "force-dynamic";

export default async function PublicHomePage() {
  const headerStore = await headers();
  const business = await resolveBusinessForHostname(headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "");
  const bookingData = business ? await getPublicBookingData(business) : null;

  if (!bookingData) {
    const panelOrigin = getConfiguredPanelOrigin();
    const rawHost = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";
    const fallbackPanelOrigin = `https://panel.${rawHost.replace(/^www\./, "")}`;
    const panelSetupHref = `${panelOrigin || fallbackPanelOrigin}/configuracion`;

    return (
      <>
        <main className="app-screen flex items-center justify-center py-10">
          <section className="surface w-full max-w-xl p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Reservas no disponibles</p>
            <h1 className="mt-3 text-3xl font-black">El negocio todavia no esta configurado</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-300">Si sos el administrador, entra al panel para crear el negocio y cargar servicios. Si sos cliente, intenta nuevamente mas tarde.</p>
            <a className="primary-action mt-5 inline-flex" href={panelSetupHref}>
              Ir al panel
            </a>
          </section>
        </main>
        <StudioEquisCredit />
      </>
    );
  }

  const { business: publicBusiness, services, slotsByService, intakeFormsByService } = bookingData;
  const lightLogoUrl = publicBusiness.logoLightUrl || publicBusiness.logoUrl || publicBusiness.publicAppIconUrl;
  const darkLogoUrl = publicBusiness.logoDarkUrl || publicBusiness.logoUrl || publicBusiness.publicAppIconUrl;
  const hasLogo = Boolean(lightLogoUrl || darkLogoUrl);

  return (
    <>
      <main className="app-screen py-8 sm:py-12" style={buildBrandStyle(publicBusiness)}>
        <section className="mx-auto w-full max-w-6xl">
          <header className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[rgb(var(--color-foreground))]">Reservas online</p>
            {hasLogo ? (
              <>
                <h1 className="sr-only">{publicBusiness.name}</h1>
                <div className="mx-auto mt-5 flex min-h-[140px] w-full max-w-2xl items-center justify-center sm:min-h-[170px] lg:min-h-[210px]">
                  {lightLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="brand-logo-light max-h-[210px] w-auto max-w-full object-contain object-center" src={lightLogoUrl} />
                  ) : null}
                  {darkLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="brand-logo-dark hidden max-h-[210px] w-auto max-w-full object-contain object-center" src={darkLogoUrl} />
                  ) : null}
                </div>
              </>
            ) : (
              <h1 className="mt-3 text-4xl font-black leading-tight sm:text-6xl">{publicBusiness.name}</h1>
            )}
          </header>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="surface flex gap-4 p-5 shadow-sm sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CalendarDays aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold">Servicios</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Elegis la atencion que necesitas y ves la informacion clave antes de avanzar.</p>
              </div>
            </article>
            <article className="surface flex gap-4 p-5 shadow-sm sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Clock aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold">Horarios</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Seleccionas un turno disponible o envias una consulta si el servicio se coordina aparte.</p>
              </div>
            </article>
            <article className="surface flex gap-4 p-5 shadow-sm sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CreditCard aria-hidden="true" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold">Pagos</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Cuando corresponde, podes dejar una seña o pagar online para confirmar la reserva.</p>
              </div>
            </article>
          </div>

          <div className="mt-8">
            <PublicTabbedExperience
              bottomNavigationEnabled={publicBusiness.publicBottomNavEnabled}
              description={publicBusiness.description}
              services={services}
              slotsByService={slotsByService}
              intakeFormsByService={intakeFormsByService}
              serviceImageFallbackUrl={publicBusiness.publicAppIconUrl}
            />
          </div>
        </section>
      </main>
      <StudioEquisCredit elevated={publicBusiness.publicBottomNavEnabled} />
    </>
  );
}
