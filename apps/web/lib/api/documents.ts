import { CONFIG } from "@/lib/config";
import { getToken } from "@/lib/api/client";

export async function uploadDocument(file: File, name?: string) {
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
  if (name || file.name) body.append("name", name || file.name);
  const res = await fetch(`${CONFIG.apiUrl}/documents`, { method: "POST", headers, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Could not upload that file");
  return data as { id: string; name: string; hasFile: boolean };
}
