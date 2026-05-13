/**
 * @file components/modules/billing/client-invoice-list.tsx
 * @description Client-portal invoice list table. Renders a filterable list of
 * invoices for a single tenant with status badges, amounts and view/download links.
 * Accepts `basePath` so the same component works across all four verticals.
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CurrencyDisplay } from "@/components/ui/currency-display";
import { formatDate } from "@/lib/utils/dates";
import { Download, Eye } from "lucide-react";
import Link from "next/link";
import type { Invoice } from "@zerpa/shared-types";

interface ClientInvoiceListProps {
  invoices: Invoice[];
  basePath: string; // /funeral/invoices, /automotive/invoices, etc.
}

export function ClientInvoiceList({
  invoices,
  basePath,
}: ClientInvoiceListProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  const statuses = ["DRAFT", "SENT", "PAID", "OVERDUE", "VOID"] as const;
  const filtered =
    selectedStatus === "all"
      ? invoices
      : invoices.filter((inv) => inv.status === selectedStatus);

  const statusCounts: Record<string, number> = {
    all: invoices.length,
    ...Object.fromEntries(
      statuses.map((status) => [
        status.toLowerCase(),
        invoices.filter((inv) => inv.status === status).length,
      ])
    ),
  };

  if (invoices.length === 0) {
    return (
      <div className="rounded-[12px] border border-border p-8 text-center">
        <p className="text-muted-fg">No invoices yet</p>
        <p className="text-xs text-muted-fg mt-1">
          Your invoices will appear here once issued.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-border pb-3 flex-wrap">
        {[
          { label: "All", value: "all" },
          { label: "Draft", value: "draft" },
          { label: "Sent", value: "sent" },
          { label: "Paid", value: "paid" },
          { label: "Overdue", value: "overdue" },
        ].map((tab) => {
          const statusKey = tab.value === "all" ? "all" : tab.value.toUpperCase();
          const count =
            statusCounts[
              statusKey === "all"
                ? "all"
                : statusKey.toLowerCase()
            ] || 0;

          return (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition -mb-3 ${
                selectedStatus === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-fg hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-2 inline-block text-xs bg-muted rounded-full px-2 py-0.5">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Invoice Table */}
      <div className="rounded-[12px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold">Invoice</th>
              <th className="px-4 py-3 text-left font-semibold">Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Due Date</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-fg">
                  No invoices with status "{selectedStatus}"
                </td>
              </tr>
            ) : (
              filtered.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-border hover:bg-muted/30 transition"
                >
                  <td className="px-4 py-3">
                    <p className="font-mono font-medium">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-fg">
                      {formatDate(invoice.createdAt, "dd MMM yyyy")}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono">
                    <CurrencyDisplay amount={invoice.total || 0} />
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatDate(invoice.dueDate, "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td className="px-4 py-3 text-right flex gap-2 justify-end">
                    <Link href={`${basePath}/${invoice.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye size={14} />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // In production, trigger PDF download
                        window.print();
                      }}
                    >
                      <Download size={14} />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
