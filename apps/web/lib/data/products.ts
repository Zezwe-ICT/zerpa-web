/**
 * @file lib/data/products.ts
 * @description Data layer for the Products & Services catalogue.
 *
 * There is no backend endpoint for products yet, so this module keeps a
 * module-level in-memory store seeded from MOCK_PRODUCTS. Reads/writes work in
 * the browser session regardless of CONFIG.useMock. When the API lands, swap the
 * bodies for apiRequest("/api/v1/billing/products", ...) calls — the signatures
 * are already shaped for it.
 */
import type { ProductService } from "@zerpa/shared-types";
import { MOCK_PRODUCTS } from "@/lib/mock/products";

const MOCK_DELAY = 200;
const delay = () => new Promise((r) => setTimeout(r, MOCK_DELAY));

// Clone so we never mutate the imported seed array directly.
let store: ProductService[] = MOCK_PRODUCTS.map((p) => ({ ...p }));

function nowIso() {
  return new Date().toISOString();
}

/** List products. Pass includeArchived=false to hide inactive items. */
export async function getProducts(
  includeArchived = true
): Promise<ProductService[]> {
  await delay();
  const list = includeArchived ? store : store.filter((p) => p.isActive);
  return list.map((p) => ({ ...p }));
}

/** Only active products — used by the line-item product autocomplete. */
export async function getActiveProducts(): Promise<ProductService[]> {
  return getProducts(false);
}

export async function getProductById(
  id: string
): Promise<ProductService | null> {
  await delay();
  const found = store.find((p) => p.id === id);
  return found ? { ...found } : null;
}

export async function createProduct(
  data: Partial<ProductService>
): Promise<ProductService> {
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

export async function updateProduct(
  id: string,
  data: Partial<ProductService>
): Promise<ProductService> {
  await delay();
  const idx = store.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error("Product not found");
  store[idx] = { ...store[idx], ...data, id, updatedAt: nowIso() };
  return { ...store[idx] };
}

/** Soft-delete: flip isActive to false. Historical documents keep their data. */
export async function archiveProduct(id: string): Promise<ProductService> {
  return updateProduct(id, { isActive: false });
}

export async function restoreProduct(id: string): Promise<ProductService> {
  return updateProduct(id, { isActive: true });
}
