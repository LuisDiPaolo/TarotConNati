import type { CSSProperties } from "react";

type BrandTokens = {
  brandPrimary: string;
  brandAccent: string;
  themeBackground?: string;
  brandRadius: string;
};

type Rgb = {
  red: number;
  green: number;
  blue: number;
};

function hexToRgb(hex: string): Rgb | null {
  const normalized = hex.trim().replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return null;

  return {
    red: Number.parseInt(normalized.slice(0, 2), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    blue: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToTriplet(rgb: Rgb) {
  return `${rgb.red} ${rgb.green} ${rgb.blue}`;
}

function linearizeColorChannel(value: number) {
  const channel = value / 255;
  return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(rgb: Rgb) {
  return 0.2126 * linearizeColorChannel(rgb.red) + 0.7152 * linearizeColorChannel(rgb.green) + 0.0722 * linearizeColorChannel(rgb.blue);
}

export function buildBrandStyle(tokens: BrandTokens): CSSProperties {
  const primary = hexToRgb(tokens.brandPrimary);
  const accent = hexToRgb(tokens.brandAccent);
  const background = hexToRgb(tokens.themeBackground ?? tokens.brandPrimary);
  const backgroundIsLight = background ? relativeLuminance(background) > 0.55 : false;

  return {
    ...(primary ? { "--brand-primary": rgbToTriplet(primary) } : {}),
    ...(accent ? { "--brand-accent": rgbToTriplet(accent) } : {}),
    ...(background ? { "--theme-background": rgbToTriplet(background) } : {}),
    ...(background
      ? {
          "--brand-on-background": backgroundIsLight ? "15 23 42" : "248 250 252",
          "--brand-surface": backgroundIsLight ? "15 23 42" : "255 255 255",
          "--brand-surface-foreground": backgroundIsLight ? "248 250 252" : "15 23 42",
          "--brand-surface-muted": backgroundIsLight ? "203 213 225" : "71 85 105",
          "--brand-surface-border": backgroundIsLight ? "255 255 255" : "15 23 42",
        }
      : {}),
    "--brand-radius": tokens.brandRadius,
  } as CSSProperties;
}
