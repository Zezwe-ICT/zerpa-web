/**
 * @file components/modules/settings/appearance-settings.tsx
 * @description Appearance customization component. Reads and writes the global
 * AppearanceProvider, so changes (theme, brand colour, font size, sidebar)
 * apply live to the whole app and persist across sessions.
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useAppearance, DEFAULT_PRIMARY } from "@/lib/theme/context";

const COLOR_PRESETS = [
  { name: "Navy", value: DEFAULT_PRIMARY },
  { name: "Blue", value: "#0ea5e9" },
  { name: "Violet", value: "#7c3aed" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber", value: "#f59e0b" },
  { name: "Rose", value: "#f43f5e" },
];

const FONT_SIZES = [
  { label: "Small", value: "small", example: "text-sm" },
  { label: "Medium", value: "medium", example: "text-base" },
  { label: "Large", value: "large", example: "text-lg" },
] as const;

export function AppearanceSettings() {
  const { settings, update, reset } = useAppearance();
  const [saved, setSaved] = useState(false);

  // Changes apply live via the provider; "Save" just confirms the current state
  // (already persisted to localStorage on every change).
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Appearance
        </h3>
        <p className="text-sm text-muted-fg">
          Customize the look and feel of your workspace
        </p>
      </div>

      {/* Theme Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Theme
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "light", icon: Sun, label: "Light" },
            { value: "dark", icon: Moon, label: "Dark" },
            { value: "system", icon: Monitor, label: "System" },
          ].map((theme) => {
            const Icon = theme.icon;
            return (
              <button
                key={theme.value}
                onClick={() => update({ theme: theme.value as typeof settings.theme })}
                className={`p-3 border rounded-[12px] flex flex-col items-center gap-2 transition-colors ${
                  settings.theme === theme.value
                    ? "border-primary bg-primary-tint"
                    : "border-border hover:border-foreground"
                }`}
              >
                <Icon size={20} className="text-muted-fg" />
                <span className="text-xs font-medium">{theme.label}</span>
                {settings.theme === theme.value && (
                  <Check size={14} className="text-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Color */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Primary Color
        </label>
        <div className="grid grid-cols-6 gap-3">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color.value}
              onClick={() => update({ primaryColor: color.value })}
              className="flex flex-col items-center gap-2 group"
              title={color.name}
            >
              <div
                className={`w-12 h-12 rounded-[8px] border-2 transition-all ${
                  settings.primaryColor === color.value
                    ? "border-foreground scale-110"
                    : "border-border group-hover:border-foreground"
                }`}
                style={{ backgroundColor: color.value }}
              />
              <span className="text-xs text-muted-fg group-hover:text-foreground transition-colors">
                {color.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Font Size
        </label>
        <div className="space-y-2">
          {FONT_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => update({ fontSize: size.value })}
              className={`w-full flex items-center justify-between p-3 border rounded-[12px] transition-colors ${
                settings.fontSize === size.value
                  ? "border-primary bg-primary-tint"
                  : "border-border hover:border-foreground"
              }`}
            >
              <span className="text-sm font-medium">{size.label}</span>
              <span className={size.example}>Example text</span>
              {settings.fontSize === size.value && (
                <Check size={16} className="text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar Option */}
      <div className="flex items-center justify-between p-4 border border-border rounded-[12px]">
        <div>
          <h4 className="font-medium text-foreground">Collapse Sidebar</h4>
          <p className="text-xs text-muted-fg mt-1">
            Save space by collapsing the sidebar by default
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.sidebarCollapsed}
            onChange={(e) => update({ sidebarCollapsed: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-surface border border-border rounded-full peer peer-checked:bg-primary peer-checked:border-primary transition-colors" />
          <span className="absolute left-1 top-1 w-4 h-4 bg-background rounded-full peer-checked:translate-x-5 transition-transform" />
        </label>
      </div>

      {/* Preview */}
      <div className="p-6 border border-border rounded-[12px] bg-surface">
        <h4 className="text-sm font-medium text-foreground mb-4">Preview</h4>
        <div className="space-y-2">
          <div className="flex gap-2 items-center">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: settings.primaryColor }}
            />
            <span className="text-sm text-muted-fg">
              Primary color preview
            </span>
          </div>
          <p className={settings.fontSize === "small" ? "text-sm" : settings.fontSize === "large" ? "text-lg" : "text-base"}>
            This is how your text will look
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleSave}>Save Changes</Button>
        <Button variant="outline" onClick={reset}>
          Reset to Default
        </Button>
      </div>

      {saved && (
        <div className="bg-success-bg text-success text-sm p-3 rounded-[8px]">
          ✓ Appearance settings saved
        </div>
      )}
    </div>
  );
}
