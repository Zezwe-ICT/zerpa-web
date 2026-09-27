/**
 * @file lib/api/credit-notes.ts
 * @description Credit notes against invoices, and refunds of credit owed to a customer.
 */
import type { Invoice, PaymentMethod } from "@zerpa/shared-types";
import { apiRequest } from "./client";
import { mapApiInvoice } from "@/lib/data/invoices";

export type CreditMode = "full" | "lines" | "amount";

export async function createCreditNote(
  invoiceId: string,
  body: { mode: CreditMode; reason: string; selection?: Record<string, number>; amount?: number },
): Promise<Invoice> {
  const row = await apiRequest<unknown>(`/billing/invoices/${invoiceId}/credit-notes`, { method: "POST", body });
  return mapApiInvoice(row);
}

export async function listCreditNotes(): Promise<Invoice[]> {
  const rows = await apiRequest<unknown[]>("/billing/credit-notes");
  return rows.map(mapApiInvoice);
}

export async function recordRefund(
  creditId: string,
  body: { amount: number; method: PaymentMethod; reference?: string },
): Promise<Invoice> {
  const row = await apiRequest<unknown>(`/billing/credit-notes/${creditId}/refunds`, { method: "POST", body });
  return mapApiInvoice(row);
}
