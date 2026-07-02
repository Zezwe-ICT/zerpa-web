/**
 * @file components/modules/settings/localisation-settings.tsx
 * @description Localization configuration component
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const CURRENCY_OPTIONS = [
  { id: "ZAR", label: "South African Rand (R)" },
  { id: "USD", label: "US Dollar ($)" },
  { id: "EUR", label: "Euro (€)" },
  { id: "GBP", label: "British Pound (£)" },
];

const DATE_FORMAT_OPTIONS = [
  { id: "DD/MM/YYYY", label: "DD/MM/YYYY" },
  { id: "MM/DD/YYYY", label: "MM/DD/YYYY" },
  { id: "YYYY-MM-DD", label: "YYYY-MM-DD" },
];

const TIME_FORMAT_OPTIONS = [
  { id: "24H", label: "24-Hour (14:30)" },
  { id: "12H", label: "12-Hour (2:30 PM)" },
];

const TIMEZONE_OPTIONS = [
  { id: "Africa/Johannesburg", label: "Africa/Johannesburg (SAST)" },
  { id: "Africa/Cairo", label: "Africa/Cairo (EAT)" },
  { id: "Africa/Lagos", label: "Africa/Lagos (WAT)" },
  { id: "Europe/London", label: "Europe/London (GMT)" },
  { id: "Europe/Paris", label: "Europe/Paris (CET)" },
  { id: "America/New_York", label: "America/New_York (EST)" },
  { id: "America/Los_Angeles", label: "America/Los_Angeles (PST)" },
  { id: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
  { id: "Australia/Sydney", label: "Australia/Sydney (AEDT)" },
];

const LANGUAGE_OPTIONS = [
  { id: "en", label: "English" },
  { id: "af", label: "Afrikaans" },
  { id: "zu", label: "Zulu" },
  { id: "xh", label: "Xhosa" },
];

const DEFAULT_LOCALISATION_SETTINGS = {
  currency: "ZAR",
  dateFormat: "DD/MM/YYYY",
  timeFormat: "24H",
  timezone: "Africa/Johannesburg",
  language: "en",
};

interface LocalisationSettings {
  currency: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  language: string;
}

export function LocalisationSettings() {
  const [settings, setSettings] = useState<LocalisationSettings>(
    DEFAULT_LOCALISATION_SETTINGS
  );
  const [saved, setSaved] = useState(false);

  const updateSetting = (key: keyof LocalisationSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Localisation
        </h3>
        <p className="text-sm text-muted-fg">
          Set your region, currency, and date format preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Currency */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Currency
          </label>
          <select
            value={settings.currency}
            onChange={(e) => updateSetting("currency", e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-[8px] text-sm bg-background focus:outline-none focus:border-primary"
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-fg mt-2">
            Default currency for all transactions
          </p>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Language
          </label>
          <select
            value={settings.language}
            onChange={(e) => updateSetting("language", e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-[8px] text-sm bg-background focus:outline-none focus:border-primary"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-fg mt-2">
            Language for the interface
          </p>
        </div>

        {/* Date Format */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Date Format
          </label>
          <select
            value={settings.dateFormat}
            onChange={(e) => updateSetting("dateFormat", e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-[8px] text-sm bg-background focus:outline-none focus:border-primary"
          >
            {DATE_FORMAT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-fg mt-2">
            How dates will be displayed
          </p>
        </div>

        {/* Time Format */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Time Format
          </label>
          <select
            value={settings.timeFormat}
            onChange={(e) => updateSetting("timeFormat", e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-[8px] text-sm bg-background focus:outline-none focus:border-primary"
          >
            {TIME_FORMAT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-fg mt-2">
            How times will be displayed
          </p>
        </div>

        {/* Timezone */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-foreground mb-2">
            Timezone
          </label>
          <select
            value={settings.timezone}
            onChange={(e) => updateSetting("timezone", e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-[8px] text-sm bg-background focus:outline-none focus:border-primary"
          >
            {TIMEZONE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-fg mt-2">
            Your timezone for scheduled events
          </p>
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 border border-border rounded-[12px] bg-surface space-y-3">
        <h4 className="text-sm font-medium text-foreground">Preview</h4>
        <div className="space-y-2 text-sm text-muted-fg">
          <p>
            Currency: <span className="text-foreground">R 15,250.50</span>
          </p>
          <p>
            Date: <span className="text-foreground">
              {settings.dateFormat === "DD/MM/YYYY"
                ? "05/03/2024"
                : settings.dateFormat === "MM/DD/YYYY"
                ? "03/05/2024"
                : "2024-03-05"}
            </span>
          </p>
          <p>
            Time:{" "}
            <span className="text-foreground">
              {settings.timeFormat === "24H" ? "14:30" : "2:30 PM"}
            </span>
          </p>
          <p>
            Timezone: <span className="text-foreground">{settings.timezone}</span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave}>Save Changes</Button>
        <Button
          variant="outline"
          onClick={() => setSettings(DEFAULT_LOCALISATION_SETTINGS)}
        >
          Reset to Default
        </Button>
      </div>

      {saved && (
        <div className="bg-success-bg text-success text-sm p-3 rounded-[8px]">
          ✓ Localisation settings saved successfully
        </div>
      )}
    </div>
  );
}
