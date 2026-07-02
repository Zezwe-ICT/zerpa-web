/**
 * @file components/modules/billing/line-item-editor.tsx
 * @description Reusable editable line-item table shared by the quote, invoice and
 * automation-config editors. Columns: Description · Unit · Qty · Unit Price ·
 * Disc % · Tax % · Line Total · delete. Supports add-from-catalogue (product
 * autocomplete) and add-custom-line. Fully controlled via value/onChange.
 */
"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/currency";
import { computeLineTotal } from "@/lib/utils/billing-calc";
import { ProductAutocomplete } from "./product-autocomplete";
import type { BillingLineItem, ProductService } from "@zerpa/shared-types";

interface LineItemEditorProps {
  items: BillingLineItem[];
  onChange: (items: BillingLineItem[]) => void;
  /** Hide the Disc % column (e.g. automation configs). */
  showDiscount?: boolean;
}

function emptyLine(sortOrder: number): BillingLineItem {
  return {
    id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    productServiceId: null,
    description: "",
    quantity: 1,
    unit: null,
    unitPrice: 0,
    discountPercent: 0,
    taxRate: 15,
    lineTotal: 0,
    sortOrder,
  };
}

export function LineItemEditor({
  items,
  onChange,
  showDiscount = true,
}: LineItemEditorProps) {
  function update(index: number, patch: Partial<BillingLineItem>) {
    const next = items.map((it, i) => {
      if (i !== index) return it;
      const merged = { ...it, ...patch };
      return { ...merged, lineTotal: computeLineTotal(merged) };
    });
    onChange(next);
  }

  function addCustom() {
    onChange([...items, emptyLine(items.length)]);
  }

  function addFromProduct(p: ProductService) {
    const line: BillingLineItem = {
      id: `li-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productServiceId: p.id,
      description: p.description || p.name,
      quantity: 1,
      unit: p.unit ?? null,
      unitPrice: p.unitPrice,
      discountPercent: 0,
      taxRate: p.taxRate,
      sortOrder: items.length,
    };
    line.lineTotal = computeLineTotal(line);
    onChange([...items, line]);
  }

  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const numCols = showDiscount ? 8 : 7;

  return (
    <div className="space-y-3">
      <div className="rounded-[12px] border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface text-left">
                <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wide text-muted-fg">
                  Description
                </th>
                <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wide text-muted-fg w-24">
                  Unit
                </th>
                <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wide text-muted-fg w-20 text-right">
                  Qty
                </th>
                <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wide text-muted-fg w-28 text-right">
                  Unit Price
                </th>
                {showDiscount && (
                  <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wide text-muted-fg w-20 text-right">
                    Disc %
                  </th>
                )}
                <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wide text-muted-fg w-20 text-right">
                  Tax %
                </th>
                <th className="px-3 py-2 font-semibold text-xs uppercase tracking-wide text-muted-fg w-28 text-right">
                  Line Total
                </th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={numCols}
                    className="px-3 py-6 text-center text-sm text-muted-fg"
                  >
                    No line items yet. Add one below.
                  </td>
                </tr>
              )}
              {items.map((item, index) => (
                <tr key={item.id ?? index} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <input
                      value={item.description}
                      onChange={(e) => update(index, { description: e.target.value })}
                      placeholder="Description"
                      className="w-full h-9 rounded-[6px] border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={item.unit ?? ""}
                      onChange={(e) => update(index, { unit: e.target.value || null })}
                      placeholder="each"
                      className="w-full h-9 rounded-[6px] border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.quantity}
                      onChange={(e) =>
                        update(index, { quantity: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-9 rounded-[6px] border border-input bg-background px-2 text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.unitPrice}
                      onChange={(e) =>
                        update(index, { unitPrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-9 rounded-[6px] border border-input bg-background px-2 text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  {showDiscount && (
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={item.discountPercent ?? 0}
                        onChange={(e) =>
                          update(index, {
                            discountPercent: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full h-9 rounded-[6px] border border-input bg-background px-2 text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </td>
                  )}
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={item.taxRate ?? 15}
                      onChange={(e) =>
                        update(index, { taxRate: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full h-9 rounded-[6px] border border-input bg-background px-2 text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-sm font-semibold">
                    {formatCurrency(computeLineTotal(item))}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-muted-fg hover:text-danger transition-colors"
                      title="Remove line"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <ProductAutocomplete
          onSelect={addFromProduct}
          className="flex-1"
          placeholder="Add from catalogue…"
        />
        <Button type="button" variant="outline" size="sm" onClick={addCustom}>
          <Plus size={14} className="mr-1.5" />
          Add custom line
        </Button>
      </div>
    </div>
  );
}
