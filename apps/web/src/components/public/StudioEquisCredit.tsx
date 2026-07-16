import Image from "next/image";

type StudioEquisCreditProps = {
  elevated?: boolean;
};

export function StudioEquisCredit({ elevated = false }: StudioEquisCreditProps) {
  return (
    <a
      aria-label="Estudio Equis"
      className="studio-equis-credit-button fixed left-3 z-40 block h-10 w-10 overflow-hidden rounded-full border sm:left-4"
      href="https://www.estudioequis.com.ar"
      rel="noopener noreferrer"
      style={{
        bottom: elevated
          ? "calc(var(--safe-bottom) + var(--bottom-nav-height) + 14px)"
          : "calc(var(--safe-bottom) + 12px)",
        background: "rgba(8, 15, 8, 0.72)",
        borderColor: "rgba(255, 255, 255, 0.18)",
        boxShadow: "0 10px 24px rgba(0, 0, 0, 0.28)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
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
  );
}
