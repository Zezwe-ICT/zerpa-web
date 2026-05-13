/**
 * @file components/modules/billing/client-invoice-detail.tsx
 * @description Client-portal invoice detail view. Shows invoice metadata, line
 * items table, totals and a PDF download button. Displays an overdue alert banner
 * when the invoice is past due. Read-only (no admin actions).
 */
"use client";

import { formatDate, isOverdue } from "@/lib/utils/dates";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { InvoicePreview } from "./invoice-preview";
import { Download, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Invoice } from "@zerpa/shared-types";

interface ClientInvoiceDetailProps {
  invoice: Invoice;
}

export function ClientInvoiceDetail({ invoice }: ClientInvoiceDetailProps) {
  const showOverdueAlert = invoice.status === "OVERDUE";
  const pastDue = isOverdue(invoice.dueDate);

  const handleDownloadPDF = () => {
    // In production, this would download from S3
    // For now, trigger browser print
    window.print();
  };

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
                This invoice is overdue. Please arrange payment immediately.
              </p>
            </div>
          </div>
        )}

        {/* Invoice Preview */}
        <InvoicePreview invoice={invoice} className="max-w-2xl" />
      </div>

      {/* Right - Info Sidebar (1 col) */}
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

        {/* Download Button */}
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleDownloadPDF}
        >
          <Download size={14} className="mr-1.5" />
          Download PDF
        </Button>

        {/* Divider */}
        <div className="border-t border-border my-4" />

        {/* Meta Information */}
        <dl className="space-y-3 text-xs">
          <div className="flex justify-between">
            <dt className="text-muted-fg">Invoice Type</dt>
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
            <dt className="text-muted-fg">Issued</dt>
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

        {/* Payment Info - Only shown if not paid or overdue */}
        {invoice.status !== "PAID" && (
          <>
            <div className="border-t border-border my-4" />
            <div className="bg-muted/50 rounded-[8px] p-3 text-xs space-y-1">
              <p className="font-semibold text-foreground">Payment Details</p>
              <p className="text-muted-fg">
                Contact us if you have any payment inquiries.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
