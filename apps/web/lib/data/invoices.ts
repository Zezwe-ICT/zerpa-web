import type { Invoice } from "@zerpa/shared-types";
import { CONFIG } from "@/lib/config";
import { MOCK_INVOICES } from "@/lib/mock/invoices";

// Mock delay to simulate network latency
const MOCK_DELAY = 300;

export async function getInvoices(): Promise<Invoice[]> {
  if (CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    return MOCK_INVOICES;
  }

  // TODO: Replace with actual API call
  // return apiCall<Invoice[]>("/billing/invoices");
  return [];
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    return MOCK_INVOICES.find((i) => i.id === id) ?? null;
  }

  // TODO: Replace with actual API call
  // return apiCall<Invoice>(`/billing/invoices/${id}`);
  return null;
}

export async function getInvoicesByStatus(status: string): Promise<Invoice[]> {
  if (CONFIG.useMock) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    if (status === "all") return MOCK_INVOICES;
    return MOCK_INVOICES.filter((i) => i.status === status);
  }

  // TODO: Replace with actual API call
  return [];
}

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
      amount: data.amount || 0,
      taxAmount: data.taxAmount || 0,
      total: (data.amount || 0) + (data.taxAmount || 0),
      currency: "ZAR",
      dueDate: data.dueDate || new Date().toISOString().split("T")[0],
      lineItems: data.lineItems || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newInvoice;
  }

  // TODO: Replace with actual API call
  throw new Error("Not implemented");
}

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

  // TODO: Replace with actual API call
  return null;
}

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

  // TODO: Replace with actual API call
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
