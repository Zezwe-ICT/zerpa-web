import { CONFIG } from "@/lib/config";
import {
  getMockNestSales,
  getMockNestSaleById,
  getMockProvisioningChecklist,
} from "@/lib/mock/nest-sales";
import type { NestSale, ProvisioningChecklistItem } from "@zerpa/shared-types";

// ─── Nest Sales ─────────────────────────────────────────

export async function getNestSales(
  status?: string
): Promise<NestSale[]> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const sales = await getMockNestSales();
    return status
      ? sales.filter((s) => s.status === status)
      : sales;
  }

  // TODO: Implement API call
  // const response = await fetch("/api/nest-sales", { headers: apiHeaders });
  // return response.json();
  return [];
}

export async function getNestSaleById(id: string): Promise<NestSale | undefined> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 200));
    return getMockNestSaleById(id);
  }

  // TODO: Implement API call
  // const response = await fetch(`/api/nest-sales/${id}`, { headers: apiHeaders });
  // if (!response.ok) return undefined;
  // return response.json();
  return undefined;
}

export async function updateNestSaleStatus(
  id: string,
  status: string
): Promise<NestSale> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 300));
    const sale = await getMockNestSaleById(id);
    if (!sale) throw new Error("Nest Sale not found");

    return {
      ...sale,
      status: status as any,
      updatedAt: new Date().toISOString(),
    };
  }

  // TODO: Implement API call
  throw new Error("Not implemented");
}

// ─── Provisioning Checklist ─────────────────────────────

export async function getProvisioningChecklist(
  nestSaleId: string
): Promise<ProvisioningChecklistItem[]> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 200));
    return getMockProvisioningChecklist(nestSaleId);
  }

  // TODO: Implement API call
  return [];
}

export async function completeChecklistItem(
  nestSaleId: string,
  itemId: string,
  completedBy: string
): Promise<ProvisioningChecklistItem> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 200));
    const checklist = await getMockProvisioningChecklist(nestSaleId);
    const item = checklist.find((i) => i.id === itemId);
    if (!item) throw new Error("Checklist item not found");

    return {
      ...item,
      completed: true,
      completedBy,
      completedAt: new Date().toISOString(),
    };
  }

  // TODO: Implement API call
  throw new Error("Not implemented");
}

export async function uncompleteChecklistItem(
  nestSaleId: string,
  itemId: string
): Promise<ProvisioningChecklistItem> {
  if (CONFIG.useMock) {
    await new Promise((r) => setTimeout(r, 200));
    const checklist = await getMockProvisioningChecklist(nestSaleId);
    const item = checklist.find((i) => i.id === itemId);
    if (!item) throw new Error("Checklist item not found");

    return {
      ...item,
      completed: false,
      completedBy: undefined,
      completedAt: undefined,
    };
  }

  // TODO: Implement API call
  throw new Error("Not implemented");
}
