import { CONFIG } from "@/lib/config";
import {
  getMockNestSales,
  getMockNestSaleById,
  getMockProvisioningChecklist,
} from "@/lib/mock/nest-sales";
import {
  listNestSales,
  getNestSale,
  transitionNestSale,
  listNestChecklist,
  patchNestChecklistItem,
} from "@/lib/api/verticals";
import type { NestSale, ProvisioningChecklistItem } from "@zerpa/shared-types";

function mapSale(row: any): NestSale {
  return {
    id: row.id,
    tenantId: row.tenantId,
    status: row.status,
    setupFeeAmount: row.setupFeeAmount,
    setupFeePaid: row.setupFeePaid,
    setupFeePaidAt: row.setupFeePaidAt,
    monthlyAmount: row.monthlyAmount,
    trialStartAt: row.trialStartAt || "",
    trialEndsAt: row.trialEndsAt || "",
    billingStartAt: row.billingStartAt || "",
    assignedAgentId: row.assignedAgentId,
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedAt || new Date().toISOString(),
  };
}

function mapItem(row: any): ProvisioningChecklistItem {
  return {
    id: row.id,
    nestSaleId: row.nestSaleId,
    label: row.label,
    completed: row.completed,
    completedBy: row.completedBy,
    completedAt: row.completedAt,
    order: row.order,
  };
}

export async function getNestSales(status?: string, tenantId?: string): Promise<NestSale[]> {
  if (!CONFIG.useMock) {
    void tenantId;
    const rows = await listNestSales(status);
    return rows.map(mapSale);
  }
  await new Promise((r) => setTimeout(r, 300));
  const sales = await getMockNestSales();
  return status ? sales.filter((s) => s.status === status) : sales;
}

export async function getNestSaleById(id: string, tenantId?: string): Promise<NestSale | undefined> {
  if (!CONFIG.useMock) {
    void tenantId;
    try {
      return mapSale(await getNestSale(id));
    } catch {
      return undefined;
    }
  }
  await new Promise((r) => setTimeout(r, 200));
  return getMockNestSaleById(id);
}

export async function updateNestSaleStatus(id: string, status: string, tenantId?: string): Promise<NestSale> {
  if (!CONFIG.useMock) {
    void tenantId;
    return mapSale(await transitionNestSale(id, status));
  }
  await new Promise((r) => setTimeout(r, 300));
  const sale = await getMockNestSaleById(id);
  if (!sale) throw new Error("Nest Sale not found");
  return { ...sale, status: status as NestSale["status"], updatedAt: new Date().toISOString() };
}

export async function getProvisioningChecklist(
  nestSaleId: string,
  tenantId?: string
): Promise<ProvisioningChecklistItem[]> {
  if (!CONFIG.useMock) {
    void tenantId;
    return (await listNestChecklist(nestSaleId)).map(mapItem);
  }
  await new Promise((r) => setTimeout(r, 200));
  return getMockProvisioningChecklist(nestSaleId);
}

export async function completeChecklistItem(
  nestSaleId: string,
  itemId: string,
  completedBy: string,
  tenantId?: string
): Promise<ProvisioningChecklistItem> {
  if (!CONFIG.useMock) {
    void tenantId;
    return mapItem(await patchNestChecklistItem(nestSaleId, itemId, { completed: true, completedBy }));
  }
  await new Promise((r) => setTimeout(r, 200));
  const checklist = await getMockProvisioningChecklist(nestSaleId);
  const item = checklist.find((i) => i.id === itemId);
  if (!item) throw new Error("Checklist item not found");
  return { ...item, completed: true, completedBy, completedAt: new Date().toISOString() };
}

export async function uncompleteChecklistItem(
  nestSaleId: string,
  itemId: string,
  tenantId?: string
): Promise<ProvisioningChecklistItem> {
  if (!CONFIG.useMock) {
    void tenantId;
    return mapItem(await patchNestChecklistItem(nestSaleId, itemId, { completed: false }));
  }
  await new Promise((r) => setTimeout(r, 200));
  const checklist = await getMockProvisioningChecklist(nestSaleId);
  const item = checklist.find((i) => i.id === itemId);
  if (!item) throw new Error("Checklist item not found");
  return { ...item, completed: false, completedBy: undefined, completedAt: undefined };
}
