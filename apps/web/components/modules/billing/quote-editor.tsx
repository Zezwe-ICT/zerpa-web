/**
 * @file components/modules/billing/quote-editor.tsx
 * @description Quote create/edit screen. Split layout: left = editable form
 * (customer, subject, scope, line items, notes, terms); right = live totals,
 * status and actions (save, send, convert to invoice). Used by both
 * /billing/quotes/new and /billing/quotes/[id].
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, FileOutput, FileText } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { CustomerSelect } from "./customer-select";
import { LineItemEditor } from "./line-item-editor";
import { TotalsPanel } from "./totals-panel";
import { DocumentPreviewModal } from "./document-preview-modal";
import {
  getQuoteById,
  createQuote,
  updateQuote,
  updateQuoteStatus,
  convertQuoteToInvoice,
} from "@/lib/data/quotes";
import type {
  BillingLineItem,
  DiscountType,
  Quote,
} from "@zerpa/shared-types";

interface QuoteEditorProps {
  quoteId?: string;
}

interface EditorState {
  customerId: string;
  customerName: string;
  contactPerson: string;
  contactEmail: string;
  reference: string;
  issueDate: string;
  expiryDate: string;
  salesRep: string;
  subject: string;
  scopeOfWork: string;
  paymentTerms: string;
  notes: string;
  termsAndConditions: string;
  internalNotes: string;
  discountType: DiscountType;
  discountValue: number;
}

function todayIso() {
  return new Date().toISOString().split("T")[0];
}
function addDaysIso(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

const BLANK: EditorState = {
  customerId: "",
  customerName: "",
  contactPerson: "",
  contactEmail: "",
  reference: "",
  issueDate: todayIso(),
  expiryDate: addDaysIso(30),
  salesRep: "",
  subject: "",
  scopeOfWork: "",
  paymentTerms: "",
  notes: "",
  termsAndConditions: "",
  internalNotes: "",
  discountType: "none",
  discountValue: 0,
};

export function QuoteEditor({ quoteId }: QuoteEditorProps) {
  const router = useRouter();
  const isEdit = Boolean(quoteId);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [form, setForm] = useState<EditorState>(BLANK);
  const [items, setItems] = useState<BillingLineItem[]>([]);
  const [previewDoc, setPreviewDoc] = useState<Quote | null>(null);

  useEffect(() => {
    if (!quoteId) return;
    getQuoteById(quoteId)
      .then((q) => {
        if (!q) {
          toast.error("Quote not found");
          router.push("/billing/quotes");
          return;
        }
        setQuote(q);
        setForm({
          customerId: q.customerId,
          customerName: q.customerName,
          contactPerson: q.contactPerson ?? "",
          contactEmail: q.contactEmail ?? "",
          reference: q.reference ?? "",
          issueDate: q.issueDate,
          expiryDate: q.expiryDate,
          salesRep: q.salesRep ?? "",
          subject: q.subject ?? "",
          scopeOfWork: q.scopeOfWork ?? "",
          paymentTerms: q.paymentTerms ?? "",
          notes: q.notes ?? "",
          termsAndConditions: q.termsAndConditions ?? "",
          internalNotes: q.internalNotes ?? "",
          discountType: q.discountType,
          discountValue: q.discountValue,
        });
        setItems(q.lineItems);
      })
      .finally(() => setLoading(false));
  }, [quoteId, router]);

  function set<K extends keyof EditorState>(key: K, value: EditorState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function buildPayload(): Partial<Quote> {
    return {
      ...form,
      contactPerson: form.contactPerson || null,
      contactEmail: form.contactEmail || null,
      reference: form.reference || null,
      subject: form.subject || null,
      scopeOfWork: form.scopeOfWork || null,
      paymentTerms: form.paymentTerms || null,
      notes: form.notes || null,
      termsAndConditions: form.termsAndConditions || null,
      internalNotes: form.internalNotes || null,
      lineItems: items,
    };
  }

  async function persist(): Promise<Quote | null> {
    if (!form.customerId) {
      toast.error("Please select a customer");
      return null;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      const saved =
        isEdit && quoteId
          ? await updateQuote(quoteId, payload)
          : await createQuote(payload);
      setQuote(saved);
      return saved;
    } catch {
      toast.error("Could not save quote");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const saved = await persist();
    if (saved) {
      toast.success("Quote saved");
      if (!isEdit) router.push(`/billing/quotes/${saved.id}`);
    }
  }

  async function handleSend() {
    const saved = await persist();
    if (!saved) return;
    await updateQuoteStatus(saved.id, "sent");
    toast.success("Quote marked as sent");
    router.push(`/billing/quotes/${saved.id}`);
  }

  async function handleConvert() {
    const saved = await persist();
    if (!saved) return;
    try {
      const invoice = await convertQuoteToInvoice(saved.id);
      toast.success(`Converted to ${invoice.invoiceNumber}`);
      router.push(`/billing/invoices/${invoice.id}`);
    } catch {
      toast.error("Conversion failed");
    }
  }

  async function handlePreview() {
    // Persist first so the PDF reflects the latest edits and computed totals.
    const saved = await persist();
    if (saved) setPreviewDoc(saved);
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-fg">Loading quote…</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <button
        onClick={() => router.push("/billing/quotes")}
        className="flex items-center gap-1.5 text-sm text-muted-fg hover:text-foreground mb-4"
      >
        <ArrowLeft size={14} /> Back to Quotes
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title text-foreground">
            {quote ? quote.quoteNumber : "New Quote"}
          </h1>
          {quote && (
            <p className="text-sm text-muted-fg mt-1">
              Created {quote.createdAt.split("T")[0]}
            </p>
          )}
        </div>
        {quote && <StatusBadge status={quote.status} />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-[12px] border border-border bg-background p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="customer">Customer *</Label>
                <CustomerSelect
                  value={form.customerId}
                  onChange={(id, customer) => {
                    set("customerId", id);
                    set("customerName", customer?.name ?? "");
                    if (customer?.contactPerson)
                      set("contactPerson", customer.contactPerson);
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
                  placeholder="Internal reference"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contactPerson">Contact Person</Label>
                <Input
                  id="contactPerson"
                  value={form.contactPerson}
                  onChange={(e) => set("contactPerson", e.target.value)}
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
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={form.issueDate}
                  onChange={(e) => set("issueDate", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expiryDate">Valid Until</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => set("expiryDate", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => set("subject", e.target.value)}
                placeholder="One-line description of what this quote is for"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="scope">Scope of Work</Label>
              <Textarea
                id="scope"
                value={form.scopeOfWork}
                onChange={(e) => set("scopeOfWork", e.target.value)}
                rows={3}
                placeholder="Detailed description of work / deliverables"
              />
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <Label>Line Items</Label>
            <LineItemEditor items={items} onChange={setItems} />
          </div>

          <div className="rounded-[12px] border border-border bg-background p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  value={form.paymentTerms}
                  onChange={(e) => set("paymentTerms", e.target.value)}
                  placeholder="e.g. 50% upfront, 50% on completion"
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes (visible to customer)</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="terms">Terms &amp; Conditions</Label>
              <Textarea
                id="terms"
                value={form.termsAndConditions}
                onChange={(e) => set("termsAndConditions", e.target.value)}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="internalNotes">Internal Notes (staff only)</Label>
              <Textarea
                id="internalNotes"
                value={form.internalNotes}
                onChange={(e) => set("internalNotes", e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Right: totals + actions */}
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
              {saving ? "Saving…" : "Save Quote"}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSend}
              disabled={saving}
            >
              <Send size={14} className="mr-1.5" />
              Save &amp; Mark Sent
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
            <Button
              variant="outline"
              className="w-full"
              onClick={handleConvert}
              disabled={saving || quote?.status === "converted"}
            >
              <FileOutput size={14} className="mr-1.5" />
              Convert to Invoice
            </Button>
            {quote?.convertedInvoiceId && (
              <button
                onClick={() =>
                  router.push(`/billing/invoices/${quote.convertedInvoiceId}`)
                }
                className="w-full text-center text-xs text-primary hover:underline pt-1"
              >
                View converted invoice →
              </button>
            )}
          </div>
        </div>
      </div>

      <DocumentPreviewModal
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        kind="quote"
        quote={previewDoc ?? undefined}
      />
    </PageContainer>
  );
}
