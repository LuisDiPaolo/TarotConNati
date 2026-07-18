"use client";

import Image from "next/image";
import { useState } from "react";

type StudioEquisCreditProps = {
  elevated?: boolean;
};

export function StudioEquisCredit({ elevated = false }: StudioEquisCreditProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`studio-equis-credit ${elevated ? "studio-equis-credit--elevated" : ""} ${expanded ? "studio-equis-credit--expanded" : ""}`}>
      <div className="studio-equis-credit__row">
        <span className="studio-equis-credit__text studio-equis-credit__text--left">desarrollado por</span>
        <button
          aria-expanded={expanded}
          aria-label={expanded ? "Ocultar credito" : "Mostrar credito"}
          className="studio-equis-credit-button relative block overflow-hidden rounded-full"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          <Image src="/estudio-equis-logo.png" alt="" fill sizes="48px" className="object-contain p-1" />
        </button>
        <a className="studio-equis-credit__text studio-equis-credit__link" href="https://www.estudioequis.com.ar" rel="noopener noreferrer" tabIndex={expanded ? undefined : -1} target="_blank">
          Estudio Equis
        </a>
      </div>
    </div>
  );
}
