/**
 * @file components/modules/billing/quotes-list-client.tsx
 * @description Quotes list — summary cards, status filter tabs, search and a
 * table with per-row actions (edit, convert to invoice, mark accepted/declined,
 * duplicate, void, delete).
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, FileText, Send, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/ui/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { ActionMenu } from "./action-menu";
import { DocumentPreviewModal } from "./document-preview-modal";
import {
  getQuotes,
  updateQuoteStatus,
  deleteQuote,
  duplicateQuote,
  convertQuoteToInvoice,
} from "@/lib/data/quotes";
import type { Quote, QuoteStatus } from "@zerpa/shared-types";

const TABS: { key: QuoteStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "sent", label: "Sent" },
  { key: "accepted", label: "Accepted" },
  { key: "declined", label: "Declined" },
  { key: "expired", label: "Expired" },
  { key: "converted", label: "Converted" },
];

export function QuotesListClient() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<QuoteStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [previewDoc, setPreviewDoc] = useState<Quote | null>(null);

  function reload() {
    setLoading(true);
    getQuotes()
      .then(setQuotes)
      .catch(() => setQuotes([]))
      .finally(() => setLoading(false));
  }

  useEffect(reload, []);

  const filtered = quotes.filter((q) => {
    if (tab !== "all" && q.status !== tab) return false;
    if (
      search &&
      !q.quoteNumber.toLowerCase().includes(search.toLowerCase()) &&
      !q.customerName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const now = new Date();
  const thisMonthCount = quotes.filter((q) => {
    const d = new Date(q.issueDate);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const valueSent = quotes
    .filter((q) => q.status === "sent")
    .reduce((a, q) => a + q.total, 0);
  const acceptedCount = quotes.filter((q) => q.status === "accepted").length;
  const pendingCount = quotes.filter((q) => q.status === "sent").length;

  async function handleStatus(q: Quote, status: QuoteStatus) {
    try {
      await updateQuoteStatus(q.id, status);
      toast.success(`Quote marked ${status}`);
      reload();
    } catch {
      toast.error("Could not update quote");
    }
  }

  async function handleConvert(q: Quote) {
    try {
      const invoice = await convertQuoteToInvoice(q.id);
      toast.success(`Converted to ${invoice.invoiceNumber}`);
      router.push(`/billing/invoices/${invoice.id}`);
    } catch {
      toast.error("Conversion failed");
    }
  }

  async function handleDuplicate(q: Quote) {
    try {
      await duplicateQuote(q.id);
      toast.success("Quote duplicated");
      reload();
    } catch {
      toast.error("Could not duplicate");
    }
  }

  async function handleDelete(q: Quote) {
    try {
      await deleteQuote(q.id);
      toast.success("Quote deleted");
      reload();
    } catch {
      toast.error("Could not delete");
    }
  }

  return (
    <>
      <PageHeader
        title="Quotes"
        subtitle="Create and send formal quotations to customers"
        action={
          <Link href="/billing/quotes/new">
            <Button size="sm">
              <Plus size={14} className="mr-1.5" />
              New Quote
            </Button>
          </Link>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Quotes This Month"
          value={thisMonthCount}
          icon={FileText}
          iconColor="blue"
        />
        <StatsCard
          label="Value Sent"
          value={formatCurrency(valueSent)}
          icon={Send}
          iconColor="violet"
        />
        <StatsCard
          label="Accepted"
          value={acceptedCount}
          icon={CheckCircle2}
          iconColor="green"
        />
        <StatsCard
          label="Pending Response"
          value={pendingCount}
          icon={Clock}
          iconColor="amber"
        />
      </div>

      {/* Tabs + search */}
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
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quote # or customer…"
          className="w-64"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-muted-fg">Loading quotes…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[12px] border border-border bg-background p-12 text-center text-muted-fg">
          No quotes match your filters.
        </div>
      ) : (
        <div className="rounded-[12px] border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <Th>Quote No</Th>
                  <Th>Customer</Th>
                  <Th>Subject</Th>
                  <Th>Issue Date</Th>
                  <Th>Expiry</Th>
                  <Th className="text-right">Total</Th>
                  <Th>Status</Th>
                  <Th className="text-center">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr
                    key={q.id}
                    className="border-b border-border last:border-0 hover:bg-surface transition-colors cursor-pointer"
                    onClick={() => router.push(`/billing/quotes/${q.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-foreground">
                        {q.quoteNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{q.customerName}</td>
                    <td className="px-4 py-3 text-muted-fg truncate max-w-[200px]">
                      {q.subject ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-fg">
                      {formatDate(q.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-muted-fg">
                      {formatDate(q.expiryDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatCurrency(q.total)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={q.status} />
                    </td>
                    <td
                      className="px-4 py-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ActionMenu
                        items={[
                          {
                            label: "View / Edit",
                            onClick: () => router.push(`/billing/quotes/${q.id}`),
                          },
                          {
                            label: "Convert to Invoice",
                            onClick: () => handleConvert(q),
                            disabled:
                              q.status === "converted" || q.status === "void",
                          },
                          {
                            label: "Mark Accepted",
                            onClick: () => handleStatus(q, "accepted"),
                          },
                          {
                            label: "Mark Declined",
                            onClick: () => handleStatus(q, "declined"),
                          },
                          {
                            label: "Download PDF",
                            onClick: () => setPreviewDoc(q),
                          },
                          {
                            label: "Duplicate",
                            onClick: () => handleDuplicate(q),
                          },
                          {
                            label: "Void",
                            onClick: () => handleStatus(q, "void"),
                          },
                          {
                            label: "Delete",
                            onClick: () => handleDelete(q),
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
        kind="quote"
        quote={previewDoc ?? undefined}
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
