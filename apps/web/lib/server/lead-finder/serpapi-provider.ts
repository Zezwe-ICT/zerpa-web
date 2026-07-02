/**
 * @file lib/server/lead-finder/serpapi-provider.ts
 * @description SerpApi Google Maps provider. Calls the documented SerpApi
 * `engine=google_maps` endpoint (SerpApi performs the actual Google scraping on
 * their side) and normalises `local_results` into ScrapedBusiness[].
 *
 * Requires env var SERPAPI_KEY. Server-only.
 */
import type {
  LeadFinderSearchParams,
  ScrapedBusiness,
} from "@zerpa/shared-types";
import {
  LeadFinderConfigError,
  type LeadFinderProvider,
} from "./provider";

const SERPAPI_ENDPOINT = "https://serpapi.com/search.json";

interface SerpApiGpsCoordinates {
  latitude?: number;
  longitude?: number;
}

interface SerpApiLocalResult {
  place_id?: string;
  data_id?: string;
  title?: string;
  type?: string;
  address?: string;
  phone?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  thumbnail?: string;
  gps_coordinates?: SerpApiGpsCoordinates;
}

interface SerpApiResponse {
  error?: string;
  local_results?: SerpApiLocalResult[];
  place_results?: SerpApiLocalResult;
}

function normalise(r: SerpApiLocalResult): ScrapedBusiness {
  return {
    id: r.place_id || r.data_id || `${r.title ?? "unknown"}-${r.address ?? ""}`,
    name: r.title ?? "Unknown",
    category: r.type,
    address: r.address,
    phone: r.phone,
    website: r.website,
    rating: r.rating,
    reviews: r.reviews,
    latitude: r.gps_coordinates?.latitude,
    longitude: r.gps_coordinates?.longitude,
    thumbnail: r.thumbnail,
    source: "serpapi_google_maps",
  };
}

export class SerpApiProvider implements LeadFinderProvider {
  readonly id = "serpapi_google_maps";
  private readonly apiKey = process.env.SERPAPI_KEY ?? "";

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async search(params: LeadFinderSearchParams): Promise<ScrapedBusiness[]> {
    if (!this.isConfigured()) {
      throw new LeadFinderConfigError(
        "SERPAPI_KEY is not set. Add it to the environment to enable the Lead Finder."
      );
    }

    const q = params.location
      ? `${params.query} in ${params.location}`
      : params.query;

    const url = new URL(SERPAPI_ENDPOINT);
    url.searchParams.set("engine", "google_maps");
    url.searchParams.set("type", "search");
    url.searchParams.set("q", q);
    url.searchParams.set("hl", "en");
    url.searchParams.set("gl", params.country ?? "za");
    url.searchParams.set("google_domain", "google.com");
    url.searchParams.set("api_key", this.apiKey);
    if (params.page && params.page > 0) {
      // SerpApi paginates Google Maps in steps of 20.
      url.searchParams.set("start", String(params.page * 20));
    }

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`SerpApi request failed (${res.status})`);
    }
    const data = (await res.json()) as SerpApiResponse;
    if (data.error) {
      throw new Error(data.error);
    }

    const results = data.local_results
      ? data.local_results
      : data.place_results
        ? [data.place_results]
        : [];

    return results.map(normalise);
  }
}
