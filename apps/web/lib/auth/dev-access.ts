/**
 * @file lib/auth/dev-access.ts
 * @description Developer-only access gate. Certain settings surfaces (API Health,
 * Security / team + API keys) should be visible only to the ZERPA developers,
 * NOT to customers — even though every customer is the OWNER of their own
 * workspace, so role alone can't distinguish them.
 *
 * The allowlist is configured via NEXT_PUBLIC_DEV_EMAILS (comma-separated) in
 * .env.local, e.g.:  NEXT_PUBLIC_DEV_EMAILS=you@zerpa.co.za,dev2@zerpa.co.za
 * Being NEXT_PUBLIC_, it is compiled into the client bundle; the emails are not
 * secret, they just identify who sees the dev tooling. Any real authorisation
 * must still be enforced by the backend on the underlying endpoints.
 */
"use client";

import { useAuth } from "@/lib/auth/context";

export function getDevEmails(): string[] {
  return (process.env.NEXT_PUBLIC_DEV_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isDevEmail(email?: string | null): boolean {
  if (!email) return false;
  return getDevEmails().includes(email.trim().toLowerCase());
}

/** True when the signed-in user's email is in the dev allowlist. */
export function useIsDevUser(): boolean {
  const { user } = useAuth();
  return isDevEmail(user?.email);
}
