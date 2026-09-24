/**
 * Get paid: pay links, online payment providers, bank statement matching, the public pay page,
 * and quotes shared with customers for online acceptance.
 */
import type { Quote, QuoteDeposit } from "@zerpa/shared-types";
import { CONFIG } from "@/lib/config";
import { apiRequest, ApiError } from "./client";

export const createPayLink = (invoiceId: string) =>
  apiRequest<{ payUrl: string }>(`/billing/invoices/${invoiceId}/pay-link`, { method: "POST", body: {} });

export interface GatewaySettings {
  payfast: {
    enabled: boolean;
    sandbox: boolean;
    merchantId: string;
    merchantKeySet: boolean;
    passphraseSet: boolean;
    ready: boolean;
  };
  ozow: { enabled: boolean; test: boolean; siteCode: string; privateKeySet: boolean; apiKeySet: boolean; ready: boolean };
  eft: { enabled: boolean };
  notifyBaseUrl: string;
}

export interface GatewayUpdate {
  payfast?: Partial<{ enabled: boolean; sandbox: boolean; merchantId: string; merchantKey: string; passphrase: string }>;
  ozow?: Partial<{ enabled: boolean; test: boolean; siteCode: string; privateKey: string; apiKey: string }>;
  eft?: { enabled: boolean };
}

export const getGateways = () => apiRequest<GatewaySettings>("/billing/payment-gateways");
export const updateGateways = (body: GatewayUpdate) =>
  apiRequest<GatewaySettings>("/billing/payment-gateways", { method: "PUT", body });

export interface StatementLine {
  fingerprint: string;
  date: string;
  description: string;
  amount: number;
  status: "suggested" | "unmatched" | "already_matched";
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  customerName?: string | null;
  balanceDue?: number | null;
  reason?: string;
  confidence?: "high" | "medium" | "check" | "";
}

export interface OpenInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  balanceDue: number;
}

export const previewStatement = (csv: string) =>
  apiRequest<{ lines: StatementLine[]; openInvoices: OpenInvoice[] }>("/billing/reconcile/preview", {
    method: "POST",
    body: { csv },
  });

export const commitMatches = (
  matches: Array<{ fingerprint: string; invoiceId: string; amount: number; date: string; description: string }>,
) =>
  apiRequest<{
    recorded: Array<{ fingerprint: string; invoiceNumber: string; amount: number; status: string }>;
    skipped: Array<{ fingerprint: string; reason: string }>;
  }>("/billing/reconcile/commit", { method: "POST", body: { matches } });

// ── Public pay page (no login) ──────────────────────────────────────────

export interface PublicInvoice {
  company: { name: string; email: string; phone: string; vatNumber: string };
  invoice: {
    invoiceNumber: string;
    status: string;
    customerName: string;
    issuedDate: string | null;
    dueDate: string | null;
    currency: string;
    lineItems: Array<{ description: string; quantity: number; unitPrice: number; taxRate: number; lineTotal: number }>;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    balanceDue: number;
    notes: string;
  };
  canPay: boolean;
  methods: Array<{ key: "payfast" | "ozow"; label: string; provider: string; test: boolean }>;
  eft: null | {
    bankName: string;
    accountHolder: string;
    bankAccountNumber: string;
    bankBranchCode: string;
    bankAccountType: string;
    proofOfPaymentEmail: string;
    reference: string;
  };
}

/** Plain fetch on purpose: the payer isn't logged in, so no tokens or refresh logic. */
async function publicRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${CONFIG.apiUrl}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (data as { error?: string }).error || "Something went wrong");
  return data as T;
}

export const getPublicInvoice = (token: string) => publicRequest<PublicInvoice>(`/pay/${encodeURIComponent(token)}`);

export const startCheckout = (token: string, method: string) =>
  publicRequest<{ action: string; fields: Record<string, string> }>(`/pay/${encodeURIComponent(token)}/checkout`, {
    method: "POST",
    body: JSON.stringify({ method }),
  });

/** Posts the provider form in the top window, like a normal checkout button would. */
export function submitProviderForm(action: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export function whatsappShareUrl(text: string, phone?: string | null) {
  const digits = (phone || "").replace(/\D/g, "").replace(/^0/, "27");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

// ── Quotes shared with customers ────────────────────────────────────────

/** Returns the quote with its customer link. Sharing a draft marks it as sent. */
export const shareQuote = (quoteId: string) =>
  apiRequest<Quote>(`/billing/quotes/${quoteId}/share-link`, { method: "POST", body: {} });

export interface PublicQuote {
  company: { name: string; email: string; phone: string; vatNumber: string };
  quote: {
    quoteNumber: string;
    status: "sent" | "accepted" | "declined" | "expired" | "converted" | "void";
    customerName: string;
    contactPerson: string;
    subject: string;
    issueDate: string | null;
    expiryDate: string | null;
    currency: string;
    scopeOfWork: string;
    termsAndConditions: string;
    paymentTerms: string;
    notes: string;
    lineItems: Array<{
      description: string;
      quantity: number;
      unit: string | null;
      unitPrice: number;
      discountPercent: number;
      taxRate: number;
      lineTotal: number;
    }>;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
  };
  canRespond: boolean;
  deposit: QuoteDeposit | null;
  response: { at: string | null; name: string | null; declineReason: string | null };
}

export const getPublicQuote = (token: string) => publicRequest<PublicQuote>(`/quote/${encodeURIComponent(token)}`);

export const respondToQuote = (
  token: string,
  body: { action: "accept"; name: string; email?: string; agree: true } | { action: "decline"; reason?: string },
) =>
  publicRequest<PublicQuote>(`/quote/${encodeURIComponent(token)}/respond`, {
    method: "POST",
    body: JSON.stringify(body),
  });
