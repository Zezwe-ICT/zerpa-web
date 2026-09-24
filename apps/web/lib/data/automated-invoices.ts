/**
 * Repeat invoices for the signed-in company.
 * Live mode uses /billing/recurring. Mock mode keeps a browser-only list.
 */
import type {
  AutomatedInvoiceConfig,
  AutomatedInvoiceOneTimeAddition,
} from "@zerpa/shared-types";
import { apiRequest } from "@/lib/api/client";
import { CONFIG } from "@/lib/config";
import { MOCK_AUTOMATED_CONFIGS } from "@/lib/mock/automated-invoices";

const MOCK_DELAY = 250;
const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY));
const nowIso = () => new Date().toISOString();

let store: AutomatedInvoiceConfig[] = MOCK_AUTOMATED_CONFIGS.map((c) => ({ ...c }));

function live() {
  return !CONFIG.useMock;
}

export function computeNextRunDate(from: Date, dayOfMonth: number): string {
  const day = Math.min(Math.max(dayOfMonth, 1), 28);
  const d = new Date(from.getFullYear(), from.getMonth() + 1, day);
  return d.toISOString().split("T")[0];
}

export async function getAutomatedConfigs(): Promise<AutomatedInvoiceConfig[]> {
  if (live()) return apiRequest<AutomatedInvoiceConfig[]>("/billing/recurring");
  await delay();
  return store.map((c) => ({ ...c }));
}

export async function getAutomatedConfigById(id: string): Promise<AutomatedInvoiceConfig | null> {
  if (live()) {
    try {
      return await apiRequest<AutomatedInvoiceConfig>(`/billing/recurring/${id}`);
    } catch {
      return null;
    }
  }
  await delay();
  const found = store.find((c) => c.id === id);
  return found ? { ...found } : null;
}

export async function createAutomatedConfig(data: Partial<AutomatedInvoiceConfig>): Promise<AutomatedInvoiceConfig> {
  if (live()) return apiRequest<AutomatedInvoiceConfig>("/billing/recurring", { method: "POST", body: data });
  await delay();
  const startDate = data.startDate ?? nowIso().split("T")[0];
  const dayOfMonth = data.dayOfMonth ?? 1;
  const config: AutomatedInvoiceConfig = {
    id: `aic-${Date.now()}`,
    name: data.name ?? "Untitled automation",
    customerId: data.customerId ?? "",
    customerName: data.customerName ?? "",
    isActive: data.isActive ?? true,
    recurrence: data.recurrence ?? "monthly_indefinite",
    startDate,
    endDate: data.endDate ?? null,
    dayOfMonth,
    generationMode: data.generationMode ?? "draft",
    paymentTermsDays: data.paymentTermsDays ?? 30,
    subjectTemplate: data.subjectTemplate ?? "Monthly IT Services — {month} {year}",
    notesTemplate: data.notesTemplate ?? null,
    internalNotes: data.internalNotes ?? null,
    nextRunDate: data.nextRunDate ?? startDate,
    lastRunDate: data.lastRunDate ?? null,
    lineItems: data.lineItems ?? [],
    oneTimeAdditions: data.oneTimeAdditions ?? [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  store = [config, ...store];
  return { ...config };
}

export async function updateAutomatedConfig(
  id: string,
  data: Partial<AutomatedInvoiceConfig>,
): Promise<AutomatedInvoiceConfig> {
  if (live()) return apiRequest<AutomatedInvoiceConfig>(`/billing/recurring/${id}`, { method: "PATCH", body: data });
  await delay();
  const idx = store.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Automation config not found");
  store[idx] = { ...store[idx], ...data, id, updatedAt: nowIso() };
  return { ...store[idx] };
}

export async function toggleAutomatedConfigActive(id: string, isActive: boolean): Promise<AutomatedInvoiceConfig> {
  return updateAutomatedConfig(id, { isActive });
}

export async function deleteAutomatedConfig(id: string): Promise<void> {
  if (live()) {
    await apiRequest(`/billing/recurring/${id}`, { method: "DELETE" });
    return;
  }
  await delay();
  store = store.filter((c) => c.id !== id);
}

export async function runAutomatedConfig(id: string): Promise<{ invoiceNumber: string; total: number; status: string }> {
  return apiRequest(`/billing/recurring/${id}/run`, { method: "POST", body: {} });
}

export async function addOneTimeAddition(
  configId: string,
  addition: Omit<AutomatedInvoiceOneTimeAddition, "id" | "configId" | "createdAt" | "status"> & {
    status?: AutomatedInvoiceOneTimeAddition["status"];
  },
): Promise<AutomatedInvoiceConfig> {
  if (live()) {
    return apiRequest<AutomatedInvoiceConfig>(`/billing/recurring/${configId}/additions`, {
      method: "POST",
      body: addition,
    });
  }
  await delay();
  const idx = store.findIndex((c) => c.id === configId);
  if (idx === -1) throw new Error("Automation config not found");
  const record: AutomatedInvoiceOneTimeAddition = {
    id: `ota-${Date.now()}`,
    configId,
    status: addition.status ?? "pending",
    createdAt: nowIso(),
    billingMonth: addition.billingMonth,
    productServiceId: addition.productServiceId ?? null,
    description: addition.description,
    quantity: addition.quantity,
    unit: addition.unit ?? null,
    unitPrice: addition.unitPrice,
    taxRate: addition.taxRate ?? 15,
    notes: addition.notes ?? null,
  };
  store[idx] = {
    ...store[idx],
    oneTimeAdditions: [...store[idx].oneTimeAdditions, record],
    updatedAt: nowIso(),
  };
  return { ...store[idx] };
}

export async function cancelOneTimeAddition(configId: string, additionId: string): Promise<AutomatedInvoiceConfig> {
  if (live()) {
    return apiRequest<AutomatedInvoiceConfig>(`/billing/recurring/${configId}/additions/${additionId}/cancel`, {
      method: "POST",
      body: {},
    });
  }
  await delay();
  const idx = store.findIndex((c) => c.id === configId);
  if (idx === -1) throw new Error("Automation config not found");
  store[idx] = {
    ...store[idx],
    oneTimeAdditions: store[idx].oneTimeAdditions.map((a) =>
      a.id === additionId ? { ...a, status: "cancelled" } : a,
    ),
    updatedAt: nowIso(),
  };
  return { ...store[idx] };
}
