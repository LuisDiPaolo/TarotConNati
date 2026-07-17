"use client";

import { Moon, Palette, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "brand" | "dark";

type ThemeToggleProps = {
  variant?: "fixed" | "inline";
};

const STORAGE_KEY = "turnos-theme";
const THEME_SEQUENCE: ThemeMode[] = ["light", "brand", "dark"];

function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "light" || value === "brand" || value === "dark";
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (isThemeMode(stored)) return stored;

  const defaultTheme = document.documentElement.dataset.defaultTheme;
  return isThemeMode(defaultTheme) ? defaultTheme : "light";
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme === "dark" ? "dark" : "light";
}

export function ThemeToggle({ variant = "fixed" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) => {
      const currentIndex = THEME_SEQUENCE.indexOf(currentTheme);
      return THEME_SEQUENCE[(currentIndex + 1) % THEME_SEQUENCE.length] ?? "light";
    });
  }

  const Icon = theme === "light" ? Palette : theme === "brand" ? Moon : Sun;
  const nextLabel = theme === "light" ? "color personalizado" : theme === "brand" ? "oscuro" : "claro";

  return (
    <button
      type="button"
      aria-label={`Activar modo ${nextLabel}`}
      className={variant === "inline" ? "theme-toggle theme-toggle--inline" : "theme-toggle"}
      onClick={toggleTheme}
      title={`Activar modo ${nextLabel}`}
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
