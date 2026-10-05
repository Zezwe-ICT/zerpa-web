/**
 * @file lib/api/inventory.ts
 * @description Stock levels, stock counts/adjustments and movement history.
 */
import type { ProductService } from "@zerpa/shared-types";
import { apiRequest } from "./client";

export interface StockMove {
  id: string;
  quantity: number;
  balanceAfter: number;
  reason: "sale" | "return" | "purchase" | "adjustment" | "opening" | "reversal";
  reference: string | null;
  note: string | null;
  sourceType: "invoice" | "supplier_bill" | null;
  sourceId: string | null;
  user: string | null;
  at: string;
}

export const getInventorySummary = () =>
  apiRequest<{ trackedCount: number; stockValue: number; lowStock: ProductService[]; outOfStock: number }>("/inventory/summary");
export const getStockMoves = (productId: string) =>
  apiRequest<{ product: ProductService; moves: StockMove[] }>(`/billing/products/${productId}/stock`);
export const changeStock = (productId: string, body: { mode: "count" | "adjust"; quantity: number; note?: string }) =>
  apiRequest<ProductService>(`/billing/products/${productId}/stock`, { method: "POST", body });
