import Image from "next/image";

type StudioEquisCreditProps = {
  elevated?: boolean;
};

export function StudioEquisCredit({ elevated = false }: StudioEquisCreditProps) {
  return (
    <div className={`studio-equis-credit ${elevated ? "studio-equis-credit--elevated" : ""}`}>
      <a
        aria-label="Estudio Equis"
        className="studio-equis-credit-button relative block h-10 w-10 overflow-hidden rounded-full border"
        href="https://www.estudioequis.com.ar"
        rel="noopener noreferrer"
        target="_blank"
        title="Estudio Equis"
      >
        <Image
          src="/estudio-equis-logo.png"
          alt="Estudio Equis"
          fill
          sizes="40px"
          className="object-contain p-1.5"
        />
      </a>
    </div>
  );
}
