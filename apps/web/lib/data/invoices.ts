import type {
  Invoice,
  InvoiceStatus,
  InvoiceLineItem,
  Payment,
  PaymentMethod,
  Quote,
  Vertical,
} from "@zerpa/shared-types";
import { CONFIG } from "@/lib/config";
import { apiRequest } from "../api/client";
import { MOCK_INVOICES } from "@/lib/mock/invoices";
import { computeBillingTotals, computeLineTotal, round2 } from "@/lib/utils/billing-calc";
import { generateInvoiceDocumentNumber, nextSequenceForYear } from "@/lib/utils/invoice-number";

// Mock delay to simulate network latency
const MOCK_DELAY = 300;

/**
 * Get all invoices for the authenticated user's current tenant
 * Falls back to mock data if CONFIG.useMock is true
 */
export async function getInvoices(tenantId?: string): Promise<Invoice[]> {
  if (CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    return MOCK_INVOICES;
  }

  try {
    const queryParams = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
    const invoices = await apiRequest<Invoice[]>(
      `/api/v1/billing/invoices${queryParams}`
    );
    return invoices || [];
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return [];
  }
}

/**
 * Get a single invoice by ID
 */
export async function getInvoiceById(
  id: string,
  tenantId?: string
): Promise<Invoice | null> {
  if (CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    return MOCK_INVOICES.find((i) => i.id === id) ?? null;
  }

  try {
    const queryParams = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
    const invoice = await apiRequest<Invoice>(
      `/api/v1/billing/invoices/${id}${queryParams}`
    );
    return invoice || null;
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return null;
  }
}

/**
 * Get invoices filtered by status
 */
export async function getInvoicesByStatus(
  status: string,
  tenantId?: string
): Promise<Invoice[]> {
  if (CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    if (status === "all") return MOCK_INVOICES;
    return MOCK_INVOICES.filter((i) => i.status === status);
  }

  try {
    const queryParams = new URLSearchParams({
      ...(tenantId && { tenantId }),
      ...(status !== "all" && { status }),
    });
    const invoices = await apiRequest<Invoice[]>(
      `/api/v1/billing/invoices?${queryParams.toString()}`
    );
    return invoices || [];
  } catch (error) {
    console.error("Failed to fetch invoices by status:", error);
    return [];
  }
}

/**
 * Create a new invoice
 */
export async function createInvoice(data: Partial<Invoice>): Promise<Invoice> {
  if (CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: data.invoiceNumber || "ZRP-2025-0000",
      tenantId: data.tenantId || "",
      tenantName: data.tenantName || "",
      tenantVertical: data.tenantVertical || "FUNERAL",
      type: data.type || "SUBSCRIPTION",
      status: "DRAFT",
      subtotal: data.subtotal || 0,
      taxAmount: data.taxAmount || 0,
      total: (data.subtotal || 0) + (data.taxAmount || 0),
      currency: "ZAR",
      issuedDate: data.issuedDate || new Date().toISOString().split("T")[0],
      dueDate: data.dueDate || new Date().toISOString().split("T")[0],
      lineItems: data.lineItems || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newInvoice;
  }

  try {
    const invoice = await apiRequest<Invoice>("/api/v1/billing/invoices", {
      method: "POST",
      body: {
        tenantId: data.tenantId,
        type: data.type,
        issuedDate: data.issuedDate,
        dueDate: data.dueDate,
        lineItems: data.lineItems,
        notes: data.notes,
        taxRate: data.taxRate || 15,
      },
    });
    return invoice;
  } catch (error) {
    console.error("Failed to create invoice:", error);
    throw error;
  }
}

/**
 * Update an invoice (DRAFT status only)
 */
export async function updateInvoice(
  id: string,
  data: Partial<Invoice>
): Promise<Invoice> {
  if (CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    const invoice = MOCK_INVOICES.find((i) => i.id === id);
    if (invoice) {
      Object.assign(invoice, data, {
        updatedAt: new Date().toISOString(),
      });
    }
    if (!invoice) throw new Error("Invoice not found");
    return invoice;
  }

  try {
    const updated = await apiRequest<Invoice>(
      `/api/v1/billing/invoices/${id}`,
      {
        method: "PATCH",
        body: {
          dueDate: data.dueDate,
          notes: data.notes,
          lineItems: data.lineItems,
        },
      }
    );
    return updated;
  } catch (error) {
    console.error("Failed to update invoice:", error);
    throw error;
  }
}

/**
 * Send invoice (future phase - not implemented in current API)
 */
export async function sendInvoice(id: string, email: string): Promise<Invoice | null> {
  if (CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    const invoice = MOCK_INVOICES.find((i) => i.id === id);
    if (invoice) {
      invoice.status = "SENT";
      invoice.sentAt = new Date().toISOString();
      invoice.updatedAt = new Date().toISOString();
    }
    return invoice ?? null;
  }

  console.warn("sendInvoice: Not yet implemented - will be added in future phase");
  return null;
}

/**
 * Mark invoice as paid (future phase - not implemented in current API)
 */
export async function markInvoiceAsPaid(
  id: string,
  paymentDate: string,
  method: string
): Promise<Invoice | null> {
  if (CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    const invoice = MOCK_INVOICES.find((i) => i.id === id);
    if (invoice) {
      invoice.status = "PAID";
      invoice.paidAt = paymentDate;
      invoice.updatedAt = new Date().toISOString();
    }
    return invoice ?? null;
  }

  console.warn("markInvoiceAsPaid: Not yet implemented - will be added in future phase");
  return null;
}

export async function voidInvoice(id: string): Promise<Invoice | null> {
  if (CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    const invoice = MOCK_INVOICES.find((i) => i.id === id);
    if (invoice) {
      invoice.status = "VOID";
      invoice.voidedAt = new Date().toISOString();
      invoice.updatedAt = new Date().toISOString();
    }
    return invoice ?? null;
  }

  // TODO: Replace with actual API call
  return null;
}

// ─────────────────────────────────────────────────────────────
// Internal Billing module — in-memory invoice store
//
// The functions above back the client portals against the live API. The
// expanded internal Billing module (quotes → invoices, payments, automated
// generation) has no backend yet, so the functions below operate on a
// module-level in-memory store seeded from MOCK_INVOICES. This keeps the
// internal Quotes/Invoices/Automated pages fully functional in the browser.
// Swap the bodies for apiRequest(...) calls once the endpoints exist.
// ─────────────────────────────────────────────────────────────

const nowIso = () => new Date().toISOString();
const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY));

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

let billingStore: Invoice[] = MOCK_INVOICES.map((i) => ({ ...i }));

/** Recompute line totals, document totals and payment balance onto an invoice. */
function recomputeInvoice(inv: Invoice): Invoice {
  const lineItems: InvoiceLineItem[] = inv.lineItems.map((li, i) => {
    const lineTotal = li.lineTotal ?? computeLineTotal(li);
    return {
      ...li,
      sortOrder: li.sortOrder ?? i,
      lineTotal,
      total: lineTotal, // keep legacy field in sync
    };
  });
  const totals = computeBillingTotals(
    lineItems,
    inv.discountType ?? "none",
    inv.discountValue ?? 0
  );
  const amountPaid = round2(
    (inv.payments ?? []).reduce((a, p) => a + p.amount, 0)
  );
  const balanceDue = round2(totals.total - amountPaid);

  let status = inv.status;
  if (status !== "VOID" && status !== "CANCELLED" && status !== "DRAFT") {
    if (amountPaid >= totals.total && totals.total > 0) status = "PAID";
    else if (amountPaid > 0) status = "PARTIALLY_PAID";
  }

  return {
    ...inv,
    lineItems,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    taxAmount: totals.taxTotal,
    total: totals.total,
    amountPaid,
    balanceDue,
    status,
  };
}

export async function getBillingInvoices(): Promise<Invoice[]> {
  await delay();
  return billingStore.map((i) => ({ ...i }));
}

export async function getBillingInvoiceById(
  id: string
): Promise<Invoice | null> {
  await delay();
  const found = billingStore.find((i) => i.id === id);
  return found ? { ...found } : null;
}

export async function createManualInvoice(
  data: Partial<Invoice>
): Promise<Invoice> {
  await delay();
  const seq = nextSequenceForYear(
    billingStore.map((i) => i.invoiceNumber),
    "INV"
  );
  const issuedDate = data.issuedDate ?? nowIso().split("T")[0];
  const base: Invoice = {
    id: `inv-${Date.now()}`,
    invoiceNumber: data.invoiceNumber ?? generateInvoiceDocumentNumber(seq),
    tenantId: data.tenantId ?? "",
    tenantName: data.tenantName ?? "",
    tenantVertical: data.tenantVertical ?? "FUNERAL",
    type: data.type ?? "AD_HOC",
    status: "DRAFT",
    source: data.source ?? "manual",
    quoteId: data.quoteId ?? null,
    reference: data.reference ?? null,
    contactEmail: data.contactEmail ?? null,
    salesRep: data.salesRep ?? null,
    subject: data.subject ?? null,
    subtotal: 0,
    taxAmount: 0,
    total: 0,
    taxRate: data.taxRate ?? 15,
    currency: data.currency ?? "ZAR",
    discountType: data.discountType ?? "none",
    discountValue: data.discountValue ?? 0,
    discountAmount: 0,
    amountPaid: 0,
    balanceDue: 0,
    payments: [],
    issuedDate,
    dueDate: data.dueDate ?? addDays(issuedDate, 30),
    lineItems: data.lineItems ?? [],
    notes: data.notes,
    internalNotes: data.internalNotes ?? null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const invoice = recomputeInvoice(base);
  billingStore = [invoice, ...billingStore];
  return { ...invoice };
}

/** Create a DRAFT invoice cloned from a quote (used by quote conversion). */
export async function createInvoiceFromQuote(
  quote: Quote,
  vertical: Vertical = "FUNERAL"
): Promise<Invoice> {
  const lineItems: InvoiceLineItem[] = quote.lineItems.map((li, i) => ({
    id: `il-${Date.now()}-${i}`,
    productServiceId: li.productServiceId ?? null,
    description: li.description,
    quantity: li.quantity,
    unit: li.unit ?? null,
    unitPrice: li.unitPrice,
    discountPercent: li.discountPercent ?? 0,
    taxRate: li.taxRate ?? 15,
    lineTotal: computeLineTotal(li),
    total: computeLineTotal(li),
    sortOrder: i,
  }));

  return createManualInvoice({
    tenantId: quote.customerId,
    tenantName: quote.customerName,
    tenantVertical: vertical,
    type: "AD_HOC",
    source: "converted_quote",
    quoteId: quote.id,
    reference: quote.reference ?? null,
    contactEmail: quote.contactEmail ?? null,
    salesRep: quote.salesRep ?? null,
    subject: quote.subject ?? null,
    discountType: quote.discountType,
    discountValue: quote.discountValue,
    lineItems,
    notes: quote.notes ?? undefined,
  });
}

export async function updateBillingInvoice(
  id: string,
  data: Partial<Invoice>
): Promise<Invoice> {
  await delay();
  const idx = billingStore.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Invoice not found");
  const merged = { ...billingStore[idx], ...data, id, updatedAt: nowIso() };
  billingStore[idx] = recomputeInvoice(merged);
  return { ...billingStore[idx] };
}

export async function updateBillingInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<Invoice> {
  const patch: Partial<Invoice> = { status };
  if (status === "SENT") patch.sentAt = nowIso();
  if (status === "VOID" || status === "CANCELLED") patch.voidedAt = nowIso();
  return updateBillingInvoice(id, patch);
}

export async function sendBillingInvoice(id: string): Promise<Invoice> {
  return updateBillingInvoiceStatus(id, "SENT");
}

export async function voidBillingInvoice(id: string): Promise<Invoice> {
  return updateBillingInvoiceStatus(id, "VOID");
}

export async function recordInvoicePayment(
  id: string,
  payment: {
    amount: number;
    paymentDate: string;
    method: PaymentMethod;
    reference?: string | null;
    notes?: string | null;
  }
): Promise<Invoice> {
  await delay();
  const idx = billingStore.findIndex((i) => i.id === id);
  if (idx === -1) throw new Error("Invoice not found");
  const inv = billingStore[idx];
  const record: Payment = {
    id: `pay-${Date.now()}`,
    invoiceId: id,
    amount: payment.amount,
    paymentDate: payment.paymentDate,
    method: payment.method,
    reference: payment.reference ?? null,
    notes: payment.notes ?? null,
    createdAt: nowIso(),
  };
  const payments = [...(inv.payments ?? []), record];
  const amountPaid = round2(payments.reduce((a, p) => a + p.amount, 0));
  const patch: Partial<Invoice> = {
    payments,
    paidAt: amountPaid >= inv.total ? payment.paymentDate : inv.paidAt,
  };
  billingStore[idx] = recomputeInvoice({ ...inv, ...patch, updatedAt: nowIso() });
  return { ...billingStore[idx] };
}
