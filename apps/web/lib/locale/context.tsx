/**
 * @file lib/locale/context.tsx
 * @description Localisation context. Stores the user's currency, date/time
 * format, timezone and language, persists them to localStorage, and exposes
 * formatting helpers (formatCurrency / formatDate / formatTime) so screens can
 * render values according to the chosen preferences.
 */
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface LocalisationSettings {
  currency: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  language: string;
}

export const LOCALISATION_KEY = "zerpa_localisation";

export const DEFAULT_LOCALISATION: LocalisationSettings = {
  currency: "ZAR",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24H",
  timezone: "Africa/Johannesburg",
  language: "en",
};

const CURRENCY_LOCALE: Record<string, string> = {
  ZAR: "en-ZA",
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
};

function formatDateParts(date: Date, fmt: string): string {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = String(date.getFullYear());
  switch (fmt) {
    case "MM/DD/YYYY":
      return `${mm}/${dd}/${yyyy}`;
    case "YYYY-MM-DD":
      return `${yyyy}-${mm}-${dd}`;
    case "DD/MM/YYYY":
    default:
      return `${dd}/${mm}/${yyyy}`;
  }
}

interface LocaleContextValue {
  settings: LocalisationSettings;
  update: (patch: Partial<LocalisationSettings>) => void;
  reset: () => void;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string | number) => string;
  formatTime: (date: Date | string | number) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<LocalisationSettings>(
    DEFAULT_LOCALISATION
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCALISATION_KEY);
      if (raw) setSettings({ ...DEFAULT_LOCALISATION, ...JSON.parse(raw) });
    } catch {
      // corrupted — keep defaults
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(LOCALISATION_KEY, JSON.stringify(settings));
    } catch {
      // non-fatal
    }
  }, [settings, hydrated]);

  const update = useCallback((patch: Partial<LocalisationSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setSettings(DEFAULT_LOCALISATION), []);

  const helpers = useMemo(() => {
    const locale = CURRENCY_LOCALE[settings.currency] ?? "en-ZA";
    const toDate = (v: Date | string | number) =>
      v instanceof Date ? v : new Date(v);

    return {
      formatCurrency: (amount: number) => {
        try {
          return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: settings.currency,
          }).format(amount);
        } catch {
          return `${settings.currency} ${amount.toFixed(2)}`;
        }
      },
      formatDate: (v: Date | string | number) =>
        formatDateParts(toDate(v), settings.dateFormat),
      formatTime: (v: Date | string | number) => {
        const d = toDate(v);
        return new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: settings.timeFormat === "12H",
          timeZone: settings.timezone,
        }).format(d);
      },
    };
  }, [settings]);

  return (
    <LocaleContext.Provider value={{ settings, update, reset, ...helpers }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
