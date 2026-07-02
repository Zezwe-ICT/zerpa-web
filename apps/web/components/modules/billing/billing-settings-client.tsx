/**
 * @file components/modules/billing/billing-settings-client.tsx
 * @description Billing settings form — document numbering, defaults, email
 * templates, company details, bank details and overdue reminder schedule.
 */
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getBillingSettings,
  updateBillingSettings,
} from "@/lib/data/billing-settings";
import type { BillingSettings } from "@zerpa/shared-types";
import Link from "next/link";

const REMINDER_OPTIONS = [3, 7, 14, 30];

export function BillingSettingsClient() {
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBillingSettings().then(setSettings);
  }, []);

  function set<K extends keyof BillingSettings>(key: K, value: BillingSettings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      await updateBillingSettings(settings);
      toast.success("Billing settings saved");
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-fg">Loading settings…</p>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/billing/invoices"
        className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-foreground mb-4"
      >
        <ArrowLeft size={14} /> Back to Billing
      </Link>

      <PageHeader
        title="Billing Settings"
        subtitle="Numbering, defaults, templates and company details for all billing documents"
        action={
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save size={14} className="mr-1.5" />
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        }
      />

      <div className="space-y-6 max-w-3xl">
        {/* Numbering & defaults */}
        <Section title="Numbering & Defaults">
          <Grid>
            <Field label="Invoice Prefix">
              <Input
                value={settings.invoicePrefix}
                onChange={(e) => set("invoicePrefix", e.target.value)}
              />
            </Field>
            <Field label="Quote Prefix">
              <Input
                value={settings.quotePrefix}
                onChange={(e) => set("quotePrefix", e.target.value)}
              />
            </Field>
            <Field label="Default Payment Terms (days)">
              <Input
                type="number"
                value={settings.defaultPaymentTermsDays}
                onChange={(e) =>
                  set("defaultPaymentTermsDays", parseInt(e.target.value) || 0)
                }
              />
            </Field>
            <Field label="Default VAT Rate (%)">
              <Input
                type="number"
                value={settings.defaultVatRate}
                onChange={(e) =>
                  set("defaultVatRate", parseFloat(e.target.value) || 0)
                }
              />
            </Field>
            <Field label="Default Quote Validity (days)">
              <Input
                type="number"
                value={settings.defaultQuoteValidityDays}
                onChange={(e) =>
                  set("defaultQuoteValidityDays", parseInt(e.target.value) || 0)
                }
              />
            </Field>
          </Grid>
        </Section>

        {/* Email templates */}
        <Section title="Email Templates">
          <Field label="Invoice Email Subject">
            <Input
              value={settings.invoiceEmailSubjectTemplate}
              onChange={(e) => set("invoiceEmailSubjectTemplate", e.target.value)}
            />
          </Field>
          <Field label="Invoice Email Body">
            <Textarea
              rows={4}
              value={settings.invoiceEmailBodyTemplate}
              onChange={(e) => set("invoiceEmailBodyTemplate", e.target.value)}
            />
          </Field>
          <Field label="Quote Email Subject">
            <Input
              value={settings.quoteEmailSubjectTemplate}
              onChange={(e) => set("quoteEmailSubjectTemplate", e.target.value)}
            />
          </Field>
        </Section>

        {/* Company details */}
        <Section title="Company Details">
          <Grid>
            <Field label="Company Name">
              <Input
                value={settings.companyName}
                onChange={(e) => set("companyName", e.target.value)}
              />
            </Field>
            <Field label="VAT Number">
              <Input
                value={settings.companyVatNumber ?? ""}
                onChange={(e) => set("companyVatNumber", e.target.value)}
              />
            </Field>
            <Field label="Registration Number">
              <Input
                value={settings.companyRegistrationNumber ?? ""}
                onChange={(e) => set("companyRegistrationNumber", e.target.value)}
              />
            </Field>
          </Grid>
          <Grid>
            <Field label="Postal Address">
              <Textarea
                rows={3}
                value={settings.companyPostalAddress ?? ""}
                onChange={(e) => set("companyPostalAddress", e.target.value)}
              />
            </Field>
            <Field label="Delivery Address">
              <Textarea
                rows={3}
                value={settings.companyDeliveryAddress ?? ""}
                onChange={(e) => set("companyDeliveryAddress", e.target.value)}
              />
            </Field>
          </Grid>
        </Section>

        {/* Bank details */}
        <Section title="Bank Details (printed on invoices)">
          <Grid>
            <Field label="Bank Name">
              <Input
                value={settings.bankName ?? ""}
                onChange={(e) => set("bankName", e.target.value)}
              />
            </Field>
            <Field label="Account Number">
              <Input
                value={settings.bankAccountNumber ?? ""}
                onChange={(e) => set("bankAccountNumber", e.target.value)}
              />
            </Field>
            <Field label="Branch Code">
              <Input
                value={settings.bankBranchCode ?? ""}
                onChange={(e) => set("bankBranchCode", e.target.value)}
              />
            </Field>
            <Field label="Branch Name">
              <Input
                value={settings.bankBranchName ?? ""}
                onChange={(e) => set("bankBranchName", e.target.value)}
              />
            </Field>
            <Field label="Swift Code">
              <Input
                value={settings.bankSwiftCode ?? ""}
                onChange={(e) => set("bankSwiftCode", e.target.value)}
              />
            </Field>
            <Field label="Proof of Payment Email">
              <Input
                value={settings.proofOfPaymentEmail ?? ""}
                onChange={(e) => set("proofOfPaymentEmail", e.target.value)}
              />
            </Field>
          </Grid>
          <Field label="Footer Notes">
            <Textarea
              rows={2}
              value={settings.footerNotes ?? ""}
              onChange={(e) => set("footerNotes", e.target.value)}
            />
          </Field>
        </Section>

        {/* Overdue reminders */}
        <Section title="Overdue Reminder Schedule">
          <div className="flex flex-wrap gap-4">
            {REMINDER_OPTIONS.map((day) => (
              <label
                key={day}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={settings.overdueReminderDays.includes(day)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...settings.overdueReminderDays, day].sort((a, b) => a - b)
                      : settings.overdueReminderDays.filter((d) => d !== day);
                    set("overdueReminderDays", next);
                  }}
                />
                {day} days overdue
              </label>
            ))}
          </div>
        </Section>
      </div>
    </>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[12px] border border-border bg-background p-5 space-y-4">
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
