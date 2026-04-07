"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Invoice } from "@zerpa/shared-types";
import { markInvoiceAsPaid } from "@/lib/data/invoices";

interface MarkPaidModalProps {
  invoice: Invoice;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaid?: () => void;
}

export function MarkPaidModal({
  invoice,
  open,
  onOpenChange,
  onPaid,
}: MarkPaidModalProps) {
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("EFT");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [confirming, setConfirming] = useState(false);

  const handleConfirm = async () => {
    if (!paymentDate || !paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    setConfirming(true);
    try {
      await markInvoiceAsPaid(invoice.id, paymentDate, paymentMethod);
      toast.success(`Invoice ${invoice.invoiceNumber} marked as paid`);
      onOpenChange(false);
      onPaid?.();
    } catch (error) {
      toast.error("Failed to mark invoice as paid");
      console.error(error);
    } finally {
      setConfirming(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-background rounded-[12px] max-w-sm w-full mx-4">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <h2 className="section-title">Record Payment</h2>
          <p className="text-sm text-muted-fg mt-1">
            {invoice.invoiceNumber} · {new Intl.NumberFormat("en-ZA", {
              style: "currency",
              currency: "ZAR",
            }).format(invoice.total || 0)}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4 px-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="payment-date">Payment Date *</Label>
            <Input
              id="payment-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-method">Payment Method *</Label>
            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-[6px] border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary-ring"
            >
              <option value="EFT">EFT</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reference">Reference / POP #</Label>
            <Input
              id="reference"
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. bank reference number"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
              rows={3}
              className="w-full px-3 py-2 rounded-[6px] border border-border bg-background text-foreground placeholder-muted-fg focus:outline-none focus:ring-2 focus:ring-primary-ring resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={confirming}
            className="bg-success text-white hover:bg-green-700"
          >
            {confirming ? (
              <Loader2 size={14} className="mr-1.5 animate-spin" />
            ) : (
              <CheckCircle size={14} className="mr-1.5" />
            )}
            {confirming ? "Confirming..." : "Confirm Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
}

