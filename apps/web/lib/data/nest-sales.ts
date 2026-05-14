import { CONFIG } from "@/lib/config";
import { apiRequest } from "@/lib/api/client";
import {
  getMockNestSales,
  getMockNestSaleById,
  getMockProvisioningChecklist,
} from "@/lib/mock/nest-sales";
import type { NestSale, ProvisioningChecklistItem } from "@zerpa/shared-types";

// ─── API response shapes ─────────────────────────────────

interface ApiSale {
  id: string;
  tenantId: string;
  sourceLeadId: string | null;
  assignedAgentId: string | null;
  status: string; // PENDING | SETUP | ACTIVE | SUSPENDED | CANCELLED
  setupFeePaid: boolean;
  setupFeeAmount: number;
  monthlyAmount: number;
  freeMonths: number;
  trialStartDate: string | null;
  trialEndDate: string | null;
  billingStartDate: string | null;
  services: Record<string, unknown>;
  provisioningChecklist: Record<string, unknown>;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapApiSale(s: ApiSale): NestSale {
  return {
    id: s.id,
    tenantId: s.tenantId,
    status: s.status as NestSale["status"],
    setupFeePaid: s.setupFeePaid,
    setupFeeAmount: s.setupFeeAmount,
    monthlyAmount: s.monthlyAmount,
    trialStartAt: s.trialStartDate ?? s.createdAt,
    trialEndsAt: s.trialEndDate ?? s.createdAt,
    billingStartAt: s.billingStartDate ?? s.createdAt,
    assignedAgentId: s.assignedAgentId ?? undefined,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

// ─── Nest Sales ─────────────────────────────────────────

export async function getNestSales(
  status?: string,
  tenantId?: string
): Promise<NestSale[]> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const sales = await getMockNestSales();
    return status
      ? sales.filter((s) => s.status === status)
      : sales;
  }

  try {
    const params = new URLSearchParams();
    if (tenantId) params.set("tenantId", tenantId);
    if (status) params.set("status", status);
    const qs = params.toString();
    const sales = await apiRequest<ApiSale[]>(
      `/api/v1/sales${qs ? `?${qs}` : ""}`
    );
    return (sales ?? []).map(mapApiSale);
  } catch (error) {
    console.error("Failed to fetch sales:", error);
    return [];
  }
}

export async function getNestSaleById(
  id: string,
  tenantId?: string
): Promise<NestSale | undefined> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 200));
    return getMockNestSaleById(id);
  }

  try {
    const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
    const sale = await apiRequest<ApiSale>(`/api/v1/sales/${id}${qs}`);
    return sale ? mapApiSale(sale) : undefined;
  } catch (error) {
    console.error("Failed to fetch sale:", error);
    return undefined;
  }
}

export async function updateNestSaleStatus(
  id: string,
  status: string,
  tenantId?: string
): Promise<NestSale> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const sale = await getMockNestSaleById(id);
    if (!sale) throw new Error("Nest Sale not found");
    return { ...sale, status: status as NestSale["status"], updatedAt: new Date().toISOString() };
  }

  if (status === "ACTIVE") {
    const sale = await apiRequest<ApiSale>(`/api/v1/sales/${id}/activate`, {
      method: "PATCH",
      body: { tenantId },
    });
    return mapApiSale(sale);
  }

  if (status === "SUSPENDED") {
    const sale = await apiRequest<ApiSale>(`/api/v1/sales/${id}/suspend`, {
      method: "POST",
      body: { tenantId },
    });
    return mapApiSale(sale);
  }

  throw new Error(`Status transition to ${status} is not supported`);
}

// ─── Provisioning Checklist ─────────────────────────────

export async function getProvisioningChecklist(
  nestSaleId: string,
  tenantId?: string
): Promise<ProvisioningChecklistItem[]> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 200));
    return getMockProvisioningChecklist(nestSaleId);
  }

  try {
    const qs = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : "";
    const sale = await apiRequest<ApiSale>(`/api/v1/sales/${nestSaleId}${qs}`);
    if (!sale?.provisioningChecklist) return [];
    // Convert the object map to an array of ProvisioningChecklistItem
    return Object.entries(sale.provisioningChecklist).map(
      ([key, value], idx) => {
        const item = value as Record<string, unknown>;
        return {
          id: (item.id as string) ?? key,
          nestSaleId,
          label: (item.label as string) ?? key,
          completed: Boolean(item.completed),
          completedBy: (item.completedBy as string) ?? undefined,
          completedAt: (item.completedAt as string) ?? undefined,
          order: (item.order as number) ?? idx,
        };
      }
    );
  } catch (error) {
    console.error("Failed to fetch checklist:", error);
    return [];
  }
}

export async function completeChecklistItem(
  nestSaleId: string,
  itemId: string,
  completedBy: string,
  tenantId?: string
): Promise<ProvisioningChecklistItem> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 200));
    const checklist = await getMockProvisioningChecklist(nestSaleId);
    const item = checklist.find((i) => i.id === itemId);
    if (!item) throw new Error("Checklist item not found");
    return { ...item, completed: true, completedBy, completedAt: new Date().toISOString() };
  }

  // Fetch current checklist, update item, PATCH back
  const currentList = await getProvisioningChecklist(nestSaleId, tenantId);
  const updated: Record<string, unknown> = {};
  for (const item of currentList) {
    updated[item.id] = {
      id: item.id,
      label: item.label,
      order: item.order,
      completed: item.id === itemId ? true : item.completed,
      completedBy: item.id === itemId ? completedBy : item.completedBy,
      completedAt: item.id === itemId ? new Date().toISOString() : item.completedAt,
    };
  }

  await apiRequest(`/api/v1/sales/${nestSaleId}/checklist`, {
    method: "PATCH",
    body: { tenantId, provisioningChecklist: updated },
  });

  const target = currentList.find((i) => i.id === itemId);
  if (!target) throw new Error("Checklist item not found");
  return { ...target, completed: true, completedBy, completedAt: new Date().toISOString() };
}

export async function uncompleteChecklistItem(
  nestSaleId: string,
  itemId: string,
  tenantId?: string
): Promise<ProvisioningChecklistItem> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 200));
    const checklist = await getMockProvisioningChecklist(nestSaleId);
    const item = checklist.find((i) => i.id === itemId);
    if (!item) throw new Error("Checklist item not found");
    return { ...item, completed: false, completedBy: undefined, completedAt: undefined };
  }

  const currentList = await getProvisioningChecklist(nestSaleId, tenantId);
  const updated: Record<string, unknown> = {};
  for (const item of currentList) {
    updated[item.id] = {
      id: item.id,
      label: item.label,
      order: item.order,
      completed: item.id === itemId ? false : item.completed,
      completedBy: item.id === itemId ? null : item.completedBy,
      completedAt: item.id === itemId ? null : item.completedAt,
    };
  }

  await apiRequest(`/api/v1/sales/${nestSaleId}/checklist`, {
    method: "PATCH",
    body: { tenantId, provisioningChecklist: updated },
  });

  const target = currentList.find((i) => i.id === itemId);
  if (!target) throw new Error("Checklist item not found");
  return { ...target, completed: false, completedBy: undefined, completedAt: undefined };
}
