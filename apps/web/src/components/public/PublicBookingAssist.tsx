"use client";

import { HelpCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

type PublicBookingAssistProps = {
  businessName: string;
  installHref: string;
  lightLogoUrl: string;
  darkLogoUrl: string;
};

const tutorialSteps = [
  {
    title: "Elegi el servicio",
    copy: "Revisa las opciones disponibles, la modalidad de atencion, la duracion y cualquier indicacion importante antes de avanzar.",
  },
  {
    title: "Selecciona dia y horario",
    copy: "Si el servicio toma turnos con agenda, elegi uno de los horarios disponibles. Si requiere coordinacion manual, envia la solicitud para que el negocio responda.",
  },
  {
    title: "Completa tus datos",
    copy: "Carga tus datos de contacto y responde las preguntas adicionales si el servicio las pide. Esa informacion ayuda a preparar la atencion.",
  },
  {
    title: "Confirma la reserva",
    copy: "Antes de enviar, revisa el resumen. Cuando el servicio tenga sena o pago online, completa el pago indicado para dejar la reserva tomada.",
  },
  {
    title: "Segui las notificaciones",
    copy: "Guarda la app en el telefono y activa avisos para recibir novedades, recordatorios o cambios del turno desde el negocio.",
  },
];

export function PublicBookingAssist({ businessName, installHref, lightLogoUrl, darkLogoUrl }: PublicBookingAssistProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [compactHeaderVisible, setCompactHeaderVisible] = useState(false);
  const hasLogo = Boolean(lightLogoUrl || darkLogoUrl);
  const fallbackInitial = useMemo(() => businessName.trim().charAt(0).toUpperCase() || "T", [businessName]);

  useEffect(() => {
    const brandAnchor = document.getElementById("public-brand-anchor");

    if (!brandAnchor || !("IntersectionObserver" in window)) {
      const updateHeaderVisibility = () => setCompactHeaderVisible(window.scrollY > 190);
      updateHeaderVisibility();
      window.addEventListener("scroll", updateHeaderVisibility, { passive: true });
      return () => window.removeEventListener("scroll", updateHeaderVisibility);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setCompactHeaderVisible(!entry?.isIntersecting);
      },
      { root: null, rootMargin: "-72px 0px 0px 0px", threshold: 0.08 },
    );

    observer.observe(brandAnchor);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!helpOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [helpOpen]);

  useEffect(() => {
    if (!helpOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setHelpOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [helpOpen]);

  return (
    <>
      <div className="public-safe-area-glass" aria-hidden="true" />

      {compactHeaderVisible ? (
        <div className="public-compact-header public-compact-header--visible">
          <div className="public-compact-header__surface">
            <button className="public-help-button" type="button" aria-label="Abrir ayuda" title="Ayuda" onClick={() => setHelpOpen(true)}>
              <HelpCircle aria-hidden="true" className="h-4 w-4" />
            </button>
            <div className="public-compact-header__brand" aria-label={businessName}>
              {hasLogo ? (
                <>
                  {lightLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="brand-logo-light public-compact-header__logo" src={lightLogoUrl} />
                  ) : null}
                  {darkLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" className="brand-logo-dark public-compact-header__logo hidden" src={darkLogoUrl} />
                  ) : null}
                </>
              ) : (
                <span className="public-compact-header__fallback">{fallbackInitial}</span>
              )}
            </div>
            <ThemeToggle variant="inline" />
          </div>
        </div>
      ) : null}

      {!compactHeaderVisible ? (
        <>
          <button className="public-help-button public-help-button--floating" type="button" aria-label="Abrir ayuda" title="Ayuda" onClick={() => setHelpOpen(true)}>
            <HelpCircle aria-hidden="true" className="h-4 w-4" />
          </button>
          <div className="public-theme-toggle--floating">
            <ThemeToggle variant="inline" />
          </div>
        </>
      ) : null}

      {helpOpen ? (
        <div className="public-help-modal" role="dialog" aria-modal="true" aria-labelledby="public-help-title">
          <button className="public-help-modal__backdrop" type="button" aria-label="Cerrar ayuda" onClick={() => setHelpOpen(false)} />
          <section className="public-help-modal__panel">
            <header className="public-help-modal__header">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Guia rapida</p>
                <h2 id="public-help-title" className="mt-1 text-xl font-black">Como reservar y gestionar tu turno</h2>
              </div>
              <button className="public-help-button" type="button" aria-label="Cerrar ayuda" title="Cerrar" onClick={() => setHelpOpen(false)}>
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </header>

            <div className="public-help-modal__content">
              <ol className="grid gap-3">
                {tutorialSteps.map((step, index) => (
                  <li className="public-help-step" key={step.title}>
                    <span className="public-help-step__number">{index + 1}</span>
                    <div>
                      <h3 className="font-black">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted">{step.copy}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="public-help-install">
                <h3 className="font-black">Instala el acceso en tu telefono</h3>
                <p className="mt-1 text-sm leading-6 text-muted">Al instalar la app vas a poder entrar mas rapido y recibir avisos del negocio cuando esten disponibles.</p>
                <a className="primary-action mt-4 inline-flex" href={installHref} onClick={() => setHelpOpen(false)}>
                  Ir a instalar
                </a>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
