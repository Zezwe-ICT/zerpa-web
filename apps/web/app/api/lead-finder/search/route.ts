/**
 * @file app/api/lead-finder/search/route.ts
 * @description Server-side Lead Finder search endpoint. Runs in Node (keeps the
 * provider API key server-side), calls the active provider (SerpApi Google Maps
 * by default) and returns normalised businesses. The browser never sees the key.
 *
 * GET /api/lead-finder/search?query=funeral+parlour&location=Soweto&country=za&page=0
 */
import { NextResponse } from "next/server";
import {
  getLeadFinderProvider,
  LeadFinderConfigError,
} from "@/lib/server/lead-finder";
import type { LeadFinderSearchResponse } from "@zerpa/shared-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") ?? "").trim();
  const location = searchParams.get("location")?.trim() || undefined;
  const country = searchParams.get("country")?.trim() || undefined;
  const page = Number(searchParams.get("page") ?? "0") || 0;

  if (!query) {
    return NextResponse.json(
      { results: [], provider: "", query: "", error: "A search query is required." } satisfies LeadFinderSearchResponse,
      { status: 400, headers: NO_STORE }
    );
  }

  const provider = getLeadFinderProvider();

  try {
    const results = await provider.search({ query, location, country, page });
    return NextResponse.json(
      {
        results,
        provider: provider.id,
        query,
      } satisfies LeadFinderSearchResponse,
      { headers: NO_STORE }
    );
  } catch (err) {
    const message =
      err instanceof LeadFinderConfigError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Lead Finder search failed.";
    const status = err instanceof LeadFinderConfigError ? 503 : 502;
    return NextResponse.json(
      { results: [], provider: provider.id, query, error: message } satisfies LeadFinderSearchResponse,
      { status, headers: NO_STORE }
    );
  }
}
