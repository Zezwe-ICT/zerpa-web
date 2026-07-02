/**
 * @file lib/utils/billing-calc.ts
 * @description Shared money maths for quotes and invoices. Computes line totals,
 * document-level discount, VAT and grand total from a set of line items so the
 * editors, totals panel and data layer all agree on the numbers.
 */
import type { BillingLineItem, DiscountType } from "@zerpa/shared-types";

export interface BillingTotals {
  /** Sum of line totals (qty × price × (1 - line discount)), before doc discount & VAT. */
  subtotal: number;
  /** Document-level discount amount (applied after subtotal, before VAT). */
  discountAmount: number;
  /** Net after document discount. */
  netAfterDiscount: number;
  /** Total VAT across all lines (computed on the discounted net, pro-rata per line). */
  taxTotal: number;
  /** Grand total: netAfterDiscount + taxTotal. */
  total: number;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Line total before tax: qty × unitPrice × (1 - discountPercent/100). */
export function computeLineTotal(item: BillingLineItem): number {
  const disc = item.discountPercent ?? 0;
  return round2(item.quantity * item.unitPrice * (1 - disc / 100));
}

/**
 * Compute all document totals from line items + a document-level discount.
 * The document discount is spread proportionally across lines before VAT so
 * that per-line VAT rates are respected.
 */
export function computeBillingTotals(
  items: BillingLineItem[],
  discountType: DiscountType = "none",
  discountValue = 0
): BillingTotals {
  const lineTotals = items.map((it) => it.lineTotal ?? computeLineTotal(it));
  const subtotal = round2(lineTotals.reduce((a, b) => a + b, 0));

  let discountAmount = 0;
  if (discountType === "percent") {
    discountAmount = round2(subtotal * (discountValue / 100));
  } else if (discountType === "fixed") {
    discountAmount = round2(Math.min(discountValue, subtotal));
  }

  const netAfterDiscount = round2(subtotal - discountAmount);
  const discountFactor = subtotal > 0 ? netAfterDiscount / subtotal : 1;

  let taxTotal = 0;
  items.forEach((it, i) => {
    const rate = it.taxRate ?? 15;
    const discountedLine = lineTotals[i] * discountFactor;
    taxTotal += discountedLine * (rate / 100);
  });
  taxTotal = round2(taxTotal);

  const total = round2(netAfterDiscount + taxTotal);
  return { subtotal, discountAmount, netAfterDiscount, taxTotal, total };
}
