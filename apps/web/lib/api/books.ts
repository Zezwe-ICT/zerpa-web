import { CONFIG } from "@/lib/config";
import { apiRequest, getToken } from "@/lib/api/client";

/** One price breakdown from the API's monthly_charge. Amounts are rand; monthly figures are the monthly equivalent. */
export interface PlanCharge {
  plan: string;
  label: string;
  interval: "monthly" | "annual";
  users: number;
  includedUsers: number;
  extraUsers: number;
  extraUserPrice: number;
  extraUsersAmount: number;
  base: number;
  addons: { code: string; label: string; quantity: number; price: number; amount: number }[];
  addonsAmount: number;
  subtotal: number;
  vat: number;
  total: number;
  basePeriod: { months: number; subtotal: number; vat: number; total: number };
  monthlyVariable: { subtotal: number; vat: number; total: number };
  yearly: { subtotal: number; vat: number; total: number };
  launchFee: { subtotal: number; vat: number; total: number };
  launchFeeWaived: boolean;
  firstCharge: { subtotal: number; vat: number; total: number };
}

export interface PlanSpec {
  code: string;
  label: string;
  base: number;
  includedUsers: number;
  extraUser: number | null;
  launchFee: number;
  apps: number | null;
  users: number | null;
  industryPacks: number;
  companies: number;
  prioritySupport: boolean;
}

export interface ZerpaBilling {
  live: boolean;
  testMode: boolean;
  method: "" | "card" | "eft";
  status: "inactive" | "active" | "past_due" | "read_only" | "suspended" | "cancelled";
  readOnly: boolean;
  suspended: boolean;
  nextChargeOn: string | null;
  periodEnd: string | null;
  card: { brand: string; last4: string; expiry: string } | null;
  lastFailure: { at: string; reason: string } | null;
  pastDueSince: string | null;
  readOnlyOn: string | null;
  suspendOn: string | null;
  payUrl: string | null;
  amountDue: number | null;
  cancelAtPeriodEnd: boolean;
  launchFeePaid: boolean;
}

export interface CompanyPlan {
  plan: string | null;
  label: string;
  interval: "monthly" | "annual";
  addons: Record<string, number>;
  offerCode: string;
  priceLockedUntil: string | null;
  trialEndsOn: string | null;
  trialActive: boolean;
  pausedUntil?: string | null;
  appLimit: number | null;
  userLimit: number | null;
  includedUsers: number | null;
  industryPackLimit: number | null;
  industryPacksUsed: string[];
  appsUsed: number;
  usersUsed: number;
  charge: PlanCharge | null;
  quotes: Record<string, Record<"monthly" | "annual", PlanCharge>>;
  billing: ZerpaBilling;
  currency: "ZAR";
  vatRate: number;
  trialDays: number;
  annualMonthsCharged: number;
  plans: PlanSpec[];
  addonCatalog: { code: string; label: string; price: number }[];
  charged?: boolean;
  note?: string;
}

export interface CheckoutResult {
  method: "card" | "eft";
  preview: boolean;
  testMode: boolean;
  outstanding?: boolean;
  amount: { launchFee?: number; base?: number; extras?: number; subtotal?: number; vat?: number; total: number };
  reference?: string;
  authorizationUrl?: string;
  payUrl?: string;
  invoiceNumber?: string | null;
  message?: string;
}

export interface ZerpaCharge {
  reference: string;
  method: "card" | "eft";
  status: "pending" | "success" | "failed" | "cancelled";
  plan: string;
  interval: string;
  launchFee: number;
  base: number;
  extras: number;
  subtotal: number;
  vat: number;
  total: number;
  createdAt: string;
  paidAt: string | null;
  payUrl: string | null;
  failureReason: string;
  invoiceNumber: string | null;
}

export function getPlan() {
  return apiRequest<CompanyPlan>("/billing/plan");
}

export function choosePlan(plan: string, options: { interval?: "monthly" | "annual"; addons?: Record<string, number> } = {}) {
  return apiRequest<CompanyPlan>("/billing/plan", { method: "POST", body: { plan, ...options } });
}

/** Pay Zerpa: a Paystack card checkout, or an EFT invoice from Zerpa. Late accounts pay what's outstanding. */
export function startCheckout(body: { plan: string; interval: "monthly" | "annual"; addons: Record<string, number>; method: "card" | "eft" }) {
  return apiRequest<CheckoutResult>("/billing/plan/checkout", { method: "POST", body });
}

export function verifyCheckout(reference: string) {
  return apiRequest<{ charge: ZerpaCharge; plan: CompanyPlan }>(`/billing/plan/checkout/verify?reference=${encodeURIComponent(reference)}`);
}

export function getZerpaCharges() {
  return apiRequest<ZerpaCharge[]>("/billing/plan/charges");
}

export interface CancelReason { key: string; label: string; offer: "downgrade" | "pause" | "call" | null }
export type CancelChoice = "cancel" | "downgrade" | "pause" | "call";

export function getCancelReasons() {
  return apiRequest<{ reasons: CancelReason[] }>("/billing/plan/cancel").then((r) => r.reasons);
}

export function cancelPlan(body: { reason: string; choice: CancelChoice; detail?: string; competitor?: string; pauseMonths?: number }) {
  return apiRequest<CompanyPlan & { outcome: string; ticketId?: string }>("/billing/plan/cancel", { method: "POST", body });
}

export function resumePlan() {
  return apiRequest<CompanyPlan>("/billing/plan/resume", { method: "POST" });
}

export async function uploadCompanyLogo(file: File): Promise<{ logoUrl?: string }> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("zerpa_company");
      const company = raw ? (JSON.parse(raw) as { id?: string }) : null;
      if (company?.id) headers["X-Company-Id"] = company.id;
    } catch {
      /* ignore */
    }
  }
  const body = new FormData();
  body.append("file", file);
  const res = await fetch(`${CONFIG.apiUrl}/billing/logo`, { method: "POST", headers, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not upload the logo");
  return data;
}

export async function removeCompanyLogo(): Promise<{ logoUrl?: string }> {
  return apiRequest("/billing/logo", { method: "DELETE" });
}

export interface VatReport {
  period: { from: string; to: string };
  standardRatedSupplies: number;
  zeroRatedSupplies: number;
  outputVat: number;
  /** VAT on approved supplier bills and claimable expenses. */
  inputVat: number;
  /** Output less input: payable to SARS, or refundable if negative. */
  netVat: number;
  note: string;
}

export function getVatReport(from: string, to: string) {
  const query = new URLSearchParams();
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  return apiRequest<VatReport>(`/billing/vat-report?${query.toString()}`);
}

function companyHeader(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const raw = localStorage.getItem("zerpa_company");
  if (raw) {
    const company = JSON.parse(raw) as { id?: string };
    if (company.id) headers["X-Company-Id"] = company.id;
  }
  return headers;
}

export async function downloadFile(path: string, filename: string) {
  const response = await fetch(`${CONFIG.apiUrl}${path}`, { headers: companyHeader() });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || "Download failed");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
