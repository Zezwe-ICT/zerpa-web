/**
 * @file components/modules/settings/notifications-settings.tsx
 * @description Notification preferences component
 */
"use client";

import { useEffect, useState } from "react";
import { Mail, Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { getUserSettings, updateUserSettings } from "@/lib/api/settings";
import type { UserSettings } from "@/lib/api/settings";

const NOTIFICATION_KEYS = [
  { id: "invoiceReminders", name: "Invoice Reminders", description: "Get notified when invoices are due or overdue" },
  { id: "leadUpdates", name: "Lead Status Changes", description: "Alerts when leads move between stages" },
  { id: "systemAlerts", name: "System Alerts", description: "Important system notifications and maintenance notices" },
  { id: "paymentReceived", name: "Payment Received", description: "Notifications when payments are received" },
  { id: "newLeads", name: "New Leads", description: "Alerts when new leads are assigned to you" },
];

export function NotificationsSettings() {
  const { company } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const data = await getUserSettings();
        setSettings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load settings");
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const toggleChannel = (key: keyof UserSettings["notifications"]) => {
    if (!settings) return;
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: !prev.notifications[key],
        },
      };
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await updateUserSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Notification Preferences
        </h3>
        <p className="text-sm text-muted-fg">
          Choose how you want to be notified about important events
        </p>
      </div>

      {error && (
        <div className="bg-danger-bg text-danger text-sm p-3 rounded-[8px]">
          ✕ {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-fg">Loading preferences...</div>
      ) : settings ? (
        <>
          <div className="space-y-4">
            {NOTIFICATION_KEYS.map((key) => (
              <div
                key={key.id}
                className="border border-border rounded-[12px] p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-foreground">{key.name}</h4>
                    <p className="text-xs text-muted-fg mt-0.5">{key.description}</p>
                  </div>
                </div>

                <div className="flex gap-4 pl-0">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications[key.id as keyof typeof settings.notifications] || false}
                      onChange={() => toggleChannel(key.id as keyof typeof settings.notifications)}
                      className="w-4 h-4 rounded border-border"
                    />
                    <Bell size={14} className="text-muted-fg" />
                    <span className="text-xs text-muted-fg">Enabled</span>
                  </label>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>

          {saved && (
            <div className="bg-success-bg text-success text-sm p-3 rounded-[8px]">
              ✓ Notification preferences saved successfully
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-danger">Failed to load preferences</div>
      )}
    </div>
  );
}
