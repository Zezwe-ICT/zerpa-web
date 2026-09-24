/**
 * @file components/modules/settings/notifications-settings.tsx
 * @description Per-person notification preferences, stored on the server so they apply to the bell
 * and to emails: for each kind of event, choose in-app and/or email.
 */
"use client";

import { useEffect, useState } from "react";
import { Bell, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  type NotificationKindPref,
} from "@/lib/api/notifications";

export function NotificationsSettings() {
  const [kinds, setKinds] = useState<NotificationKindPref[] | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getNotificationPreferences()
      .then((res) => {
        setKinds(res.kinds);
        setEmail(res.email);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load preferences"));
  }, []);

  function toggle(key: string, channel: "inApp" | "email") {
    setKinds((prev) => prev?.map((k) => (k.key === key ? { ...k, [channel]: !k[channel] } : k)) ?? null);
  }

  async function save() {
    if (!kinds) return;
    setSaving(true);
    try {
      const res = await updateNotificationPreferences(
        Object.fromEntries(kinds.map((k) => [k.key, { inApp: k.inApp, email: k.email }])),
      );
      setKinds(res.kinds);
      toast.success("Notification preferences saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-1">Notification preferences</h3>
        <p className="text-sm text-muted-fg">
          Choose how you hear about customers accepting quotes and paying. These settings are just for you
          {email ? ` (emails go to ${email})` : ""}.
        </p>
      </div>

      {error && <div className="bg-danger-bg text-danger text-sm p-3 rounded-[8px]">{error}</div>}
      {!kinds && !error && <div className="text-center py-8 text-muted-fg">Loading preferences…</div>}

      {kinds && (
        <>
          <div className="rounded-[12px] border border-border divide-y divide-border">
            {kinds.map((k) => (
              <div key={k.key} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <h4 className="font-medium text-foreground">{k.label}</h4>
                  <p className="text-xs text-muted-fg mt-0.5">{k.description}</p>
                </div>
                <div className="flex gap-5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={k.inApp} onChange={() => toggle(k.key, "inApp")} className="w-4 h-4" />
                    <Bell size={14} className="text-muted-fg" /> In app
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={k.email} onChange={() => toggle(k.key, "email")} className="w-4 h-4" />
                    <Mail size={14} className="text-muted-fg" /> Email
                  </label>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-fg">
            Only people who can see billing get these. You won&apos;t be notified about payments you record yourself.
          </p>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </>
      )}
    </div>
  );
}
