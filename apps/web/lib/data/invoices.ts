import type { Invoice } from "@zerpa/shared-types";
import { CONFIG } from "@/lib/config";
import { apiRequest } from "../api/client";
import { MOCK_INVOICES } from "@/lib/mock/invoices";

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
    throw error;
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
