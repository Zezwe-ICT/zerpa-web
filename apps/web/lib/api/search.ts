/**
 * @file lib/api/search.ts
 * @description Top-bar search across customers, invoices, quotes, leads and tickets (GET /search).
 */
import { apiRequest } from "./client";

export interface SearchResult {
  type: "customer" | "invoice" | "quote" | "lead" | "ticket";
  id: string;
  title: string;
  subtitle: string;
  amount?: number;
  href: string;
}

export async function searchRecords(q: string): Promise<SearchResult[]> {
  const res = await apiRequest<{ results: SearchResult[] }>(`/search?q=${encodeURIComponent(q)}`);
  return res.results;
}
