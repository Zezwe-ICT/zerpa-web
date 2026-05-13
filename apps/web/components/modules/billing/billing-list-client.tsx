/**
 * @file components/modules/billing/billing-list-client.tsx
 * @description Internal billing invoices list table with status filter tabs.
 * Displays all invoices with amount, status, due date and quick-action buttons.
 * Manages client state (filter, optimistic send) over server-fetched data.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate, daysUntilDue, isOverdue } from "@/lib/utils/dates";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle2, Send, MoreHorizontal, FileText } from "lucide-react";
import type { Invoice } from "@zerpa/shared-types";
import { SendInvoiceModal } from "@/components/modules/billing/send-invoice-modal";

interface BillingListClientProps {
  initialInvoices: Invoice[];
}

export function BillingListClient({ initialInvoices }: BillingListClientProps) {
  const router = useRouter();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sendModalOpen, setSendModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filter invoices by status
  const filteredInvoices =
    selectedStatus === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === selectedStatus);

  // Count by status
  const statusCounts = {
    all: invoices.length,
    DRAFT: invoices.filter((i) => i.status === "DRAFT").length,
    SENT: invoices.filter((i) => i.status === "SENT").length,
    PAID: invoices.filter((i) => i.status === "PAID").length,
    OVERDUE: invoices.filter((i) => i.status === "OVERDUE").length,
  };

  if (invoices.length === 0) {
    return (
      <EmptyState
        icon={<FileText size={24} className="text-muted-fg" />}
        title="No invoices yet"
        description="Create your first invoice to get started"
        action={{
          label: "Create Invoice",
          onClick: () => router.push("/billing/create"),
        }}
      />
    );
  }

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex items-center gap-4 border-b border-border pb-0 mb-6">
        {[
          { key: "all", label: "All", count: statusCounts.all },
          { key: "DRAFT", label: "Draft", count: statusCounts.DRAFT },
          { key: "SENT", label: "Sent", count: statusCounts.SENT },
          { key: "PAID", label: "Paid", count: statusCounts.PAID },
          {
            key: "OVERDUE",
            label: "Overdue",
            count: statusCounts.OVERDUE,
            badge: "danger",
          },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedStatus(tab.key)}
            className={cn(
              "pb-3 px-4 text-sm font-medium transition-all border-b-2 border-transparent -mb-px",
              selectedStatus === tab.key
                ? "text-primary border-b-2 border-primary"
                : "text-muted-fg hover:text-foreground"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "ml-2 inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs",
                tab.badge === "danger"
                  ? "bg-danger-bg text-danger"
                  : "bg-surface text-muted-fg"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-[12px] border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="text-left px-6 py-3 font-semibold text-xs uppercase tracking-wide text-muted-fg">
                  Invoice #
                </th>
                <th className="text-left px-6 py-3 font-semibold text-xs uppercase tracking-wide text-muted-fg">
                  Client
                </th>
                <th className="text-left px-6 py-3 font-semibold text-xs uppercase tracking-wide text-muted-fg">
                  Type
                </th>
                <th className="text-right px-6 py-3 font-semibold text-xs uppercase tracking-wide text-muted-fg">
                  Amount
                </th>
                <th className="text-left px-6 py-3 font-semibold text-xs uppercase tracking-wide text-muted-fg">
                  Due Date
                </th>
                <th className="text-left px-6 py-3 font-semibold text-xs uppercase tracking-wide text-muted-fg">
                  Status
                </th>
                <th className="text-left px-6 py-3 font-semibold text-xs uppercase tracking-wide text-muted-fg">
                  Sent
                </th>
                <th className="text-center px-6 py-3 font-semibold text-xs uppercase tracking-wide text-muted-fg">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice, idx) => (
                <tr
                  key={invoice.id}
                  className={cn(
                    "border-b border-border hover:bg-surface transition-colors",
                    idx === filteredInvoices.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {invoice.invoiceNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-foreground">{invoice.tenantName}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-muted-fg">
                      {invoice.type === "SETUP"
                        ? "Setup Fee"
                        : invoice.type === "SUBSCRIPTION"
                          ? "Subscription"
                          : "Ad-hoc"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono font-semibold text-foreground">
                      {formatCurrency(invoice.total || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "text-sm",
                        isOverdue(invoice.dueDate) && "text-danger font-semibold"
                      )}
                    >
                      {formatDate(invoice.dueDate, "dd MMM yyyy")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-6 py-4">
                    {invoice.sentAt ? (
                      <span className="text-xs text-muted-fg">
                        {formatDate(invoice.sentAt, "dd MMM")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-fg">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      {(invoice.status === "DRAFT" || invoice.status === "SENT") && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setSendModalOpen(true);
                          }}
                          title="Send invoice"
                        >
                          <Send size={14} />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Invoice Modal */}
      {selectedInvoice && (
        <SendInvoiceModal
          invoice={selectedInvoice}
          open={sendModalOpen}
          onOpenChange={setSendModalOpen}
          onSent={() => {
            // Reload invoices
            setSelectedInvoice(null);
          }}
        />
      )}
    </>
  );
}
