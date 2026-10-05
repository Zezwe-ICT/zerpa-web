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
import { Chatter } from "@/components/chatter/chatter";
import { ArrowLeft, Save, Send, FileOutput, FileText, Copy, MessageCircle, ExternalLink, CheckCircle2, XCircle, Link2 } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { CustomerSelect } from "./customer-select";
import { getBillingCustomerById } from "@/lib/data/billing-customers";
import { shareQuote, whatsappShareUrl } from "@/lib/api/payments";
import { requestApproval } from "@/lib/api/approvals";
import { ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDatetime } from "@/lib/utils/dates";
import { computeBillingTotals } from "@/lib/utils/billing-calc";
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
  depositPercent: number;
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
  depositPercent: 0,
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

  // "Quote" button on the Customers page opens /billing/quotes/new?customer=<id>.
  useEffect(() => {
    if (quoteId) return;
    const customerId = new URLSearchParams(window.location.search).get("customer");
    if (!customerId) return;
    getBillingCustomerById(customerId).then((c) => {
      if (!c) return;
      setForm((f) => ({
        ...f,
        customerId: c.id,
        customerName: c.name,
        contactPerson: c.contactPerson ?? f.contactPerson,
        contactEmail: c.contactEmail ?? f.contactEmail,
      }));
    });
  }, [quoteId]);

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
          depositPercent: q.depositPercent ?? 0,
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
    // Accepted / converted / declined quotes are locked; use them as they are.
    if (quote && !["draft", "sent"].includes(quote.status)) return quote;
    if (!form.customerId) {
      toast.error("Please select a customer");
      return null;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      // Once a new quote has been saved (e.g. by Preview or Copy link), keep updating that one.
      const existingId = quoteId ?? quote?.id;
      const saved = existingId ? await updateQuote(existingId, payload) : await createQuote(payload);
      setQuote(saved);
      if (!quoteId) window.history.replaceState(null, "", `/billing/quotes/${saved.id}`);
      return saved;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save quote");
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
    try {
      const sent = saved.status === "sent" ? saved : await updateQuoteStatus(saved.id, "sent");
      setQuote(sent);
      toast.success("Quote marked as sent");
      router.push(`/billing/quotes/${saved.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark the quote as sent");
    }
  }

  async function handleConvert() {
    const saved = await persist();
    if (!saved) return;
    try {
      const invoice = await convertQuoteToInvoice(saved.id);
      toast.success(`Converted to ${invoice.invoiceNumber}`);
      router.push(`/billing/invoices/${invoice.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Conversion failed");
    }
  }

  const [sharing, setSharing] = useState(false);

  /** Saves pending edits, then gets the customer link (sharing a draft marks it sent). */
  async function getShareLink(): Promise<string | null> {
    const saved = await persist();
    if (!saved) return null;
    if (saved.shareUrl && saved.status !== "draft") return saved.shareUrl;
    setSharing(true);
    try {
      const shared = await shareQuote(saved.id);
      setQuote(shared);
      return shared.shareUrl ?? null;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create the quote link");
      return null;
    } finally {
      setSharing(false);
    }
  }

  async function copyShareLink() {
    const url = await getShareLink();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Quote link copied — your customer can accept it online");
    } catch {
      toast.message(url);
    }
  }

  async function shareOnWhatsApp() {
    const url = await getShareLink();
    if (!url || !quote) return;
    const text = `Hi ${form.contactPerson || form.customerName || "there"}, here is our quote ${quote.quoteNumber} for ${formatCurrency(quote.total)}. You can view and accept it here: ${url}`;
    window.open(whatsappShareUrl(text), "_blank", "noopener");
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
      {quote?.emailDelivery && (
        <p className="text-sm text-muted-fg mb-4">
          Email {quote.emailDelivery.status}
          {quote.emailDelivery.note ? ` — ${quote.emailDelivery.note}` : ""}
        </p>
      )}

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
                  fallbackName={form.customerName}
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
          {quote && <Chatter recordType="quote" recordId={quote.id} />}
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

          {/* Customer response / online acceptance */}
          {quote && ["accepted", "converted"].includes(quote.status) && (
            <div className="rounded-[12px] border border-primary/40 bg-primary/5 p-5 space-y-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                <CheckCircle2 size={16} /> Accepted
              </p>
              <p className="text-sm">
                {quote.responderName ? `Signed by ${quote.responderName}` : "Marked accepted"}
                {quote.respondedAt ? ` on ${formatDatetime(quote.respondedAt)}` : ""}
                {quote.responderEmail ? ` (${quote.responderEmail})` : ""}.
              </p>
              {quote.signature && (
                <details className="rounded-[8px] border border-border bg-background p-3 text-sm">
                  <summary className="cursor-pointer font-medium">Signature and signing record</summary>
                  <div className="mt-3 space-y-2">
                    {quote.signature.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={quote.signature.image} alt={`Signature of ${quote.signature.name}`} className="h-20 w-auto rounded border border-border bg-white p-1" />
                    ) : (
                      <p className="text-2xl italic" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{quote.signature.name}</p>
                    )}
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                      <dt className="text-muted-fg">Method</dt><dd>{quote.signature.method === "drawn" ? "Drawn signature" : "Typed name"}</dd>
                      <dt className="text-muted-fg">Signed</dt><dd>{quote.signature.at ? formatDatetime(quote.signature.at) : "—"}</dd>
                      <dt className="text-muted-fg">IP address</dt><dd className="font-mono">{quote.signature.ip ?? "—"}</dd>
                      <dt className="text-muted-fg">Browser</dt><dd className="truncate" title={quote.signature.userAgent ?? ""}>{quote.signature.userAgent ?? "—"}</dd>
                      <dt className="text-muted-fg">Fingerprint</dt><dd className="font-mono break-all">{quote.signature.contentHash}</dd>
                    </dl>
                    <p className={quote.signature.unchanged ? "text-xs text-success" : "text-xs text-danger font-medium"}>
                      {quote.signature.unchanged
                        ? "The quote is exactly as it was when it was signed."
                        : "This quote was changed after it was signed. The customer signed an earlier version."}
                    </p>
                  </div>
                </details>
              )}
              {quote.deposit?.invoiceId && (
                <div className="rounded-[8px] border border-border bg-background p-3 text-sm space-y-1">
                  <p className="flex items-center justify-between gap-2">
                    <span>
                      Deposit {formatCurrency(quote.deposit.amount)} · {quote.deposit.invoiceNumber}
                    </span>
                    <span className={quote.deposit.paid ? "text-primary font-medium" : "text-muted-fg"}>
                      {quote.deposit.paid ? "Paid" : "Waiting for payment"}
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push(`/billing/invoices/${quote.deposit!.invoiceId}`)}
                    className="text-xs text-primary hover:underline"
                  >
                    View deposit invoice →
                  </button>
                </div>
              )}
              {quote.status === "accepted" && (
                <Button className="w-full" onClick={handleConvert} disabled={saving}>
                  <FileOutput size={14} className="mr-1.5" />
                  {quote.deposit?.invoiceId ? "Invoice the balance" : "Create the invoice"}
                </Button>
              )}
            </div>
          )}
          {quote?.status === "declined" && (
            <div className="rounded-[12px] border border-border p-5 space-y-2">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <XCircle size={16} className="text-danger" /> Declined
                {quote.respondedAt ? ` on ${formatDatetime(quote.respondedAt)}` : ""}
              </p>
              {quote.declineReason && <p className="text-sm text-muted-fg">&ldquo;{quote.declineReason}&rdquo;</p>}
              <p className="text-xs text-muted-fg">Duplicate the quote from the list to send a revised version.</p>
            </div>
          )}
          {(!quote || ["draft", "sent"].includes(quote.status)) && (
            <div className="rounded-[12px] border border-primary/30 bg-primary/5 p-5 space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary flex items-center gap-1.5">
                  <Link2 size={12} /> Get it accepted online
                </p>
                <p className="text-sm mt-1">
                  Send your customer a link to view the quote and accept it with their name — no printing or scanning.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="depositPercent" className="text-xs">
                  Deposit when they accept
                </Label>
                <div className="flex items-center gap-2">
                  <select
                    id="depositPercent"
                    value={[0, 25, 50, 100].includes(form.depositPercent) ? String(form.depositPercent) : "custom"}
                    onChange={(e) => set("depositPercent", e.target.value === "custom" ? 30 : Number(e.target.value))}
                    className="h-9 flex-1 rounded-[6px] border border-border bg-background px-2 text-sm"
                  >
                    <option value="0">No deposit</option>
                    <option value="25">25%</option>
                    <option value="50">50%</option>
                    <option value="100">Full amount upfront</option>
                    <option value="custom">Other %</option>
                  </select>
                  {![0, 25, 50, 100].includes(form.depositPercent) && (
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      className="h-9 w-20"
                      value={form.depositPercent}
                      onChange={(e) => set("depositPercent", Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                      aria-label="Deposit percentage"
                    />
                  )}
                </div>
                {form.depositPercent > 0 && (
                  <p className="text-xs text-muted-fg">
                    {formatCurrency(
                      Math.round(computeBillingTotals(items, form.discountType, form.discountValue).total * form.depositPercent) / 100,
                    )}{" "}
                    invoiced the moment they accept, with a link to pay it straight away. The balance is invoiced when you
                    convert the quote.
                  </p>
                )}
              </div>
              {quote?.approval?.required && quote.approval.status !== "approved" && (
                <div className="rounded-[8px] border border-warning-ring bg-warning-bg p-3 text-sm space-y-2">
                  <p>
                    Quotes over {formatCurrency(quote.approval.limit ?? 0)} need approval before you send them.
                    {quote.approval.status === "pending" && " Waiting for a manager."}
                    {quote.approval.status === "rejected" && ` Not approved${quote.approval.note ? `: ${quote.approval.note}` : "."}`}
                    {quote.approval.status === "stale" && " The total went up after it was approved."}
                  </p>
                  {quote.approval.status !== "pending" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await requestApproval({ relatedType: "quote", relatedId: quote.id });
                          setQuote({ ...quote, approval: { ...quote.approval!, status: "pending" } });
                          toast.success("Sent for approval");
                        } catch (e) {
                          toast.error(e instanceof ApiError ? e.message : "Could not request approval");
                        }
                      }}
                    >
                      Request approval
                    </Button>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={copyShareLink} disabled={saving || sharing}>
                  <Copy size={14} className="mr-1.5" /> Copy link
                </Button>
                <Button variant="outline" size="sm" onClick={shareOnWhatsApp} disabled={saving || sharing}>
                  <MessageCircle size={14} className="mr-1.5" /> WhatsApp
                </Button>
              </div>
              {quote?.shareUrl && quote.status === "sent" && (
                <a
                  href={quote.shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink size={12} /> See what your customer sees
                </a>
              )}
            </div>
          )}

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
