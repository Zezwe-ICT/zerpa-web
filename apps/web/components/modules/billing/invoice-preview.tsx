/**
 * @file components/modules/billing/invoice-preview.tsx
 * @description Print-ready ZERPA-branded invoice preview. Renders the full
 * invoice layout (header, branding, line items table, totals, notes, footer)
 * with conditional PAID / OVERDUE / DRAFT watermarks.
 */
"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import type { Invoice } from "@zerpa/shared-types";

interface InvoicePreviewProps {
  invoice: Invoice;
  className?: string;
}

function IssuerBlock({ invoice }: { invoice: Invoice }) {
  const issuer = invoice.issuer;
  const name = issuer?.name?.trim() || "Your company";
  const lines = [issuer?.address, issuer?.email, issuer?.phone, issuer?.vatNumber ? `VAT ${issuer.vatNumber}` : ""]
    .map((line) => line?.trim())
    .filter(Boolean) as string[];
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {issuer?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={issuer.logoUrl} alt="" className="h-10 w-10 rounded-[6px] object-contain" />
        ) : (
          <div className="w-10 h-10 rounded-[6px] bg-primary text-primary-fg flex items-center justify-center font-bold text-lg">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <p className="font-display text-lg font-normal">{name}</p>
      </div>
      {lines.length > 0 ? (
        <div className="text-xs text-muted-fg space-y-0.5 mt-3">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-fg mt-3">Add your company details in Billing settings.</p>
      )}
    </div>
  );
}

function BankBlock({ invoice }: { invoice: Invoice }) {
  const bank = invoice.issuer;
  const hasBank = Boolean(bank?.bankName || bank?.accountNumber);
  return (
    <div className="space-y-1 text-foreground">
      {hasBank ? (
        <>
          {bank?.bankName ? (
            <p>
              <span className="font-semibold">Bank:</span> {bank.bankName}
            </p>
          ) : null}
          {bank?.accountHolder ? (
            <p>
              <span className="font-semibold">Account name:</span> {bank.accountHolder}
            </p>
          ) : null}
          {bank?.accountNumber ? (
            <p>
              <span className="font-semibold">Account:</span> {bank.accountNumber}
            </p>
          ) : null}
          {bank?.branchCode ? (
            <p>
              <span className="font-semibold">Branch:</span> {bank.branchCode}
            </p>
          ) : null}
        </>
      ) : (
        <p className="text-muted-fg">Bank details have not been added yet.</p>
      )}
      <p>
        <span className="font-semibold">Reference:</span>{" "}
        <span className="font-mono">{invoice.invoiceNumber}</span>
      </p>
    </div>
  );
}

function QueriesLine({ invoice }: { invoice: Invoice }) {
  const email = invoice.issuer?.email?.trim();
  const phone = invoice.issuer?.phone?.trim();
  if (!email && !phone) return null;
  return (
    <p className="mt-1">
      For queries, contact {[email, phone].filter(Boolean).join(" or ")}
    </p>
  );
}

export function InvoicePreview({ invoice, className }: InvoicePreviewProps) {
  const isPaid = invoice.status === "PAID";
  const isOverdue = invoice.status === "OVERDUE";
  const isDraft = invoice.status === "DRAFT";

  return (
    <div className={cn("relative bg-white rounded-[12px] shadow-lg overflow-hidden", className)}>
      {/* Watermark */}
      {isPaid && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10 rotate-[-35deg]">
          <span className="text-green-600 text-9xl font-black tracking-widest select-none">
            PAID
          </span>
        </div>
      )}
      {isOverdue && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10 rotate-[-35deg]">
          <span className="text-red-600 text-9xl font-black tracking-widest select-none">
            OVERDUE
          </span>
        </div>
      )}
      {isDraft && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-10 rotate-[-35deg]">
          <span className="text-gray-600 text-9xl font-black tracking-widest select-none">
            DRAFT
          </span>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10 p-12 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-8 border-b-2 border-border">
          <IssuerBlock invoice={invoice} />

          <div className="text-right space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg">
              Invoice
            </p>
            <p className="font-mono text-2xl font-semibold text-foreground">
              {invoice.invoiceNumber}
            </p>
            <div className="text-xs text-muted-fg space-y-0.5 mt-4">
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {formatDate(invoice.createdAt, "dd MMM yyyy")}
              </p>
              <p>
                <span className="font-semibold">Due:</span>{" "}
                {formatDate(invoice.dueDate, "dd MMM yyyy")}
              </p>
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-fg">
            Bill To
          </p>
          <div className="space-y-0.5">
            <p className="font-semibold text-foreground">{invoice.tenantName}</p>
            {invoice.contactEmail ? <p className="text-xs text-muted-fg">{invoice.contactEmail}</p> : null}
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border">
                <th className="text-left py-2 text-xs font-semibold uppercase tracking-wide text-muted-fg">
                  Description
                </th>
                <th className="text-right py-2 text-xs font-semibold uppercase tracking-wide text-muted-fg w-16">
                  Qty
                </th>
                <th className="text-right py-2 text-xs font-semibold uppercase tracking-wide text-muted-fg w-24">
                  Unit Price
                </th>
                <th className="text-right py-2 text-xs font-semibold uppercase tracking-wide text-muted-fg w-24">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-surface transition-colors">
                  <td className="py-3 text-foreground">{item.description}</td>
                  <td className="py-3 text-right font-mono text-muted-fg">{item.quantity}</td>
                  <td className="py-3 text-right font-mono text-muted-fg">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-3 text-right font-mono font-semibold text-foreground">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-2 border-t-2 border-border pt-6 ml-auto w-64">
          <div className="flex justify-between text-sm">
            <span className="text-muted-fg">Subtotal:</span>
            <span className="font-mono font-semibold">{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-fg">VAT (15%):</span>
            <span className="font-mono text-muted-fg">{formatCurrency(invoice.taxAmount)}</span>
          </div>
          <div className="flex justify-between text-base border-t border-border pt-2">
            <span className="font-semibold">Total:</span>
            <span className="font-mono text-xl font-semibold">
              {formatCurrency(invoice.total || 0)}
            </span>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-2 text-xs pt-6 border-t-2 border-border">
          <p className="font-semibold uppercase tracking-wide text-muted-fg">Payment Details</p>
          <BankBlock invoice={invoice} />
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="text-xs text-muted-fg border-t-2 border-border pt-6">
            <p className="font-semibold mb-1">Notes:</p>
            <p>{invoice.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-fg border-t-2 border-border pt-6">
          <p>Thank you for your business.</p>
          <QueriesLine invoice={invoice} />
        </div>
      </div>
    </div>
  );
}
