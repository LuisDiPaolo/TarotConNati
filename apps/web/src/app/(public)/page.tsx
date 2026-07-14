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

        <div className="mt-8 grid gap-6">
          <section className="surface p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Antes de reservar</p>
            <h2 className="mt-3 text-2xl font-black leading-tight sm:text-3xl">Coordina tu turno en pocos pasos</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              {publicBusiness.description || "Completa tus datos, revisa las opciones disponibles y confirma la reserva desde el formulario."}
            </p>
            <div className="mt-6 grid gap-5 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-zinc-800">
              <div>
                <p className="text-sm font-bold">Confirmacion clara</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Al finalizar vas a ver el estado de tu reserva y los datos importantes del turno.</p>
              </div>
              <div>
                <p className="text-sm font-bold">Datos necesarios</p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">El formulario puede pedir informacion extra para preparar mejor la atencion.</p>
              </div>
            </div>
          </section>

          <ReservationForm services={services} slotsByService={slotsByService} intakeFormsByService={intakeFormsByService} serviceImageFallbackUrl={publicBusiness.publicAppIconUrl} />
        </div>
      </section>
    </main>
  );
}
