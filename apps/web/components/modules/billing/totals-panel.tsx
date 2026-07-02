/**
 * @file components/modules/billing/totals-panel.tsx
 * @description Live-computed totals card for quotes and invoices. Shows Sub Total,
 * document Discount, Exclusive, VAT and Grand Total. Optionally renders controls
 * to edit the document-level discount.
 */
"use client";

import { formatCurrency } from "@/lib/utils/currency";
import { computeBillingTotals } from "@/lib/utils/billing-calc";
import type { BillingLineItem, DiscountType } from "@zerpa/shared-types";

interface TotalsPanelProps {
  items: BillingLineItem[];
  discountType?: DiscountType;
  discountValue?: number;
  onDiscountChange?: (type: DiscountType, value: number) => void;
  editable?: boolean;
}

export function TotalsPanel({
  items,
  discountType = "none",
  discountValue = 0,
  onDiscountChange,
  editable = false,
}: TotalsPanelProps) {
  const totals = computeBillingTotals(items, discountType, discountValue);

  return (
    <div className="rounded-[12px] border border-border bg-background p-5 space-y-3">
      {editable && onDiscountChange && (
        <div className="pb-3 border-b border-border">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-fg">
            Document Discount
          </label>
          <div className="flex items-center gap-2 mt-1.5">
            <select
              value={discountType}
              onChange={(e) =>
                onDiscountChange(e.target.value as DiscountType, discountValue)
              }
              className="h-9 rounded-[6px] border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="none">None</option>
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed (R)</option>
            </select>
            <input
              type="number"
              min={0}
              step="any"
              disabled={discountType === "none"}
              value={discountValue}
              onChange={(e) =>
                onDiscountChange(discountType, parseFloat(e.target.value) || 0)
              }
              className="flex-1 h-9 rounded-[6px] border border-input bg-background px-2 text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
        </div>
      )}

      <Row label="Sub Total" value={formatCurrency(totals.subtotal)} />
      {totals.discountAmount > 0 && (
        <Row
          label="Total Discount"
          value={`− ${formatCurrency(totals.discountAmount)}`}
          muted
        />
      )}
      <Row label="Total Exclusive" value={formatCurrency(totals.netAfterDiscount)} muted />
      <Row label="Total VAT" value={formatCurrency(totals.taxTotal)} muted />
      <div className="border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Grand Total</span>
          <span className="font-mono text-lg font-bold text-foreground">
            {formatCurrency(totals.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${muted ? "text-muted-fg" : "text-foreground"}`}>
        {label}
      </span>
      <span className="font-mono text-sm text-foreground">{value}</span>
    </div>
  );
}
