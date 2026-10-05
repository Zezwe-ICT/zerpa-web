/**
 * @file lib/api/ideas.ts
 * @description The ideas board: suggest what Zerpa should build next and vote on others' ideas.
 */
import { apiRequest } from "./client";

export interface Idea {
  id: string; title: string; description: string;
  status: "under_review" | "planned" | "in_progress" | "shipped" | "declined"; statusLabel: string;
  publicNote: string; votes: number; voted: boolean; createdAt: string; shippedAt: string | null;
}

export const listIdeas = (params: { q?: string; sort?: "top" | "new"; status?: string } = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return apiRequest<Idea[]>(`/ideas${qs ? `?${qs}` : ""}`);
};
export const submitIdea = (title: string, description: string) => apiRequest<Idea>("/ideas", { method: "POST", body: { title, description } });
export const voteIdea = (id: string, comment?: string) => apiRequest<Idea>(`/ideas/${id}/vote`, { method: "POST", body: { comment } });
export const unvoteIdea = (id: string) => apiRequest<Idea>(`/ideas/${id}/vote`, { method: "DELETE" });
