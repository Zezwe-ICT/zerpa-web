/**
 * @file lib/server/lead-finder/index.ts
 * @description Selects the active Lead Finder provider. Defaults to SerpApi
 * (Google Maps). To add Google Places or OpenStreetMap later, implement the
 * LeadFinderProvider interface and switch on LEAD_FINDER_PROVIDER here.
 *
 * Server-only.
 */
import type { LeadFinderProvider } from "./provider";
import { SerpApiProvider } from "./serpapi-provider";

export function getLeadFinderProvider(): LeadFinderProvider {
  const which = (process.env.LEAD_FINDER_PROVIDER ?? "serpapi").toLowerCase();
  switch (which) {
    case "serpapi":
    default:
      return new SerpApiProvider();
  }
}

export * from "./provider";
