/**
 * @file components/modules/billing/automated-config-editor.tsx
 * @description Automated invoice config editor. Sections: configuration, base
 * recurring line items, one-time additions for the current cycle, and generation
 * history. Used by /billing/automated/new and /billing/automated/[id].
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { CustomerSelect } from "./customer-select";
import { LineItemEditor } from "./line-item-editor";
import {
  getAutomatedConfigById,
  createAutomatedConfig,
  updateAutomatedConfig,
  addOneTimeAddition,
  cancelOneTimeAddition,
  computeNextRunDate,
} from "@/lib/data/automated-invoices";
import type {
  AutomatedInvoiceConfig,
  AutomatedInvoiceConfigLineItem,
  AutomationGenerationMode,
  AutomationRecurrence,
  BillingLineItem,
} from "@zerpa/shared-types";

interface Props {
  configId?: string;
}

function todayIso() {
  return new Date().toISOString().split("T")[0];
}
function firstOfThisMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
}

interface ConfigForm {
  name: string;
  customerId: string;
  customerName: string;
  recurrence: AutomationRecurrence;
  startDate: string;
  endDate: string;
  dayOfMonth: number;
  generationMode: AutomationGenerationMode;
  paymentTermsDays: number;
  subjectTemplate: string;
  notesTemplate: string;
  internalNotes: string;
  isActive: boolean;
}

const BLANK: ConfigForm = {
  name: "",
  customerId: "",
  customerName: "",
  recurrence: "monthly_indefinite",
  startDate: todayIso(),
  endDate: "",
  dayOfMonth: 1,
  generationMode: "draft",
  paymentTermsDays: 30,
  subjectTemplate: "Monthly IT Services — {month} {year}",
  notesTemplate: "",
  internalNotes: "",
  isActive: true,
};

function toBillingItems(items: AutomatedInvoiceConfigLineItem[]): BillingLineItem[] {
  return items.map((it, i) => ({
    id: it.id,
    productServiceId: it.productServiceId ?? null,
    description: it.description,
    quantity: it.quantity,
    unit: it.unit ?? null,
    unitPrice: it.unitPrice,
    taxRate: it.taxRate ?? 15,
    discountPercent: 0,
    sortOrder: it.sortOrder ?? i,
  }));
}

function toConfigItems(items: BillingLineItem[]): AutomatedInvoiceConfigLineItem[] {
  return items.map((it, i) => ({
    id: it.id ?? `aicl-${Date.now()}-${i}`,
    productServiceId: it.productServiceId ?? null,
    customDescription: null,
    customUnitPrice: null,
    description: it.description,
    unit: it.unit ?? null,
    unitPrice: it.unitPrice,
    taxRate: it.taxRate ?? 15,
    quantity: it.quantity,
    sortOrder: i,
  }));
}

export function AutomatedConfigEditor({ configId }: Props) {
  const router = useRouter();
  const isEdit = Boolean(configId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<AutomatedInvoiceConfig | null>(null);
  const [form, setForm] = useState<ConfigForm>(BLANK);
  const [items, setItems] = useState<BillingLineItem[]>([]);

  // one-time addition form
  const [otDesc, setOtDesc] = useState("");
  const [otQty, setOtQty] = useState(1);
  const [otPrice, setOtPrice] = useState(0);

  function hydrate(c: AutomatedInvoiceConfig) {
    setConfig(c);
    setForm({
      name: c.name,
      customerId: c.customerId,
      customerName: c.customerName,
      recurrence: c.recurrence,
      startDate: c.startDate,
      endDate: c.endDate ?? "",
      dayOfMonth: c.dayOfMonth,
      generationMode: c.generationMode,
      paymentTermsDays: c.paymentTermsDays,
      subjectTemplate: c.subjectTemplate,
      notesTemplate: c.notesTemplate ?? "",
      internalNotes: c.internalNotes ?? "",
      isActive: c.isActive,
    });
    setItems(toBillingItems(c.lineItems));
  }

  useEffect(() => {
    if (!configId) return;
    getAutomatedConfigById(configId)
      .then((c) => {
        if (!c) {
          toast.error("Automation not found");
          router.push("/billing/automated");
          return;
        }
        hydrate(c);
      })
      .finally(() => setLoading(false));
  }, [configId, router]);

  function set<K extends keyof ConfigForm>(key: K, value: ConfigForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function persist(): Promise<AutomatedInvoiceConfig | null> {
    if (!form.customerId) {
      toast.error("Please select a customer");
      return null;
    }
    setSaving(true);
    try {
      const nextRun =
        config?.nextRunDate ??
        computeNextRunDate(new Date(form.startDate), form.dayOfMonth);
      const payload: Partial<AutomatedInvoiceConfig> = {
        name: form.name,
        customerId: form.customerId,
        customerName: form.customerName,
        recurrence: form.recurrence,
        startDate: form.startDate,
        endDate: form.recurrence === "monthly_indefinite" ? null : form.endDate || null,
        dayOfMonth: form.dayOfMonth,
        generationMode: form.generationMode,
        paymentTermsDays: form.paymentTermsDays,
        subjectTemplate: form.subjectTemplate,
        notesTemplate: form.notesTemplate || null,
        internalNotes: form.internalNotes || null,
        isActive: form.isActive,
        nextRunDate: nextRun,
        lineItems: toConfigItems(items),
      };
      const saved =
        isEdit && configId
          ? await updateAutomatedConfig(configId, payload)
          : await createAutomatedConfig(payload);
      hydrate(saved);
      return saved;
    } catch {
      toast.error("Could not save automation");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const saved = await persist();
    if (saved) {
      toast.success("Automation saved");
      if (!isEdit) router.push(`/billing/automated/${saved.id}`);
    }
  }

  async function handleAddOneTime() {
    if (!config) return;
    if (!otDesc || otPrice <= 0) {
      toast.error("Enter a description and price");
      return;
    }
    try {
      const updated = await addOneTimeAddition(config.id, {
        billingMonth: firstOfThisMonth(),
        description: otDesc,
        quantity: otQty,
        unitPrice: otPrice,
        taxRate: 15,
        productServiceId: null,
        unit: null,
        notes: null,
      });
      hydrate(updated);
      setOtDesc("");
      setOtQty(1);
      setOtPrice(0);
      toast.success("One-time item added");
    } catch {
      toast.error("Could not add item");
    }
  }

  async function handleCancelOneTime(additionId: string) {
    if (!config) return;
    try {
      const updated = await cancelOneTimeAddition(config.id, additionId);
      hydrate(updated);
      toast.success("Item cancelled");
    } catch {
      toast.error("Could not cancel item");
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-fg">Loading automation…</p>
        </div>
      </PageContainer>
    );
  }

  const additions = config?.oneTimeAdditions ?? [];

  return (
    <PageContainer>
      <button
        onClick={() => router.push("/billing/automated")}
        className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-foreground mb-4"
      >
        <ArrowLeft size={14} /> Back to Automated Invoices
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title text-foreground">
          {config ? config.name || "Automation" : "New Automation"}
        </h1>
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save size={14} className="mr-1.5" />
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* 1. Configuration */}
        <section className="rounded-[12px] border border-border bg-background p-5 space-y-4">
          <h2 className="section-title">Configuration</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Acme Corp — Monthly Retainer"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <CustomerSelect
                value={form.customerId}
                onChange={(id, customer) => {
                  set("customerId", id);
                  set("customerName", customer?.name ?? "");
                }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recurrence">Recurrence *</Label>
              <select
                id="recurrence"
                value={form.recurrence}
                onChange={(e) =>
                  set("recurrence", e.target.value as AutomationRecurrence)
                }
                className="w-full h-10 rounded-[8px] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="monthly_indefinite">Monthly (Indefinite)</option>
                <option value="monthly_fixed_term">Monthly (Fixed Term)</option>
                <option value="once">Once Only</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="generationMode">Generation Mode *</Label>
              <select
                id="generationMode"
                value={form.generationMode}
                onChange={(e) =>
                  set("generationMode", e.target.value as AutomationGenerationMode)
                }
                className="w-full h-10 rounded-[8px] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="draft">Save as Draft for review</option>
                <option value="auto_send">Send automatically</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            {form.recurrence !== "monthly_indefinite" && (
              <div className="space-y-1.5">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set("endDate", e.target.value)}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="dayOfMonth">Day of Month (1–28)</Label>
              <Input
                id="dayOfMonth"
                type="number"
                min={1}
                max={28}
                value={form.dayOfMonth}
                onChange={(e) =>
                  set("dayOfMonth", Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentTermsDays">Payment Terms (days)</Label>
              <Input
                id="paymentTermsDays"
                type="number"
                min={0}
                value={form.paymentTermsDays}
                onChange={(e) =>
                  set("paymentTermsDays", parseInt(e.target.value) || 0)
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="subjectTemplate">
              Subject Template{" "}
              <span className="text-muted-fg font-normal normal-case">
                (variables: {"{month}"}, {"{year}"}, {"{client_name}"})
              </span>
            </Label>
            <Input
              id="subjectTemplate"
              value={form.subjectTemplate}
              onChange={(e) => set("subjectTemplate", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notesTemplate">Notes Template</Label>
            <Textarea
              id="notesTemplate"
              value={form.notesTemplate}
              onChange={(e) => set("notesTemplate", e.target.value)}
              rows={2}
            />
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
            />
            Active
          </label>
        </section>

        {/* 2. Base line items */}
        <section className="space-y-2">
          <h2 className="section-title">Base Line Items</h2>
          <LineItemEditor items={items} onChange={setItems} showDiscount={false} />
        </section>

        {/* 3. One-time additions */}
        <section className="rounded-[12px] border border-border bg-background p-5 space-y-4">
          <div>
            <h2 className="section-title">One-Time Additions — This Cycle</h2>
            <p className="text-xs text-muted-fg mt-1">
              Items added here are included in the next generated invoice, then drop
              off automatically.
            </p>
          </div>

          {!config ? (
            <p className="text-sm text-muted-fg">
              Save the automation first to add one-time items.
            </p>
          ) : (
            <>
              {additions.length > 0 && (
                <div className="rounded-[8px] border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-surface text-left">
                        <th className="px-3 py-2 text-xs uppercase tracking-wide text-muted-fg font-semibold">Description</th>
                        <th className="px-3 py-2 text-xs uppercase tracking-wide text-muted-fg font-semibold text-right">Qty</th>
                        <th className="px-3 py-2 text-xs uppercase tracking-wide text-muted-fg font-semibold text-right">Unit Price</th>
                        <th className="px-3 py-2 text-xs uppercase tracking-wide text-muted-fg font-semibold">Status</th>
                        <th className="px-3 py-2 w-10" />
                      </tr>
                    </thead>
                    <tbody>
                      {additions.map((a) => (
                        <tr key={a.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2">{a.description}</td>
                          <td className="px-3 py-2 text-right font-mono">{a.quantity}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {formatCurrency(a.unitPrice)}
                          </td>
                          <td className="px-3 py-2 capitalize text-muted-fg">{a.status}</td>
                          <td className="px-3 py-2 text-center">
                            {a.status === "pending" && (
                              <button
                                onClick={() => handleCancelOneTime(a.id)}
                                className="text-muted-fg hover:text-danger"
                                title="Cancel"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_140px_auto] gap-2 items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="otDesc">Description</Label>
                  <Input
                    id="otDesc"
                    value={otDesc}
                    onChange={(e) => setOtDesc(e.target.value)}
                    placeholder="Extra work this month…"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="otQty">Qty</Label>
                  <Input
                    id="otQty"
                    type="number"
                    min={1}
                    value={otQty}
                    onChange={(e) => setOtQty(parseFloat(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="otPrice">Unit Price</Label>
                  <Input
                    id="otPrice"
                    type="number"
                    min={0}
                    step="any"
                    value={otPrice}
                    onChange={(e) => setOtPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Button type="button" variant="outline" onClick={handleAddOneTime}>
                  <Plus size={14} className="mr-1.5" />
                  Add
                </Button>
              </div>
            </>
          )}
        </section>

        {/* 4. Generation history */}
        <section className="rounded-[12px] border border-border bg-background p-5">
          <h2 className="section-title mb-2">Generation History</h2>
          {config?.lastRunDate ? (
            <p className="text-sm text-muted-fg">
              Last generated {formatDate(config.lastRunDate)}. Next run{" "}
              {formatDate(config.nextRunDate)}.
            </p>
          ) : (
            <p className="text-sm text-muted-fg">
              No invoices generated yet. First run scheduled for{" "}
              {config ? formatDate(config.nextRunDate) : "—"}.
            </p>
          )}
        </section>
      </div>
    </PageContainer>
  );
}
