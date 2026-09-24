/**
 * @file lib/data/quotes.ts
 * @description Data layer for Quotes. Live mode uses /billing/quotes (the API owns numbering,
 * totals, status rules and quote→invoice conversion). Mock mode keeps an in-memory store
 * seeded from MOCK_QUOTES for demos.
 */
import type { Quote, QuoteStatus, QuoteLineItem, Invoice, Vertical } from "@zerpa/shared-types";
import { CONFIG } from "@/lib/config";
import { apiRequest } from "@/lib/api/client";
import { MOCK_QUOTES } from "@/lib/mock/quotes";
import { computeBillingTotals, computeLineTotal } from "@/lib/utils/billing-calc";
import {
  generateQuoteNumber,
  nextSequenceForYear,
} from "@/lib/utils/invoice-number";
import { createInvoiceFromQuote, getBillingInvoiceById } from "./invoices";

/** Only the fields the API accepts; totals are recomputed server-side. */
function toApiBody(data: Partial<Quote>): Record<string, unknown> {
  const body: Record<string, unknown> = {
    customerId: data.customerId,
    customerName: data.customerName,
    contactPerson: data.contactPerson,
    contactEmail: data.contactEmail,
    reference: data.reference,
    issueDate: data.issueDate,
    expiryDate: data.expiryDate,
    salesRep: data.salesRep,
    subject: data.subject,
    scopeOfWork: data.scopeOfWork,
    termsAndConditions: data.termsAndConditions,
    paymentTerms: data.paymentTerms,
    notes: data.notes,
    internalNotes: data.internalNotes,
    discountType: data.discountType,
    discountValue: data.discountValue,
    depositPercent: data.depositPercent,
    lineItems: data.lineItems?.map((li) => ({
      id: li.id,
      productServiceId: li.productServiceId ?? null,
      description: li.description,
      quantity: li.quantity,
      unit: li.unit ?? null,
      unitPrice: li.unitPrice,
      discountPercent: li.discountPercent ?? 0,
      taxRate: li.taxRate ?? 15,
    })),
  };
  return Object.fromEntries(Object.entries(body).filter(([, v]) => v !== undefined));
}

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
  if (!CONFIG.useMock) return apiRequest<Quote[]>("/billing/quotes");
  await delay();
  return store.map((q) => ({ ...q }));
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  if (!CONFIG.useMock) {
    try {
      return await apiRequest<Quote>(`/billing/quotes/${id}`);
    } catch {
      return null;
    }
  }
  await delay();
  const found = store.find((q) => q.id === id);
  return found ? { ...found } : null;
}

export async function createQuote(data: Partial<Quote>): Promise<Quote> {
  if (!CONFIG.useMock) {
    return apiRequest<Quote>("/billing/quotes", { method: "POST", body: toApiBody(data) });
  }
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
  if (!CONFIG.useMock) {
    const body = toApiBody(data);
    if (data.status) body.status = data.status;
    return apiRequest<Quote>(`/billing/quotes/${id}`, { method: "PATCH", body });
  }
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
  if (!CONFIG.useMock) {
    return apiRequest<Quote>(`/billing/quotes/${id}`, { method: "PATCH", body: { status } });
  }
  const patch: Partial<Quote> = { status };
  if (status === "sent") patch.sentAt = nowIso();
  return updateQuote(id, patch);
}

export async function deleteQuote(id: string): Promise<void> {
  if (!CONFIG.useMock) {
    await apiRequest<void>(`/billing/quotes/${id}`, { method: "DELETE" });
    return;
  }
  await delay();
  store = store.filter((q) => q.id !== id);
}

export async function duplicateQuote(id: string): Promise<Quote> {
  const original = await getQuoteById(id);
  if (!original) throw new Error("Quote not found");
  const { id: _id, quoteNumber: _qn, convertedInvoiceId: _c, ...rest } = original;
  const today = nowIso().split("T")[0];
  return createQuote({ ...rest, status: "draft", issueDate: today, expiryDate: addDays(today, 30) });
}

/**
 * Convert a quote to a DRAFT invoice. Clones line items, sets source metadata,
 * marks the quote 'converted' and links the two records.
 */
export async function convertQuoteToInvoice(
  id: string,
  vertical: Vertical = "FUNERAL"
): Promise<Invoice> {
  if (!CONFIG.useMock) {
    const created = await apiRequest<{ id: string }>(`/billing/quotes/${id}/convert`, { method: "POST", body: {} });
    const invoice = await getBillingInvoiceById(created.id);
    if (!invoice) throw new Error("The invoice was created but could not be loaded");
    return invoice;
  }
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
