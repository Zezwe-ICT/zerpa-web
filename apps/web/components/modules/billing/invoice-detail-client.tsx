/**
 * @file components/modules/billing/invoice-detail-client.tsx
 * @description Admin invoice detail view with full action bar: Send Invoice,
 * Mark as Paid, Void Invoice. Shows overdue alerts, live status updates
 * and renders the InvoicePreview for download or printing.
 */
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatDate, isOverdue } from "@/lib/utils/dates";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { InvoicePreview } from "./invoice-preview";
import { SendInvoiceModal } from "./send-invoice-modal";
import { MarkPaidModal } from "./mark-paid-modal";
import { Send, Download, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import type { Invoice } from "@zerpa/shared-types";

interface InvoiceDetailClientProps {
  invoice: Invoice;
}

export function InvoiceDetailClient({ invoice: initialInvoice }: InvoiceDetailClientProps) {
  const [invoice, setInvoice] = useState(initialInvoice);
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [markPaidModalOpen, setMarkPaidModalOpen] = useState(false);
  const [voidConfirming, setVoidConfirming] = useState(false);

  const handleDownloadPDF = () => {
    // In production, this would download from S3
    // For now, trigger browser print
    window.print();
    toast.success(`Download started for ${invoice.invoiceNumber}`);
  };

  const handleVoid = async () => {
    if (!window.confirm(`Void invoice ${invoice.invoiceNumber}? This cannot be undone.`)) {
      return;
    }

    setVoidConfirming(true);
    try {
      // In mock mode, we just update the local state
      const voidedInvoice = {
        ...invoice,
        status: "VOID" as const,
        voidedAt: new Date().toISOString(),
      };
      setInvoice(voidedInvoice);
      toast.success(`Invoice ${invoice.invoiceNumber} has been voided`);
    } catch (error) {
      toast.error("Failed to void invoice");
      console.error(error);
    } finally {
      setVoidConfirming(false);
    }
  };

  const showOverdueAlert = invoice.status === "OVERDUE";
  const pastDue = isOverdue(invoice.dueDate);

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left - Invoice Preview (2 cols) */}
      <div className="col-span-2 space-y-6">
        {/* Overdue Alert */}
        {showOverdueAlert && (
          <div className="rounded-[8px] bg-danger-bg border border-danger-ring p-4 flex items-start gap-3">
            <AlertTriangle size={16} className="text-danger mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-danger">Payment Overdue</p>
              <p className="text-xs text-danger/80 mt-0.5">
                This invoice is overdue. Please contact the client for payment.
              </p>
            </div>
          </div>
        )}

        {/* Invoice Preview */}
        <InvoicePreview invoice={invoice} className="max-w-2xl" />
      </div>

      {/* Right - Action Sidebar (1 col) */}
      <div className="rounded-[12px] border border-border bg-background p-5 h-fit sticky top-24 space-y-4">
        {/* Status */}
        <div className="space-y-2">
          <span className="text-xs text-muted-fg uppercase tracking-wide font-semibold">
            Status
          </span>
          <StatusBadge status={invoice.status} className="inline-block" />
        </div>

        {/* Sent Info */}
        {invoice.sentAt && (
          <p className="text-xs text-muted-fg">
            Sent {formatDate(invoice.sentAt, "dd MMM yyyy 'at' HH:mm")}
          </p>
        )}

        {/* Divider */}
        <div className="border-t border-border my-4" />

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {["DRAFT", "SENT", "OVERDUE"].includes(invoice.status) && (
            <Button
              className="w-full justify-start"
              onClick={() => setSendModalOpen(true)}
            >
              <Send size={14} className="mr-1.5" />
              {invoice.status === "DRAFT" ? "Send Invoice" : "Resend Invoice"}
            </Button>
          )}

          {["SENT", "OVERDUE"].includes(invoice.status) && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setMarkPaidModalOpen(true)}
            >
              <CheckCircle size={14} className="mr-1.5" />
              Mark as Paid
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleDownloadPDF}
          >
            <Download size={14} className="mr-1.5" />
            Download PDF
          </Button>

          {["DRAFT", "SENT"].includes(invoice.status) && (
            <Button
              variant="ghost"
              className="w-full justify-start text-danger hover:text-danger hover:bg-danger-bg"
              onClick={handleVoid}
              disabled={voidConfirming}
            >
              <Trash2 size={14} className="mr-1.5" />
              {voidConfirming ? "Voiding..." : "Void Invoice"}
            </Button>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-border my-4" />

        {/* Meta Information */}
        <dl className="space-y-3 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted-fg">Client</dt>
            <dd className="font-medium text-foreground text-right">
              {invoice.tenantName}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-fg">Type</dt>
            <dd className="font-medium text-foreground text-right">
              {invoice.type === "SETUP"
                ? "Setup Fee"
                : invoice.type === "SUBSCRIPTION"
                  ? "Subscription"
                  : "Ad-hoc"}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-fg">Subtotal</dt>
            <dd className="font-mono text-foreground text-right">
              <CurrencyDisplay amount={invoice.subtotal} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-fg">VAT (15%)</dt>
            <dd className="font-mono text-foreground text-right">
              <CurrencyDisplay amount={invoice.taxAmount} />
            </dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <dt className="font-semibold text-foreground">Total</dt>
            <dd className="font-mono font-semibold text-foreground text-right">
              <CurrencyDisplay amount={invoice.total || 0} />
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-fg">Created</dt>
            <dd className="text-foreground text-right">
              {formatDate(invoice.createdAt, "dd MMM yyyy")}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-fg">Due</dt>
            <dd
              className={cn(
                "text-right",
                pastDue && "text-danger font-semibold"
              )}
            >
              {formatDate(invoice.dueDate, "dd MMM yyyy")}
            </dd>
          </div>
          {invoice.paidAt && (
            <div className="flex justify-between">
              <dt className="text-muted-fg">Paid</dt>
              <dd className="text-success font-semibold text-right">
                {formatDate(invoice.paidAt, "dd MMM yyyy")}
              </dd>
            </div>
          )}
        </dl>
      </div>

      {/* Modals */}
      <SendInvoiceModal
        invoice={invoice}
        open={sendModalOpen}
        onOpenChange={setSendModalOpen}
        onSent={() => {
          setInvoice({
            ...invoice,
            status: "SENT",
            sentAt: new Date().toISOString(),
          });
        }}
      />

      <MarkPaidModal
        invoice={invoice}
        open={markPaidModalOpen}
        onOpenChange={setMarkPaidModalOpen}
        onPaid={() => {
          setInvoice({
            ...invoice,
            status: "PAID",
            paidAt: new Date().toISOString(),
          });
        }}
      />
    </div>
  );
}
