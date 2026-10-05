/**
 * @file lib/api/support.ts
 * @description Ask Zerpa for help: tickets the whole company can see, answered by the Zerpa team in HQ.
 */
import { apiRequest } from "./client";

export interface SupportTicket {
  id: string;
  number: number;
  subject: string;
  status: "open" | "pending" | "solved" | "closed";
  category: string;
  pageUrl: string | null;
  requester: { id: string; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
  messages?: Array<{ id: string; body: string; fromStaff: boolean; author: { name: string } | null; at: string }>;
  csat: { score: number; comment: string } | null;
}

export const listSupportTickets = () => apiRequest<SupportTicket[]>("/support/tickets");
export const getSupportTicket = (id: string) => apiRequest<SupportTicket>(`/support/tickets/${id}`);
export const createSupportTicket = (body: { subject: string; body: string; category: string; pageUrl?: string }) =>
  apiRequest<SupportTicket>("/support/tickets", { method: "POST", body });
export const replySupportTicket = (id: string, body: string) =>
  apiRequest<SupportTicket>(`/support/tickets/${id}`, { method: "POST", body: { body } });
