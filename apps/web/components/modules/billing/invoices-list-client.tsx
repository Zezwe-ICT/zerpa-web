/**
 * @file components/modules/billing/invoices-list-client.tsx
 * @description Invoices list — summary cards, status tabs, source filter, search
 * and a table with per-row actions. Reads from the in-memory billing invoice
 * store (getBillingInvoices) so converted quotes and automated invoices appear.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Receipt, AlertCircle, CheckCircle2, FileClock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate, isOverdue } from "@/lib/utils/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/ui/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionMenu } from "./action-menu";
import { DocumentPreviewModal } from "./document-preview-modal";
import {
  getBillingInvoices,
  updateBillingInvoiceStatus,
} from "@/lib/data/invoices";
import type { Invoice, InvoiceStatus, InvoiceSource } from "@zerpa/shared-types";

const TABS: { key: InvoiceStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "DRAFT", label: "Draft" },
  { key: "APPROVED", label: "Approved" },
  { key: "SENT", label: "Sent" },
  { key: "PAID", label: "Paid" },
  { key: "OVERDUE", label: "Overdue" },
  { key: "PARTIALLY_PAID", label: "Part-Paid" },
];

const SOURCE_LABELS: Record<InvoiceSource, string> = {
  manual: "Manual",
  converted_quote: "From Quote",
  automated: "Automated",
};

export function InvoicesListClient() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<InvoiceStatus | "all">("all");
  const [source, setSource] = useState<InvoiceSource | "all">("all");
  const [search, setSearch] = useState("");
  const [previewDoc, setPreviewDoc] = useState<Invoice | null>(null);

  function reload() {
    setLoading(true);
    getBillingInvoices()
      .then(setInvoices)
      .catch(() => setInvoices([]))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  const filtered = invoices.filter((inv) => {
    if (tab !== "all" && inv.status !== tab) return false;
    if (source !== "all" && (inv.source ?? "manual") !== source) return false;
    if (
      search &&
      !inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) &&
      !inv.tenantName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const outstanding = invoices
    .filter((i) => ["SENT", "OVERDUE", "PARTIALLY_PAID", "APPROVED"].includes(i.status))
    .reduce((a, i) => a + (i.balanceDue ?? i.total), 0);
  const overdueCount = invoices.filter((i) => i.status === "OVERDUE").length;
  const now = new Date();
  const paidThisMonth = invoices
    .filter((i) => {
      if (i.status !== "PAID" || !i.paidAt) return false;
      const d = new Date(i.paidAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((a, i) => a + i.total, 0);
  const draftCount = invoices.filter((i) => i.status === "DRAFT").length;

  async function handleStatus(inv: Invoice, status: InvoiceStatus) {
    try {
      await updateBillingInvoiceStatus(inv.id, status);
      toast.success(`Invoice marked ${status.toLowerCase()}`);
      reload();
    } catch {
      toast.error("Could not update invoice");
    }
  }

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Manual, converted and automated invoices for all customers"
        action={
          <div className="flex items-center gap-2">
            <Link href="/billing/settings">
              <Button variant="outline" size="sm" title="Billing settings">
                <Settings size={14} />
              </Button>
            </Link>
            <Link href="/billing/invoices/new">
              <Button size="sm">
                <Plus size={14} className="mr-1.5" />
                New Invoice
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Total Outstanding"
          value={formatCurrency(outstanding)}
          icon={Receipt}
          iconColor="blue"
        />
        <StatsCard
          label="Overdue"
          value={overdueCount}
          icon={AlertCircle}
          iconColor="red"
        />
        <StatsCard
          label="Paid This Month"
          value={formatCurrency(paidThisMonth)}
          icon={CheckCircle2}
          iconColor="green"
        />
        <StatsCard
          label="Draft Pending"
          value={draftCount}
          icon={FileClock}
          iconColor="amber"
        />
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "pb-2.5 px-3 text-sm font-medium transition-all border-b-2 border-transparent -mb-px",
                tab === t.key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-fg hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value as InvoiceSource | "all")}
            className="h-10 rounded-[8px] border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All sources</option>
            <option value="manual">Manual</option>
            <option value="converted_quote">From Quote</option>
            <option value="automated">Automated</option>
          </select>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice # or customer…"
            className="w-56"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-fg">Loading invoices…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-background p-12 text-center text-muted-fg">
          No invoices match your filters.
        </div>
      ) : (
        <div className="rounded-[12px] border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <Th>Invoice No</Th>
                  <Th>Customer</Th>
                  <Th>Source</Th>
                  <Th>Issue</Th>
                  <Th>Due</Th>
                  <Th className="text-right">Total</Th>
                  <Th className="text-right">Balance</Th>
                  <Th>Status</Th>
                  <Th className="text-center">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="border-b border-border last:border-0 hover:bg-surface transition-colors cursor-pointer"
                    onClick={() => router.push(`/billing/invoices/${inv.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-foreground">
                        {inv.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{inv.tenantName}</td>
                    <td className="px-4 py-3 text-xs text-muted-fg">
                      {SOURCE_LABELS[inv.source ?? "manual"]}
                    </td>
                    <td className="px-4 py-3 text-muted-fg">
                      {formatDate(inv.issuedDate)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "text-sm",
                          inv.status !== "PAID" &&
                            isOverdue(inv.dueDate) &&
                            "text-danger font-semibold"
                        )}
                      >
                        {formatDate(inv.dueDate)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-muted-fg">
                      {formatCurrency(inv.balanceDue ?? inv.total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td
                      className="px-4 py-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ActionMenu
                        items={[
                          {
                            label: "View / Edit",
                            onClick: () =>
                              router.push(`/billing/invoices/${inv.id}`),
                          },
                          {
                            label: "Approve",
                            onClick: () => handleStatus(inv, "APPROVED"),
                            disabled: inv.status !== "DRAFT",
                          },
                          {
                            label: "Mark Sent",
                            onClick: () => handleStatus(inv, "SENT"),
                          },
                          {
                            label: "Download PDF",
                            onClick: () => setPreviewDoc(inv),
                          },
                          {
                            label: "Void",
                            onClick: () => handleStatus(inv, "VOID"),
                            danger: true,
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DocumentPreviewModal
        open={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        kind="invoice"
        invoice={previewDoc ?? undefined}
      />
    </>
  );
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 font-semibold text-xs uppercase tracking-wide text-muted-fg",
        className
      )}
    >
      {children}
    </th>
  );
}
