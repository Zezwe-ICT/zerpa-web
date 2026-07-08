/**
 * @file lib/theme/context.tsx
 * @description Appearance / theming context. Manages the user's theme (light /
 * dark / system), brand primary colour, base font size and sidebar-collapsed
 * preference. Persists to localStorage and applies the settings to the <html>
 * element so the whole token-driven UI re-themes instantly.
 *
 * The anti-flash inline script in app/layout.tsx applies the persisted values
 * before first paint; this provider keeps them in sync afterwards.
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type FontSize = "small" | "medium" | "large";

export interface AppearanceSettings {
  theme: ThemeMode;
  primaryColor: string;
  fontSize: FontSize;
  sidebarCollapsed: boolean;
}

/** Storage key + default brand colour are also referenced by the inline script. */
export const APPEARANCE_KEY = "zerpa_appearance";
export const DEFAULT_PRIMARY = "#1d3461"; // Zerpa navy — matches globals.css :root

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  theme: "system",
  primaryColor: DEFAULT_PRIMARY,
  fontSize: "medium",
  sidebarCollapsed: false,
};

export const FONT_SIZE_PX: Record<FontSize, string> = {
  small: "14px",
  medium: "16px",
  large: "18px",
};

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  }
  return mode;
}

/** Apply appearance settings to the document root. Safe to call on the client. */
export function applyAppearance(settings: AppearanceSettings): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.dataset.theme = resolveTheme(settings.theme);
  root.style.fontSize = FONT_SIZE_PX[settings.fontSize];

  // Only override the primary token when the user picked a custom colour;
  // otherwise let the per-theme CSS value (light/dark) apply.
  if (
    settings.primaryColor &&
    settings.primaryColor.toLowerCase() !== DEFAULT_PRIMARY.toLowerCase()
  ) {
    root.style.setProperty("--color-primary", settings.primaryColor);
    root.style.setProperty("--color-primary-hover", settings.primaryColor);
  } else {
    root.style.removeProperty("--color-primary");
    root.style.removeProperty("--color-primary-hover");
  }
}

interface AppearanceContextValue {
  settings: AppearanceSettings;
  /** Currently resolved theme (system -> light|dark). */
  resolvedTheme: "light" | "dark";
  update: (patch: Partial<AppearanceSettings>) => void;
  reset: () => void;
}

const AppearanceContext = createContext<AppearanceContextValue | null>(null);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_APPEARANCE);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from storage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(APPEARANCE_KEY);
      if (raw) {
        setSettings({ ...DEFAULT_APPEARANCE, ...JSON.parse(raw) });
      }
    } catch {
      // corrupted — fall back to defaults
    }
    setHydrated(true);
  }, []);

  // Persist + apply whenever settings change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    applyAppearance(settings);
    try {
      localStorage.setItem(APPEARANCE_KEY, JSON.stringify(settings));
    } catch {
      // storage full / unavailable — non-fatal
    }
  }, [settings, hydrated]);

  // Follow OS theme changes while in "system" mode.
  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyAppearance(settings);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings]);

  const update = useCallback((patch: Partial<AppearanceSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_APPEARANCE), []);

  return (
    <AppearanceContext.Provider
      value={{ settings, resolvedTheme: resolveTheme(settings.theme), update, reset }}
    >
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const ctx = useContext(AppearanceContext);
  if (!ctx) throw new Error("useAppearance must be used within AppearanceProvider");
  return ctx;
}
