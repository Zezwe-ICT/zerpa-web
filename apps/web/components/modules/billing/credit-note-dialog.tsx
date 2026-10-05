/**
 * @file components/modules/billing/credit-note-dialog.tsx
 * @description Issue a credit note against an invoice: the whole invoice, chosen lines and
 * quantities, or an amount. The server works out VAT and numbering; this shows a live estimate.
 */
"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Invoice } from "@zerpa/shared-types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCreditNote, type CreditMode } from "@/lib/api/credit-notes";
import { ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";

// Line ids come from the server (li-1, li-2…); fall back to position for older rows.
const lineKey = (li: { id?: string }, i: number) => li.id ?? `li-${i + 1}`;

const MODES: Array<{ key: CreditMode; label: string; hint: string }> = [
  { key: "full", label: "Whole invoice", hint: "Reverse everything on the invoice" },
  { key: "lines", label: "Some lines", hint: "Returned items or a wrong line" },
  { key: "amount", label: "An amount", hint: "A discount or goodwill credit" },
];

export function CreditNoteDialog({
  invoice,
  open,
  onOpenChange,
  onIssued,
}: {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIssued: (credit: Invoice) => void;
}) {
  const [mode, setMode] = useState<CreditMode>("full");
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alreadyCredited = (invoice.creditNotes ?? []).reduce((a, c) => a + c.total, 0);
  const remaining = Math.max(invoice.total - alreadyCredited, 0);

  const estimate = useMemo(() => {
    if (mode === "full") return remaining;
    if (mode === "amount") return Number(amount) || 0;
    return invoice.lineItems.reduce((sum, li, i) => {
      const q = qty[lineKey(li, i)] || 0;
      const net = q * li.unitPrice * (1 - (li.discountPercent || 0) / 100);
      return sum + net * (1 + (li.taxRate ?? 15) / 100);
    }, 0);
  }, [mode, amount, qty, invoice.lineItems, remaining]);

  const owed = invoice.balanceDue ?? 0;
  const refund = Math.max(estimate - owed, 0);

  async function submit() {
    setError(null);
    if (!reason.trim()) {
      setError("Give a reason. It is printed on the credit note.");
      return;
    }
    if (estimate <= 0) {
      setError(mode === "lines" ? "Choose how many of each line to credit." : "Enter an amount to credit.");
      return;
    }
    setBusy(true);
    try {
      const credit = await createCreditNote(invoice.id, {
        mode,
        reason: reason.trim(),
        ...(mode === "lines" ? { selection: Object.fromEntries(Object.entries(qty).filter(([, v]) => v > 0)) } : {}),
        ...(mode === "amount" ? { amount: Number(amount) } : {}),
      });
      toast.success(`Credit note ${credit.invoiceNumber} issued`);
      onIssued(credit);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not issue the credit note");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Credit note for {invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>
            Corrects an issued invoice without changing it. {formatCurrency(remaining)} of this invoice can still be credited.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="What to credit">
            {MODES.map((m) => (
              <button
                key={m.key}
                type="button"
                role="radio"
                aria-checked={mode === m.key}
                aria-label={`${m.label}: ${m.hint}`}
                onClick={() => setMode(m.key)}
                className={cn(
                  "rounded-[10px] border p-2.5 text-left transition-colors",
                  mode === m.key ? "border-primary bg-primary-tint" : "border-border hover:bg-surface",
                )}
              >
                <span className="block text-sm font-medium">{m.label}</span>
                <span className="block text-[11px] text-muted-fg leading-snug mt-0.5">{m.hint}</span>
              </button>
            ))}
          </div>

          {mode === "lines" && (
            <div className="rounded-[10px] border border-border divide-y divide-border max-h-56 overflow-y-auto">
              {invoice.lineItems.map((li, i) => (
                <div key={lineKey(li, i)} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{li.description}</p>
                    <p className="text-xs text-muted-fg">
                      {li.quantity} × {formatCurrency(li.unitPrice)} · VAT {li.taxRate ?? 15}%
                    </p>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={li.quantity}
                    step="any"
                    aria-label={`Quantity of ${li.description} to credit`}
                    className="w-20"
                    value={qty[lineKey(li, i)] ?? ""}
                    placeholder="0"
                    onChange={(e) =>
                      setQty((q) => ({ ...q, [lineKey(li, i)]: Math.min(Math.max(Number(e.target.value) || 0, 0), li.quantity) }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {mode === "amount" && (
            <div className="space-y-1.5">
              <Label htmlFor="credit-amount">Amount including VAT</Label>
              <Input
                id="credit-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="credit-reason">Reason *</Label>
            <Textarea
              id="credit-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Router returned unused, or wrong hourly rate charged"
            />
          </div>

          <div className="rounded-[10px] bg-surface p-3 text-sm space-y-1">
            <div className="flex justify-between font-medium">
              <span>Credit note total</span>
              <span className="font-mono">{formatCurrency(estimate)}</span>
            </div>
            <p className="text-xs text-muted-fg">
              {estimate <= 0
                ? "Choose what to credit."
                : refund > 0
                  ? `${formatCurrency(Math.min(estimate, owed))} comes off what they owe. ${formatCurrency(refund)} is a refund you owe them.`
                  : `This comes off the ${formatCurrency(owed)} they still owe.`}
            </p>
          </div>

          {error && <p className="text-sm text-danger bg-danger-bg rounded-[8px] px-3 py-2" role="alert">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Issuing…" : "Issue credit note"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
