/**
 * @file lib/data/billing-settings.ts
 * @description Data layer for the singleton BillingSettings. In-memory store
 * seeded from MOCK_BILLING_SETTINGS (no backend yet).
 */
import type { BillingSettings } from "@zerpa/shared-types";
import { MOCK_BILLING_SETTINGS } from "@/lib/mock/billing-settings";

const MOCK_DELAY = 200;
const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY));

let store: BillingSettings = { ...MOCK_BILLING_SETTINGS };

export async function getBillingSettings(): Promise<BillingSettings> {
  await delay();
  return { ...store };
}

export async function updateBillingSettings(
  data: Partial<BillingSettings>
): Promise<BillingSettings> {
  await delay();
  store = { ...store, ...data };
  return { ...store };
}
