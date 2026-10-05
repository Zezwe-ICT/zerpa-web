/**
 * @file lib/api/expenses.ts
 * @description Staff expenses: submit, edit, approve/reject, reimburse.
 */
import { apiRequest } from "./client";

export type ExpenseStatus = "SUBMITTED" | "APPROVED" | "REJECTED" | "REIMBURSED";

export interface Expense {
  id: string;
  spentOn: string;
  merchant: string;
  category: string;
  categoryLabel: string;
  description: string | null;
  amount: number;
  taxAmount: number;
  vatClaimable: boolean;
  paidBy: "employee" | "company";
  status: ExpenseStatus;
  customerId: string | null;
  submittedBy: { id: string; name: string };
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  reimbursedAt: string | null;
  isMine: boolean;
  canDecide: boolean;
  createdAt: string;
}

export interface ExpenseInput {
  merchant: string;
  category: string;
  spentOn: string;
  amount: number;
  vatClaimable: boolean;
  taxAmount?: number;
  paidBy: "employee" | "company";
  description?: string;
}

export const listExpenses = (scope: "mine" | "all") => apiRequest<Expense[]>(`/expenses?scope=${scope}`);
export const expenseCategories = () => apiRequest<Array<{ key: string; label: string }>>("/expenses/categories");
export const createExpense = (body: ExpenseInput) => apiRequest<Expense>("/expenses", { method: "POST", body });
export const updateExpense = (id: string, body: Partial<ExpenseInput>) =>
  apiRequest<Expense>(`/expenses/${id}`, { method: "PATCH", body });
export const deleteExpense = (id: string) => apiRequest<void>(`/expenses/${id}`, { method: "DELETE" });
export const decideExpense = (id: string, action: "approve" | "reject" | "reimburse", note?: string) =>
  apiRequest<Expense>(`/expenses/${id}/decision`, { method: "POST", body: { action, note } });
