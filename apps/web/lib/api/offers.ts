/**
 * @file lib/api/offers.ts
 * @description Public offers (e.g. the founding MSP cohort) with live seats left. No sign-in needed.
 */
import { CONFIG } from "@/lib/config";

export interface PublicOffer {
  code: string;
  vertical: string;
  headline: string;
  subhead: string;
  stack: Array<{ label: string; value_zar: number; is_bonus: boolean }>;
  stack_total_zar: number;
  guarantee_title: string;
  guarantee_text: string;
  seat_cap: number;
  seats_taken: number;
  seats_left: number;
  status: "open" | "full" | "closed";
  closes_at: string | null;
  plan_codes: string[];
  price_lock_months: number;
}

export async function getPublicOffers(): Promise<PublicOffer[]> {
  const res = await fetch(`${CONFIG.apiUrl}/public/offers`);
  if (!res.ok) throw new Error("Could not load offers");
  return ((await res.json()) as { offers: PublicOffer[] }).offers;
}
