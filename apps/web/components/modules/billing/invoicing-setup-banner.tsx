"use client";

import { AppChecklist } from "@/components/modules/setup/app-checklist";

/** Shown on invoicing screens until the money setup for this company is done. */
export function InvoicingSetupBanner() {
  return <AppChecklist app="invoicing" />;
}
