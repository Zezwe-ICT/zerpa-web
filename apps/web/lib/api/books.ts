import { CONFIG } from "@/lib/config";
import { apiRequest, getToken } from "@/lib/api/client";

export interface CompanyPlan {
  plan: string | null;
  label: string;
  pricePerUser: number | null;
  trialEndsOn: string | null;
  trialActive: boolean;
  pausedUntil?: string | null;
  appLimit: number | null;
  userLimit: number | null;
  appsUsed: number;
  usersUsed: number;
  charged?: boolean;
  note?: string;
  plans: { code: string; label: string; pricePerUser: number; apps: number | null; users: number | null }[];
}

export function getPlan() {
  return apiRequest<CompanyPlan>("/billing/plan");
}

export function choosePlan(plan: string) {
  return apiRequest<CompanyPlan>("/billing/plan", { method: "POST", body: { plan } });
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
