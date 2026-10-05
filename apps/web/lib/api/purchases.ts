/**
 * @file lib/api/purchases.ts
 * @description Suppliers, supplier bills and payments to suppliers.
 */
import type { BillingLineItem, PaymentMethod } from "@zerpa/shared-types";
import { apiRequest } from "./client";

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  vatNumber: string | null;
  paymentTermsDays: number;
  bankName: string | null;
  bankBranchCode: string | null;
  bankAccountNumber: string | null;
  notes: string | null;
  isActive: boolean;
  owed?: number;
}

export type BillStatus = "DRAFT" | "APPROVED" | "PARTIALLY_PAID" | "PAID" | "VOID";

export interface SupplierBill {
  id: string;
  supplierId: string;
  supplierName: string;
  billNumber: string | null;
  reference: string | null;
  status: BillStatus;
  billDate: string;
  dueDate: string | null;
  overdue: boolean;
  lineItems: BillingLineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  notes: string | null;
  approvedAt: string | null;
  createdAt: string;
  payments?: Array<{ id: string; amount: number; paidOn: string; method: string; reference: string | null }>;
}

export interface BillInput {
  supplierId?: string;
  billNumber?: string;
  reference?: string;
  billDate?: string;
  dueDate?: string | null;
  notes?: string;
  lineItems?: BillingLineItem[];
  status?: BillStatus;
}

export const listSuppliers = (activeOnly = false) =>
  apiRequest<Supplier[]>(`/purchases/suppliers${activeOnly ? "?active=1" : ""}`);
export const createSupplier = (body: Partial<Supplier>) =>
  apiRequest<Supplier>("/purchases/suppliers", { method: "POST", body });
export const updateSupplier = (id: string, body: Partial<Supplier>) =>
  apiRequest<Supplier>(`/purchases/suppliers/${id}`, { method: "PATCH", body });
export const getSupplier = (id: string) => apiRequest<Supplier>(`/purchases/suppliers/${id}`);

export const listBills = (status?: string) =>
  apiRequest<SupplierBill[]>(`/purchases/bills${status ? `?status=${status}` : ""}`);
export const getBill = (id: string) => apiRequest<SupplierBill>(`/purchases/bills/${id}`);
export const createBill = (body: BillInput) => apiRequest<SupplierBill>("/purchases/bills", { method: "POST", body });
export const updateBill = (id: string, body: BillInput) =>
  apiRequest<SupplierBill>(`/purchases/bills/${id}`, { method: "PATCH", body });
export const payBill = (id: string, body: { amount: number; paidOn?: string; method: PaymentMethod; reference?: string }) =>
  apiRequest<SupplierBill>(`/purchases/bills/${id}/payments`, { method: "POST", body });
export const getPayablesSummary = () =>
  apiRequest<{ owed: number; overdue: number; dueThisWeek: number; drafts: number }>("/purchases/summary");
