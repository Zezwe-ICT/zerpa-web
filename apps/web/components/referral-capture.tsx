/**
 * @file components/referral-capture.tsx
 * @description Remembers a partner's referral code from a signup link (?ref=code) until the company is created,
 * so the partner is credited even if the person signs up and verifies their email first.
 */
"use client";

import { useEffect } from "react";

export const REF_KEY = "zerpa_ref";

export function ReferralCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (!ref || !/^[a-z0-9-]{2,40}$/i.test(ref)) return;
    try {
      localStorage.setItem(REF_KEY, ref.toLowerCase());
    } catch {
      /* storage blocked: the referral just isn't credited */
    }
  }, []);
  return null;
}

export function takeReferral(): string | undefined {
  try {
    return localStorage.getItem(REF_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

export function clearReferral() {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    /* ignore */
  }
}
