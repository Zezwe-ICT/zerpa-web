/**
 * Confirms a bearer access token with the Django API.
 * A long random string is not enough — the token must be a live staff session.
 */
import { createHash, timingSafeEqual } from "node:crypto";

export type TokenCheck = "valid" | "invalid" | "unavailable";

const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export function keysMatch(expected: string, provided: string): boolean {
  const left = createHash("sha256").update(expected).digest();
  const right = createHash("sha256").update(provided).digest();
  return timingSafeEqual(left, right);
}

export function apiSessionUrl(env: NodeJS.ProcessEnv = process.env): string {
  const base = (env.ZERPA_API_URL || env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1").replace(
    /\/$/,
    "",
  );
  return `${base}/auth/session`;
}

export async function checkAccessToken(
  token: string,
  fetchImpl: typeof fetch = fetch,
  env: NodeJS.ProcessEnv = process.env,
): Promise<TokenCheck> {
  const trimmed = token.trim();
  if (!JWT_SHAPE.test(trimmed)) return "invalid";
  try {
    const res = await fetchImpl(apiSessionUrl(env), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${trimmed}`,
        Accept: "application/json",
      },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 401 || res.status === 403) return "invalid";
    if (!res.ok) return "unavailable";
    const data = (await res.json().catch(() => null)) as { ok?: unknown } | null;
    return data?.ok === true ? "valid" : "invalid";
  } catch {
    return "unavailable";
  }
}
