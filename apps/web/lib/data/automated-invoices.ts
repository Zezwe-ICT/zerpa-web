/**
 * @file lib/data/automated-invoices.ts
 * @description Data layer for Automated Invoice configs. In-memory store seeded
 * from MOCK_AUTOMATED_CONFIGS (no backend yet). Includes helpers to add/cancel
 * one-time additions and to compute the next run date.
 */
import type {
  AutomatedInvoiceConfig,
  AutomatedInvoiceOneTimeAddition,
} from "@zerpa/shared-types";
import { MOCK_AUTOMATED_CONFIGS } from "@/lib/mock/automated-invoices";

const MOCK_DELAY = 250;
const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY));
const nowIso = () => new Date().toISOString();

let store: AutomatedInvoiceConfig[] = MOCK_AUTOMATED_CONFIGS.map((c) => ({
  ...c,
}));

/** Next run date: next month on dayOfMonth (capped at 28), from a base date. */
export function computeNextRunDate(
  from: Date,
  dayOfMonth: number
): string {
  const day = Math.min(Math.max(dayOfMonth, 1), 28);
  const d = new Date(from.getFullYear(), from.getMonth() + 1, day);
  return d.toISOString().split("T")[0];
}

export async function getAutomatedConfigs(): Promise<AutomatedInvoiceConfig[]> {
  await delay();
  return store.map((c) => ({ ...c }));
}

export async function getAutomatedConfigById(
  id: string
): Promise<AutomatedInvoiceConfig | null> {
  await delay();
  const found = store.find((c) => c.id === id);
  return found ? { ...found } : null;
}

export async function createAutomatedConfig(
  data: Partial<AutomatedInvoiceConfig>
): Promise<AutomatedInvoiceConfig> {
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
    subjectTemplate:
      data.subjectTemplate ?? "Monthly IT Services — {month} {year}",
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
  data: Partial<AutomatedInvoiceConfig>
): Promise<AutomatedInvoiceConfig> {
  await delay();
  const idx = store.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error("Automation config not found");
  store[idx] = { ...store[idx], ...data, id, updatedAt: nowIso() };
  return { ...store[idx] };
}

export async function toggleAutomatedConfigActive(
  id: string,
  isActive: boolean
): Promise<AutomatedInvoiceConfig> {
  return updateAutomatedConfig(id, { isActive });
}

export async function deleteAutomatedConfig(id: string): Promise<void> {
  await delay();
  store = store.filter((c) => c.id !== id);
}

export async function addOneTimeAddition(
  configId: string,
  addition: Omit<AutomatedInvoiceOneTimeAddition, "id" | "configId" | "createdAt" | "status"> & {
    status?: AutomatedInvoiceOneTimeAddition["status"];
  }
): Promise<AutomatedInvoiceConfig> {
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

export async function cancelOneTimeAddition(
  configId: string,
  additionId: string
): Promise<AutomatedInvoiceConfig> {
  await delay();
  const idx = store.findIndex((c) => c.id === configId);
  if (idx === -1) throw new Error("Automation config not found");
  store[idx] = {
    ...store[idx],
    oneTimeAdditions: store[idx].oneTimeAdditions.map((a) =>
      a.id === additionId ? { ...a, status: "cancelled" } : a
    ),
    updatedAt: nowIso(),
  };
  return { ...store[idx] };
}
