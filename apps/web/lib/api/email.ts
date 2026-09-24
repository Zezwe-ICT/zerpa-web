/**
 * Headers for the Next.js email routes (/api/email/*).
 * The route checks this access token with the API before sending.
 */
import { getToken } from "./client";

export function emailHeaders(): Record<string, string> {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}
