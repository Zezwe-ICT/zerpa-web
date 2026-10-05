/**
 * @file lib/api/help.ts
 * @description Help-centre articles written by the Zerpa team: search, help for the current screen, reading and feedback.
 */
import { apiRequest } from "./client";

export interface HelpArticleSummary { id: string; slug: string; title: string; summary: string; category: string; updatedAt: string }
export interface HelpArticle extends HelpArticleSummary { body: string; yourVote: "yes" | "no" | null; related: HelpArticleSummary[] }

export const HELP_CATEGORIES: Record<string, string> = {
  getting_started: "Getting started", invoicing: "Invoicing", payments: "Payments", customers: "Customers",
  projects: "Projects", team: "Team", account: "Account & security", industry: "For your industry",
};

const list = (qs: string) => apiRequest<{ results: HelpArticleSummary[] }>(`/help/articles${qs}`).then((r) => r.results);
export const searchHelp = (q: string, page?: string) =>
  list(`?q=${encodeURIComponent(q)}${page ? `&page=${encodeURIComponent(page)}` : ""}`);
export const helpForPage = (page: string) => list(`?page=${encodeURIComponent(page)}`);
export const allHelp = () => list("");
export const getHelpArticle = (slug: string) => apiRequest<HelpArticle>(`/help/articles/${slug}`);
export const sendHelpFeedback = (slug: string, helpful: boolean, comment?: string) =>
  apiRequest<{ ok: boolean }>(`/help/articles/${slug}/feedback`, { method: "POST", body: { helpful, comment } });
