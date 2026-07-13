import type { CSSProperties } from "react";

type BrandTokens = {
  brandPrimary: string;
  brandAccent: string;
  brandRadius: string;
};

function hexToRgbTriplet(hex: string) {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  return `${red} ${green} ${blue}`;
}

export function buildBrandStyle(tokens: BrandTokens): CSSProperties {
  const primary = hexToRgbTriplet(tokens.brandPrimary);
  const accent = hexToRgbTriplet(tokens.brandAccent);

  return {
    ...(primary ? { "--brand-primary": primary } : {}),
    ...(accent ? { "--brand-accent": accent } : {}),
    "--brand-radius": tokens.brandRadius,
  } as CSSProperties;
}
