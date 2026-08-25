"use client";

import "react-loading-skeleton/dist/skeleton.css";
import * as React from "react";
import { SkeletonTheme } from "react-loading-skeleton";

export type Theme = "light" | "dark" | "system";
type ResolvedTheme = Exclude<Theme, "system">;

type ThemeContextValue = {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "netbird-theme";
const DEFAULT_THEME: Theme = "dark";
const ThemeContext = React.createContext<ThemeContextValue | null>(null);

const getStoredTheme = (): Theme => {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // The preference remains session-only when storage is unavailable.
  }
  return DEFAULT_THEME;
};

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const withoutTransitions = (apply: () => void) => {
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  try {
    apply();
  } finally {
    window.getComputedStyle(document.documentElement);
    window.setTimeout(() => style.remove(), 1);
  }
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>(getStoredTheme);
  const [systemTheme, setSystemTheme] =
    React.useState<ResolvedTheme>(getSystemTheme);
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  React.useEffect(() => {
    withoutTransitions(() => {
      const root = document.documentElement;
      root.classList.toggle("dark", resolvedTheme === "dark");
      root.classList.toggle("light", resolvedTheme === "light");
      root.style.colorScheme = resolvedTheme;
    });
  }, [resolvedTheme]);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setTheme = React.useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The selected theme still applies for the current session.
    }
    setThemeState(next);
  }, []);

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  const skeletonColors =
    resolvedTheme === "dark"
      ? { base: "#25282d", highlight: "#33373e" }
      : { base: "#e4e7e9", highlight: "#f4f6f7" };

  return (
    <ThemeContext.Provider value={value}>
      <SkeletonTheme {...skeletonColors}>{children}</SkeletonTheme>
    </ThemeContext.Provider>
  );
}

export const useTheme = (): ThemeContextValue => {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
