/**
 * @file components/modules/billing/invoice-editor.tsx
 * @description Invoice create/edit + detail screen. Split layout: left = editable
 * form + line items; right = totals, status, provenance banner, payments list,
 * record-payment form and status actions. Used by /billing/invoices/new and
 * /billing/invoices/[id].
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, CheckCircle2, Ban, Plus, FileText } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { CustomerSelect } from "./customer-select";
import { LineItemEditor } from "./line-item-editor";
import { TotalsPanel } from "./totals-panel";
import { DocumentPreviewModal } from "./document-preview-modal";
import {
  getBillingInvoiceById,
  createManualInvoice,
  updateBillingInvoice,
  updateBillingInvoiceStatus,
  recordInvoicePayment,
} from "@/lib/data/invoices";
import type {
  BillingLineItem,
  DiscountType,
  Invoice,
  InvoiceLineItem,
  PaymentMethod,
  Vertical,
} from "@zerpa/shared-types";

interface InvoiceEditorProps {
  invoiceId?: string;
}

function todayIso() {
  return new Date().toISOString().split("T")[0];
}
function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

interface EditorState {
  customerId: string;
  customerName: string;
  customerVertical: Vertical;
  contactEmail: string;
  reference: string;
  issuedDate: string;
  dueDate: string;
  salesRep: string;
  subject: string;
  notes: string;
  internalNotes: string;
  discountType: DiscountType;
  discountValue: number;
}

const BLANK: EditorState = {
  customerId: "",
  customerName: "",
  customerVertical: "FUNERAL",
  contactEmail: "",
  reference: "",
  issuedDate: todayIso(),
  dueDate: addDaysIso(30),
  salesRep: "",
  subject: "",
  notes: "",
  internalNotes: "",
  discountType: "none",
  discountValue: 0,
};

export function InvoiceEditor({ invoiceId }: InvoiceEditorProps) {
  const router = useRouter();
  const isEdit = Boolean(invoiceId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState<EditorState>(BLANK);
  const [items, setItems] = useState<BillingLineItem[]>([]);
  const [previewDoc, setPreviewDoc] = useState<Invoice | null>(null);

  // record-payment form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState<string>(todayIso());
  const [payMethod, setPayMethod] = useState<PaymentMethod>("eft");
  const [payRef, setPayRef] = useState<string>("");

  function hydrate(inv: Invoice) {
    setInvoice(inv);
    setForm({
      customerId: inv.tenantId,
      customerName: inv.tenantName,
      customerVertical: inv.tenantVertical,
      contactEmail: inv.contactEmail ?? "",
      reference: inv.reference ?? "",
      issuedDate: inv.issuedDate,
      dueDate: inv.dueDate,
      salesRep: inv.salesRep ?? "",
      subject: inv.subject ?? "",
      notes: inv.notes ?? "",
      internalNotes: inv.internalNotes ?? "",
      discountType: inv.discountType ?? "none",
      discountValue: inv.discountValue ?? 0,
    });
    setItems(inv.lineItems as BillingLineItem[]);
    setPayAmount(inv.balanceDue ?? inv.total);
  }

  useEffect(() => {
    if (!invoiceId) return;
    getBillingInvoiceById(invoiceId)
      .then((inv) => {
        if (!inv) {
          toast.error("Invoice not found");
          router.push("/billing/invoices");
          return;
        }
        hydrate(inv);
      })
      .finally(() => setLoading(false));
  }, [invoiceId, router]);

  function set<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function payload(): Partial<Invoice> {
    return {
      tenantId: form.customerId,
      tenantName: form.customerName,
      tenantVertical: form.customerVertical,
      contactEmail: form.contactEmail || null,
      reference: form.reference || null,
      issuedDate: form.issuedDate,
      dueDate: form.dueDate,
      salesRep: form.salesRep || null,
      subject: form.subject || null,
      notes: form.notes || undefined,
      internalNotes: form.internalNotes || null,
      discountType: form.discountType,
      discountValue: form.discountValue,
      lineItems: items as InvoiceLineItem[],
    };
  }

  async function persist(): Promise<Invoice | null> {
    if (!form.customerId) {
      toast.error("Please select a customer");
      return null;
    }
    setSaving(true);
    try {
      const saved =
        isEdit && invoiceId
          ? await updateBillingInvoice(invoiceId, payload())
          : await createManualInvoice(payload());
      hydrate(saved);
      return saved;
    } catch {
      toast.error("Could not save invoice");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const saved = await persist();
    if (saved) {
      toast.success("Invoice saved");
      if (!isEdit) router.push(`/billing/invoices/${saved.id}`);
    }
  }

  async function handlePreview() {
    const saved = await persist();
    if (saved) setPreviewDoc(saved);
  }

  async function handleStatus(status: Invoice["status"]) {
    if (!invoice) return;
    try {
      const updated = await updateBillingInvoiceStatus(invoice.id, status);
      hydrate(updated);
      toast.success(`Invoice ${status.toLowerCase()}`);
    } catch {
      toast.error("Could not update invoice");
    }
  }

  async function handleRecordPayment() {
    if (!invoice) return;
    if (payAmount <= 0) {
      toast.error("Enter a payment amount");
      return;
    }
    try {
      const updated = await recordInvoicePayment(invoice.id, {
        amount: payAmount,
        paymentDate: payDate,
        method: payMethod,
        reference: payRef || null,
      });
      hydrate(updated);
      setPayRef("");
      toast.success("Payment recorded");
    } catch {
      toast.error("Could not record payment");
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-fg">Loading invoice…</p>
        </div>
      </PageContainer>
    );
  }

  const payments = invoice?.payments ?? [];

  return (
    <PageContainer>
      <button
        onClick={() => router.push("/billing/invoices")}
        className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-foreground mb-4"
      >
        <ArrowLeft size={14} /> Back to Invoices
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title text-foreground">
            {invoice ? invoice.invoiceNumber : "New Invoice"}
          </h1>
          {invoice && (
            <p className="text-sm text-muted-fg mt-1">
              Issued {formatDate(invoice.issuedDate)} · Due{" "}
              {formatDate(invoice.dueDate)}
            </p>
          )}
        </div>
        {invoice && <StatusBadge status={invoice.status} />}
      </div>

      {/* Provenance banners */}
      {invoice?.source === "converted_quote" && invoice.quoteId && (
        <div className="rounded-[8px] bg-funeral-bg border border-[rgba(109,40,217,0.20)] px-4 py-2.5 mb-4 text-sm text-funeral flex items-center justify-between">
          <span>Converted from a quote.</span>
          <button
            onClick={() => router.push(`/billing/quotes/${invoice.quoteId}`)}
            className="hover:underline font-medium"
          >
            View quote →
          </button>
        </div>
      )}
      {invoice?.source === "automated" && (
        <div className="rounded-[8px] bg-info-bg border border-info-ring px-4 py-2.5 mb-4 text-sm text-info">
          Generated automatically from an automation config.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-[12px] border border-border bg-background p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Customer *</Label>
                <CustomerSelect
                  value={form.customerId}
                  onChange={(id, customer) => {
                    set("customerId", id);
                    set("customerName", customer?.name ?? "");
                    if (customer?.vertical)
                      set("customerVertical", customer.vertical);
                    if (customer?.contactEmail)
                      set("contactEmail", customer.contactEmail);
                  }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reference">Reference</Label>
                <Input
                  id="reference"
                  value={form.reference}
                  onChange={(e) => set("reference", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="salesRep">Sales Rep</Label>
                <Input
                  id="salesRep"
                  value={form.salesRep}
                  onChange={(e) => set("salesRep", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="issuedDate">Issue Date</Label>
                <Input
                  id="issuedDate"
                  type="date"
                  value={form.issuedDate}
                  onChange={(e) => set("issuedDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => set("dueDate", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Line Items</Label>
            <LineItemEditor items={items} onChange={setItems} />
          </div>

          <div className="rounded-[12px] border border-border bg-background p-5 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (printed on invoice)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="internalNotes">Internal Notes (not printed)</Label>
              <Textarea
                id="internalNotes"
                value={form.internalNotes}
                onChange={(e) => set("internalNotes", e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <TotalsPanel
            items={items}
            discountType={form.discountType}
            discountValue={form.discountValue}
            editable
            onDiscountChange={(type, value) => {
              set("discountType", type);
              set("discountValue", value);
            }}
          />

          <div className="rounded-[12px] border border-border bg-background p-5 space-y-2">
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              <Save size={14} className="mr-1.5" />
              {saving ? "Saving…" : "Save Invoice"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handlePreview}
              disabled={saving}
            >
              <FileText size={14} className="mr-1.5" />
              Preview / Download PDF
            </Button>
            {invoice && (
              <>
                {invoice.status === "DRAFT" && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStatus("APPROVED")}
                  >
                    <CheckCircle2 size={14} className="mr-1.5" />
                    Approve
                  </Button>
                )}
                {["DRAFT", "APPROVED", "OVERDUE", "PARTIALLY_PAID"].includes(
                  invoice.status
                ) && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStatus("SENT")}
                  >
                    <Send size={14} className="mr-1.5" />
                    Mark Sent
                  </Button>
                )}
                {invoice.status !== "VOID" && invoice.status !== "PAID" && (
                  <Button
                    variant="ghost"
                    className="w-full text-danger hover:text-danger hover:bg-danger-bg"
                    onClick={() => handleStatus("VOID")}
                  >
                    <Ban size={14} className="mr-1.5" />
                    Void Invoice
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Payments */}
          {invoice && (
            <div className="rounded-[12px] border border-border bg-background p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-fg">
                  Payments
                </span>
                <span className="font-mono text-sm">
                  {formatCurrency(invoice.amountPaid ?? 0)} /{" "}
                  {formatCurrency(invoice.total)}
                </span>
              </div>

              {payments.length > 0 && (
                <ul className="space-y-1.5">
                  {payments.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between text-sm border-b border-border pb-1.5 last:border-0"
                    >
                      <span className="text-muted-fg">
                        {formatDate(p.paymentDate)} · {p.method.toUpperCase()}
                      </span>
                      <span className="font-mono">{formatCurrency(p.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}

              {invoice.status !== "PAID" &&
                invoice.status !== "VOID" &&
                invoice.status !== "DRAFT" && (
                  <div className="space-y-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        min={0}
                        step="any"
                        value={payAmount}
                        onChange={(e) =>
                          setPayAmount(parseFloat(e.target.value) || 0)
                        }
                        placeholder="Amount"
                      />
                      <Input
                        type="date"
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={payMethod}
                        onChange={(e) =>
                          setPayMethod(e.target.value as PaymentMethod)
                        }
                        className="h-10 rounded-[8px] border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="eft">EFT</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="other">Other</option>
                      </select>
                      <Input
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        placeholder="Reference"
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleRecordPayment}
                    >
                      <Plus size={14} className="mr-1.5" />
                      Record Payment
                    </Button>
                  </div>
                )}
              {invoice.status === "DRAFT" && (
                <p className="text-xs text-muted-fg">
                  Approve or send the invoice before recording payments.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <DocumentPreviewModal
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        kind="invoice"
        invoice={previewDoc ?? undefined}
      />
    </PageContainer>
  );
}
