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
import { removeCompanyLogo, uploadCompanyLogo } from "@/lib/api/books";
import type { BillingSettings } from "@zerpa/shared-types";
import Link from "next/link";
import { OnlinePaymentsSettings } from "./online-payments-settings";

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
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save settings");
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
            <Field label="Logo">
              <div className="space-y-2">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="" className="h-12 w-auto rounded-[6px] border border-border object-contain" />
                ) : (
                  <p className="text-xs text-muted-fg">Shown on quotes and invoices. PNG, JPEG, or WebP, up to 400 KB.</p>
                )}
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (!file) return;
                    if (file.size > 400_000) {
                      toast.error("Logo must be 400 KB or smaller.");
                      return;
                    }
                    try {
                      const saved = await uploadCompanyLogo(file);
                      set("logoUrl", saved.logoUrl || "");
                      toast.success("Logo uploaded");
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Could not upload the logo");
                    }
                  }}
                />
                {settings.logoUrl ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await removeCompanyLogo();
                        set("logoUrl", "");
                        toast.success("Logo removed");
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Could not remove the logo");
                      }
                    }}
                  >
                    Remove logo
                  </Button>
                ) : null}
              </div>
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
        <Section title="Bank Details (printed on invoices and the payment page)">
          <p className="text-sm text-muted-fg -mt-2">
            Customers see these on the payment page with the invoice number as their reference, so bank statement
            matching can pick the payment up automatically.
          </p>
          <Grid>
            <Field label="Bank Name">
              <Input
                value={settings.bankName ?? ""}
                onChange={(e) => set("bankName", e.target.value)}
                placeholder="e.g. FNB, Capitec, Standard Bank"
              />
            </Field>
            <Field label="Account Holder">
              <Input
                value={settings.accountHolder ?? ""}
                onChange={(e) => set("accountHolder", e.target.value)}
                placeholder="Name on the bank account"
              />
            </Field>
            <Field label="Account Type">
              <select
                value={settings.bankAccountType ?? ""}
                onChange={(e) => set("bankAccountType", e.target.value)}
                className="w-full h-10 rounded-[6px] border border-border bg-background px-3 text-sm"
              >
                <option value="">Select…</option>
                <option value="Cheque / Current">Cheque / Current</option>
                <option value="Savings">Savings</option>
                <option value="Transmission">Transmission</option>
              </select>
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

        <OnlinePaymentsSettings />

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
