/**
 * @file lib/data/lead-finder.ts
 * @description Client-side helper for the Lead Finder. Calls the same-origin
 * Next.js route (/api/lead-finder/search) — NOT the backend API — so the SerpApi
 * key stays server-side. Importing results as leads reuses the authenticated
 * CRM data functions (createContact / createLead).
 */
import type {
  LeadFinderSearchParams,
  LeadFinderSearchResponse,
} from "@zerpa/shared-types";

export async function searchBusinesses(
  params: LeadFinderSearchParams
): Promise<LeadFinderSearchResponse> {
  const qs = new URLSearchParams({ query: params.query });
  if (params.location) qs.set("location", params.location);
  if (params.country) qs.set("country", params.country);
  if (params.page) qs.set("page", String(params.page));

  const res = await fetch(`/api/lead-finder/search?${qs.toString()}`, {
    method: "GET",
  });

  const data = (await res.json()) as LeadFinderSearchResponse;
  return data;
}
