/**
 * @file lib/data/quotes.ts
 * @description Data layer for Quotes. In-memory store seeded from MOCK_QUOTES
 * (no backend yet — see lib/data/products.ts note). Also handles quote→invoice
 * conversion by creating an invoice via lib/data/invoices.ts.
 */
import type { Quote, QuoteStatus, QuoteLineItem, Invoice, Vertical } from "@zerpa/shared-types";
import { MOCK_QUOTES } from "@/lib/mock/quotes";
import { computeBillingTotals, computeLineTotal } from "@/lib/utils/billing-calc";
import {
  generateQuoteNumber,
  nextSequenceForYear,
} from "@/lib/utils/invoice-number";
import { createInvoiceFromQuote } from "./invoices";

const MOCK_DELAY = 250;
const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY));

let store: Quote[] = MOCK_QUOTES.map((q) => ({ ...q }));

const nowIso = () => new Date().toISOString();

/** Recompute lineTotal on each item and roll up document totals onto the quote. */
function withComputedTotals(quote: Quote): Quote {
  const lineItems = quote.lineItems.map((li, i) => ({
    ...li,
    sortOrder: li.sortOrder ?? i,
    lineTotal: computeLineTotal(li),
  }));
  const totals = computeBillingTotals(
    lineItems,
    quote.discountType,
    quote.discountValue
  );
  return {
    ...quote,
    lineItems,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    taxTotal: totals.taxTotal,
    total: totals.total,
  };
}

export async function getQuotes(): Promise<Quote[]> {
  await delay();
  return store.map((q) => ({ ...q }));
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  await delay();
  const found = store.find((q) => q.id === id);
  return found ? { ...found } : null;
}

export async function createQuote(data: Partial<Quote>): Promise<Quote> {
  await delay();
  const seq = nextSequenceForYear(
    store.map((q) => q.quoteNumber),
    "QUO"
  );
  const issueDate = data.issueDate ?? nowIso().split("T")[0];
  const base: Quote = {
    id: `quo-${Date.now()}`,
    quoteNumber: data.quoteNumber ?? generateQuoteNumber(seq),
    customerId: data.customerId ?? "",
    customerName: data.customerName ?? "",
    contactPerson: data.contactPerson ?? null,
    contactEmail: data.contactEmail ?? null,
    status: data.status ?? "draft",
    reference: data.reference ?? null,
    issueDate,
    expiryDate: data.expiryDate ?? addDays(issueDate, 30),
    currency: data.currency ?? "ZAR",
    salesRep: data.salesRep ?? null,
    subject: data.subject ?? null,
    scopeOfWork: data.scopeOfWork ?? null,
    termsAndConditions: data.termsAndConditions ?? null,
    paymentTerms: data.paymentTerms ?? null,
    notes: data.notes ?? null,
    internalNotes: data.internalNotes ?? null,
    discountType: data.discountType ?? "none",
    discountValue: data.discountValue ?? 0,
    subtotal: 0,
    discountAmount: 0,
    taxTotal: 0,
    total: 0,
    convertedInvoiceId: null,
    lineItems: (data.lineItems ?? []) as QuoteLineItem[],
    createdBy: data.createdBy,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    sentAt: null,
  };
  const quote = withComputedTotals(base);
  store = [quote, ...store];
  return { ...quote };
}

export async function updateQuote(
  id: string,
  data: Partial<Quote>
): Promise<Quote> {
  await delay();
  const idx = store.findIndex((q) => q.id === id);
  if (idx === -1) throw new Error("Quote not found");
  const merged = { ...store[idx], ...data, id, updatedAt: nowIso() };
  store[idx] = withComputedTotals(merged);
  return { ...store[idx] };
}

export async function updateQuoteStatus(
  id: string,
  status: QuoteStatus
): Promise<Quote> {
  const patch: Partial<Quote> = { status };
  if (status === "sent") patch.sentAt = nowIso();
  return updateQuote(id, patch);
}

export async function deleteQuote(id: string): Promise<void> {
  await delay();
  store = store.filter((q) => q.id !== id);
}

export async function duplicateQuote(id: string): Promise<Quote> {
  const original = await getQuoteById(id);
  if (!original) throw new Error("Quote not found");
  const { id: _id, quoteNumber: _qn, convertedInvoiceId: _c, ...rest } = original;
  return createQuote({ ...rest, status: "draft" });
}

/**
 * Convert a quote to a DRAFT invoice. Clones line items, sets source metadata,
 * marks the quote 'converted' and links the two records.
 */
export async function convertQuoteToInvoice(
  id: string,
  vertical: Vertical = "FUNERAL"
): Promise<Invoice> {
  const quote = await getQuoteById(id);
  if (!quote) throw new Error("Quote not found");

  const invoice = await createInvoiceFromQuote(quote, vertical);
  await updateQuote(id, {
    status: "converted",
    convertedInvoiceId: invoice.id,
  });
  return invoice;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
