/**
 * @file lib/data/billing-settings.ts
 * @description Data layer for the company's BillingSettings (invoice defaults, company
 * and bank details). Live mode uses /billing/settings; mock mode keeps an in-memory copy.
 */
import type { BillingSettings } from "@zerpa/shared-types";
import { CONFIG } from "@/lib/config";
import { apiRequest } from "@/lib/api/client";
import { MOCK_BILLING_SETTINGS } from "@/lib/mock/billing-settings";

const MOCK_DELAY = 200;
const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY));

let store: BillingSettings = { ...MOCK_BILLING_SETTINGS };

/** Live-mode fallbacks. Never the demo company's details: they would end up on real invoices. */
const LIVE_DEFAULTS: BillingSettings = {
  invoicePrefix: "INV",
  quotePrefix: "QUO",
  defaultPaymentTermsDays: 30,
  defaultVatRate: 15,
  defaultQuoteValidityDays: 30,
  invoiceEmailSubjectTemplate: "Invoice {invoice_number} from {company_name}",
  invoiceEmailBodyTemplate:
    "Dear {client_name},\n\nPlease find attached invoice {invoice_number} for {total}, due {due_date}.\n\nKind regards,\n{company_name}",
  quoteEmailSubjectTemplate: "Quotation {quote_number} from {company_name}",
  companyName: "",
  overdueReminderDays: [3, 7, 14, 30],
};

export async function getBillingSettings(): Promise<BillingSettings> {
  if (!CONFIG.useMock) {
    return { ...LIVE_DEFAULTS, ...(await apiRequest<Partial<BillingSettings>>("/billing/settings")) };
  }
  await delay();
  return { ...store };
}

export async function updateBillingSettings(
  data: Partial<BillingSettings>
): Promise<BillingSettings> {
  if (!CONFIG.useMock) {
    return {
      ...LIVE_DEFAULTS,
      ...(await apiRequest<Partial<BillingSettings>>("/billing/settings", { method: "PUT", body: data })),
    };
  }
  await delay();
  store = { ...store, ...data };
  return { ...store };
}
