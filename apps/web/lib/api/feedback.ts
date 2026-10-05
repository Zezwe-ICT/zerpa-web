/**
 * @file lib/api/feedback.ts
 * @description NPS ("how likely are you to recommend Zerpa?") and rating a solved help request.
 */
import { apiRequest } from "./client";

export const npsDue = () => apiRequest<{ due: boolean }>("/feedback/nps").then((r) => r.due);
export const sendNps = (score: number, comment?: string) =>
  apiRequest<{ ok: boolean }>("/feedback/nps", { method: "POST", body: { score, comment } });
export const dismissNps = () => apiRequest<{ ok: boolean }>("/feedback/nps", { method: "POST", body: { dismissed: true } });
export const rateTicket = (id: string, score: number, comment?: string) =>
  apiRequest<{ score: number }>(`/support/tickets/${id}/csat`, { method: "POST", body: { score, comment } });
