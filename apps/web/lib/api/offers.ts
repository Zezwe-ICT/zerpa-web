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

export interface PublicPlans {
  currency: "ZAR";
  vatRate: number;
  trialDays: number;
  annualMonthsCharged: number;
  plans: Array<{ code: string; label: string; base: number; includedUsers: number; extraUser: number | null; launchFee: number;
    apps: number | null; users: number | null; industryPacks: number; companies: number; prioritySupport: boolean }>;
  addons: Array<{ code: string; label: string; price: number }>;
}

/** Plans and prices from the API (the same table monthly_charge uses), for screens before a company exists. */
export async function getPublicPlans(): Promise<PublicPlans> {
  const res = await fetch(`${CONFIG.apiUrl}/public/plans`);
  if (!res.ok) throw new Error("Could not load plans");
  return (await res.json()) as PublicPlans;
}
