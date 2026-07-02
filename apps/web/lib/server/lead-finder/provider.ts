/**
 * @file lib/server/lead-finder/provider.ts
 * @description Server-only provider abstraction for the Lead Finder. A provider
 * turns a search (query + location) into a normalised ScrapedBusiness[]. Keeping
 * this behind an interface lets us swap SerpApi ↔ Google Places ↔ OpenStreetMap
 * without touching the route handler or UI.
 *
 * NOTE: server-only — never import from a client component. Providers read API
 * keys from environment variables.
 */
import type {
  LeadFinderSearchParams,
  ScrapedBusiness,
} from "@zerpa/shared-types";

export interface LeadFinderProvider {
  readonly id: string;
  /** Whether the provider is configured (e.g. API key present). */
  isConfigured(): boolean;
  search(params: LeadFinderSearchParams): Promise<ScrapedBusiness[]>;
}

export class LeadFinderConfigError extends Error {}
