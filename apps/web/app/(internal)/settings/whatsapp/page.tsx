"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api/client";
import { toast } from "sonner";

interface WhatsAppSettings {
  enabled: boolean;
  phoneNumberId: string;
  hasToken: boolean;
  connected: boolean;
}

export default function WhatsAppPage() {
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [token, setToken] = useState("");
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    apiRequest<WhatsAppSettings>("/communications/whatsapp")
      .then((row) => {
        setSettings(row);
        setPhoneNumberId(row.phoneNumberId);
        setEnabled(row.enabled);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Could not load WhatsApp"));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="WhatsApp"
        subtitle="Send quotes, invoices, and payment reminders. Replies in an inbox are not built yet."
      />
      <form
        className="max-w-lg space-y-3"
        onSubmit={async (event) => {
          event.preventDefault();
          try {
            const saved = await apiRequest<WhatsAppSettings>("/communications/whatsapp", {
              method: "PUT",
              body: { phoneNumberId, enabled, ...(token ? { accessToken: token } : {}) },
            });
            setSettings(saved);
            setToken("");
            toast.success(saved.connected ? "WhatsApp is connected" : "Saved. Messages stay skipped until a token is set.");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not save WhatsApp");
          }
        }}
      >
        <label className="block text-sm">
          Phone number ID
          <input className="mt-1 w-full rounded-[8px] border border-border px-3 py-2" value={phoneNumberId} onChange={(e) => setPhoneNumberId(e.target.value)} />
        </label>
        <label className="block text-sm">
          Access token {settings?.hasToken ? "(saved — leave blank to keep it)" : ""}
          <input className="mt-1 w-full rounded-[8px] border border-border px-3 py-2" type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enabled
        </label>
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              try {
                const result = await apiRequest<{
                  sent: number;
                  skipped: number;
                  failed: number;
                  errors: Array<{ to: string; error: string }>;
                }>("/communications/whatsapp/send", {
                  method: "POST",
                  body: { kind: "reminders" },
                });
                const summary = `${result.sent} sent, ${result.skipped} skipped${result.failed ? `, ${result.failed} failed` : ""}`;
                if (result.failed) {
                  toast.error(`${summary}. First problem: ${result.errors[0]?.to} — ${result.errors[0]?.error}`);
                } else {
                  toast.success(summary);
                }
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not send reminders");
              }
            }}
          >
            Send overdue reminders
          </Button>
        </div>
        <p className="text-xs text-muted-fg">
          {settings?.connected ? "Connected to WhatsApp Business." : "Without a token, Zerpa saves the message and does not send it."}
        </p>
      </form>
    </PageContainer>
  );
}
