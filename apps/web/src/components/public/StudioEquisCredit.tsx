"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type StudioEquisCreditProps = {
  elevated?: boolean;
};

export function StudioEquisCredit({ elevated = false }: StudioEquisCreditProps) {
  const [expanded, setExpanded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;

    function closeOnOutsidePress(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setExpanded(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsidePress);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePress);
  }, [expanded]);

  return (
    <div ref={rootRef} className={`studio-equis-credit ${elevated ? "studio-equis-credit--elevated" : ""} ${expanded ? "studio-equis-credit--expanded" : ""}`}>
      <a
        aria-expanded={expanded}
        aria-label={expanded ? "Ir a Estudio Equis" : "Mostrar credito de Estudio Equis"}
        className="studio-equis-credit__row"
        href="https://www.estudioequis.com.ar"
        onClick={(event) => {
          if (!expanded) {
            event.preventDefault();
            setExpanded(true);
          }
        }}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="studio-equis-credit__text studio-equis-credit__text--left">desarrollado por</span>
        <span className="studio-equis-credit-button relative block overflow-hidden rounded-full" aria-hidden="true">
          <Image src="/estudio-equis-logo.png" alt="" fill sizes="44px" className="object-contain p-1" />
        </span>
        <span className="studio-equis-credit__text studio-equis-credit__link">Estudio Equis</span>
      </a>
    </div>
  );
}
