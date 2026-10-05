import { NextResponse } from "next/server";
import { checkAccessToken, keysMatch } from "@/lib/server/verify-access-token";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

/**
 * Guard Next.js email routes.
 * Allows x-zerpa-internal-key when it matches ZERPA_INTERNAL_API_KEY, or a
 * bearer access token that the API accepts as a live staff session.
 */
export async function assertRouteAuth(request: Request): Promise<NextResponse | null> {
  const internal = process.env.ZERPA_INTERNAL_API_KEY;
  const providedInternal = request.headers.get("x-zerpa-internal-key");
  if (internal && providedInternal && keysMatch(internal, providedInternal)) {
    return null;
  }

  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const check = token ? await checkAccessToken(token) : "invalid";
  if (check === "valid") return null;
  if (check === "unavailable") {
    return NextResponse.json(
      { error: "Could not verify sign-in. Try again in a moment." },
      { status: 503, headers: NO_STORE },
    );
  }
  return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_STORE });
}
