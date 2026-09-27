/**
 * @file lib/api/approvals.ts
 * @description Approval requests (purchases, large quotes, other) and the quote approval limit.
 */
import { apiRequest } from "./client";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface ApprovalRequest {
  id: string;
  category: "purchase" | "quote" | "discount" | "general";
  categoryLabel: string;
  title: string;
  description: string | null;
  amount: number | null;
  status: ApprovalStatus;
  requestedBy: { id: string; name: string };
  decidedBy: string | null;
  decidedAt: string | null;
  decisionNote: string | null;
  relatedType: string | null;
  relatedId: string | null;
  link: string | null;
  isMine: boolean;
  canDecide: boolean;
  createdAt: string;
}

export const listApprovals = (scope: "mine" | "all") => apiRequest<ApprovalRequest[]>(`/approvals?scope=${scope}`);
export const requestApproval = (body: { category?: string; title?: string; description?: string; amount?: number; relatedType?: "quote"; relatedId?: string }) =>
  apiRequest<ApprovalRequest>("/approvals", { method: "POST", body });
export const decideApproval = (id: string, action: "approve" | "reject" | "cancel", note?: string) =>
  apiRequest<ApprovalRequest>(`/approvals/${id}/decision`, { method: "POST", body: { action, note } });

export const getQuoteApprovalLimit = async () =>
  Number((await apiRequest<{ quoteApprovalOver?: number }>("/billing/settings")).quoteApprovalOver || 0);
export const setQuoteApprovalLimit = (amount: number) =>
  apiRequest<unknown>("/billing/settings", { method: "PUT", body: { quoteApprovalOver: amount } });
