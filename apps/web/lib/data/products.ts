/**
 * Products and services for the signed-in company.
 * Live mode uses /billing/products. Mock mode keeps a browser-only list.
 */
import type { ProductService } from "@zerpa/shared-types";
import { apiRequest } from "@/lib/api/client";
import { CONFIG } from "@/lib/config";
import { MOCK_PRODUCTS } from "@/lib/mock/products";

const MOCK_DELAY = 200;
const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY));

let store: ProductService[] = MOCK_PRODUCTS.map((p) => ({ ...p }));

function nowIso() {
  return new Date().toISOString();
}

function live() {
  return !CONFIG.useMock;
}

export async function getProducts(includeArchived = true): Promise<ProductService[]> {
  if (live()) {
    const rows = await apiRequest<ProductService[]>("/billing/products");
    return includeArchived ? rows : rows.filter((p) => p.isActive);
  }
  await delay();
  const list = includeArchived ? store : store.filter((p) => p.isActive);
  return list.map((p) => ({ ...p }));
}

export async function getActiveProducts(): Promise<ProductService[]> {
  return getProducts(false);
}

export async function getProductById(id: string): Promise<ProductService | null> {
  if (live()) {
    try {
      return await apiRequest<ProductService>(`/billing/products/${id}`);
    } catch {
      return null;
    }
  }
  await delay();
  const found = store.find((p) => p.id === id);
  return found ? { ...found } : null;
}

export async function createProduct(data: Partial<ProductService>): Promise<ProductService> {
  if (live()) {
    return apiRequest<ProductService>("/billing/products", {
      method: "POST",
      body: {
        name: data.name ?? "",
        description: data.description ?? "",
        category: data.category ?? "other",
        unit: data.unit ?? "",
        unitPrice: data.unitPrice ?? 0,
        taxRate: data.taxRate ?? 15,
        billingCycle: data.billingCycle ?? "once_off",
        isActive: data.isActive ?? true,
        sku: data.sku ?? "",
        trackStock: data.trackStock ?? false,
        reorderLevel: data.reorderLevel ?? 0,
        costPrice: data.costPrice ?? 0,
        openingStock: data.openingStock ?? 0,
      },
    });
  }
  await delay();
  const product: ProductService = {
    id: `ps-${Date.now()}`,
    name: data.name ?? "Untitled",
    description: data.description ?? "",
    category: data.category ?? "other",
    unit: data.unit ?? null,
    unitPrice: data.unitPrice ?? 0,
    taxRate: data.taxRate ?? 15,
    billingCycle: data.billingCycle ?? "once_off",
    isActive: data.isActive ?? true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  store = [product, ...store];
  return { ...product };
}

export async function updateProduct(id: string, data: Partial<ProductService>): Promise<ProductService> {
  if (live()) {
    return apiRequest<ProductService>(`/billing/products/${id}`, { method: "PATCH", body: data });
  }
  await delay();
  const idx = store.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Product not found");
  store[idx] = { ...store[idx], ...data, id, updatedAt: nowIso() };
  return { ...store[idx] };
}

export async function archiveProduct(id: string): Promise<ProductService> {
  return updateProduct(id, { isActive: false });
}

export async function restoreProduct(id: string): Promise<ProductService> {
  return updateProduct(id, { isActive: true });
}
