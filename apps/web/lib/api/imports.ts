import { CONFIG } from "@/lib/config";
import { apiRequest, getToken } from "@/lib/api/client";

export interface ImportPreview {
  entity: string;
  source?: string;
  valid: number;
  issues: Array<{ line: number; error: string }>;
  duplicates?: Array<{ line: number; name: string; reason: string }>;
  preview?: Array<{ name?: string; email?: string; phone?: string }>;
}

export interface ImportResult {
  created: number;
  skipped?: number;
}

const SOURCE_LABEL: Record<string, string> = {
  zerpa: "Zerpa spreadsheet",
  xero: "Xero export",
  sage: "Sage export",
  google: "Google Contacts",
};

export function sourceLabel(source?: string) {
  return SOURCE_LABEL[source || ""] || "Spreadsheet";
}

async function postFile(path: string, file: File): Promise<ImportPreview & ImportResult> {
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
  body.append("entity", "accounts");
  body.append("file", file);
  const res = await fetch(`${CONFIG.apiUrl}${path}`, { method: "POST", headers, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not read that file");
  return data;
}

export function previewCustomers(input: { csv?: string; file?: File | null }) {
  if (input.file) return postFile("/imports/preview", input.file) as Promise<ImportPreview>;
  return apiRequest<ImportPreview>("/imports/preview", {
    method: "POST",
    body: { entity: "accounts", csv: input.csv || "" },
  });
}

export function commitCustomers(input: { csv?: string; file?: File | null }) {
  if (input.file) return postFile("/imports/commit", input.file) as Promise<ImportResult>;
  return apiRequest<ImportResult>("/imports/commit", {
    method: "POST",
    body: { entity: "accounts", csv: input.csv || "" },
  });
}
