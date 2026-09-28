/**
 * @file components/referral-capture.tsx
 * @description Remembers a partner's referral code (?ref=code) and an offer code (?offer=msp-founding) from a signup
 * link until the company is created, so they still count if the person signs up and verifies their email first.
 * The API only accepts an offer while it is open.
 */
"use client";

import { useEffect } from "react";

export const REF_KEY = "zerpa_ref";
export const OFFER_KEY = "zerpa_offer";
const CODE = /^[a-z0-9-]{2,40}$/i;

function remember(key: string, value: string | null) {
  if (!value || !CODE.test(value)) return;
  try {
    localStorage.setItem(key, value.toLowerCase());
  } catch {
    /* storage blocked: the code just isn't carried to company creation */
  }
}

function take(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

function clear(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    remember(REF_KEY, params.get("ref"));
    remember(OFFER_KEY, params.get("offer"));
  }, []);
  return null;
}

export const takeReferral = () => take(REF_KEY);
export const clearReferral = () => clear(REF_KEY);
export const takeOffer = () => take(OFFER_KEY);
export const clearOffer = () => clear(OFFER_KEY);
