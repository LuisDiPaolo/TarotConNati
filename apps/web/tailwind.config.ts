import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--color-background) / <alpha-value>)",
        foreground: "rgb(var(--color-foreground) / <alpha-value>)",
        primary: "rgb(var(--brand-primary) / <alpha-value>)",
        accent: "rgb(var(--brand-accent) / <alpha-value>)",
      },
      borderRadius: {
        brand: "var(--brand-radius)",
      },
    },
  },
  plugins: [],
};

export default config;
