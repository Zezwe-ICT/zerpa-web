"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Search, WifiOff } from "lucide-react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import {
  createCreditNote,
  dunningQueueAction,
  initiateCollect,
  listDunningQueue,
  simulatePayment,
  type DunningQueueItem,
} from "@/lib/api/telecom";
import { formatCurrency } from "@/lib/utils/currency";
import { toast } from "sonner";

function daysOverdue(invoice: { dueDate?: string }): number | null {
  if (!invoice.dueDate) return null;
  const due = new Date(invoice.dueDate);
  const now = new Date();
  const diff = Math.floor((now.getTime() - due.getTime()) / 86400000);
  return diff > 0 ? diff : null;
}

export default function DunningPage() {
  const [items, setItems] = useState<DunningQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [creditAmounts, setCreditAmounts] = useState<Record<string, string>>({});

  async function reload() {
    try {
      const res = await listDunningQueue();
      setItems(res.items || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load dunning");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    return items.filter((row) => {
      if (filterStatus && row.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const addr = (row.serviceAddress || row.subscriberId || "").toLowerCase();
        if (!addr.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, filterStatus]);

  const totalOwed = items.reduce((sum, row) => {
    return sum + row.unpaidInvoices.reduce((s, inv) => s + (inv.total || 0), 0);
  }, 0);
  const suspended = items.filter((r) => r.status === "suspended").length;
  const active = items.filter((r) => r.status !== "suspended").length;
  const statuses = useMemo(() => [...new Set(items.map((r) => r.status))], [items]);

  return (
    <PageContainer>
      <PageHeader
        title="Dunning"
        subtitle="Arrears queue — suspend / collect / reactivate"
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatsCard title="Total owed" value={formatCurrency(totalOwed)} icon={AlertTriangle} />
        <StatsCard title="Suspended" value={String(suspended)} icon={WifiOff} />
        <StatsCard title="Active with arrears" value={String(active)} icon={CheckCircle2} />
      </div>

      {/* Filters */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
            <Input placeholder="Search by address…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-sm pl-8" />
          </div>
          <select
            className="border border-border rounded-[8px] px-3 py-1 text-sm bg-background h-8"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || filterStatus) && (
            <Button size="sm" variant="outline" onClick={() => { setSearch(""); setFilterStatus(""); }}>Clear</Button>
          )}
        </div>
      )}

      {loading && <p className="text-sm text-muted-fg text-center py-8">Loading arrears queue…</p>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-fg">
          <CheckCircle2 size={32} className="mx-auto mb-3 opacity-40 text-success" />
          <p className="font-medium">No arrears</p>
          <p className="text-sm mt-1">All subscribers are up to date.</p>
        </div>
      )}

      <div className="space-y-4">
        {filtered.map((row) => {
          const rowOwed = row.unpaidInvoices.reduce((s, inv) => s + (inv.total || 0), 0);
          return (
            <div key={row.subscriberId} className={`rounded-[12px] border p-5 space-y-3 ${row.status === "suspended" ? "border-danger/40 bg-danger/5" : "border-border"}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{row.serviceAddress || row.subscriberId}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-fg">
                    <span>RICA: {row.ricaStatus}</span>
                    <span>·</span>
                    <span className="font-semibold text-foreground">{row.unpaidInvoices.length} unpaid invoice{row.unpaidInvoices.length !== 1 ? "s" : ""}</span>
                    <span>·</span>
                    <span className="font-semibold text-danger">{formatCurrency(rowOwed)} owed</span>
                  </div>
                </div>
                <StatusBadge status={row.status.toUpperCase()} />
              </div>

              {/* Unpaid invoices */}
              <div className="rounded-[8px] border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-surface text-xs text-muted-fg">
                    <tr>
                      <th className="text-left px-3 py-2">Invoice</th>
                      <th className="text-left px-3 py-2">Amount</th>
                      <th className="text-left px-3 py-2">Overdue</th>
                      <th className="text-left px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {row.unpaidInvoices.map((inv) => {
                      const overdue = daysOverdue(inv as any);
                      return (
                        <tr key={inv.id} className="border-t border-border">
                          <td className="px-3 py-2 font-mono text-xs">{inv.invoiceNumber}</td>
                          <td className="px-3 py-2 font-semibold">{formatCurrency(inv.total || 0)}</td>
                          <td className="px-3 py-2">
                            {overdue !== null ? (
                              <span className={`text-xs font-medium ${overdue > 30 ? "text-danger" : overdue > 14 ? "text-warning" : "text-muted-fg"}`}>
                                {overdue}d overdue
                              </span>
                            ) : (
                              <span className="text-xs text-muted-fg">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                try {
                                  const pay = await initiateCollect(inv.id, "payfast");
                                  try {
                                    await simulatePayment(pay.paymentRef);
                                    toast.success(`Paid via ${pay.paymentRef} (dev simulation)`);
                                  } catch {
                                    toast.success(`Collection ${pay.paymentRef} started; awaiting PayFast`);
                                  }
                                  await reload();
                                } catch (e) {
                                  toast.error(e instanceof Error ? e.message : "Collect failed");
                                }
                              }}
                            >
                              Collect (PayFast)
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <p className="w-full text-xs text-muted-fg">Suspending does not cut a live line immediately.</p>
                {row.status !== "suspended" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-danger/30 text-danger hover:bg-danger/10"
                    onClick={async () => {
                      try {
                        await dunningQueueAction(row.subscriberId, "suspend");
                        toast.success("Suspended");
                        await reload();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Suspend failed");
                      }
                    }}
                  >
                    Suspend subscriber
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await dunningQueueAction(row.subscriberId, "reactivate");
                        toast.success("Reactivated");
                        await reload();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Reactivate blocked — collect first");
                      }
                    }}
                  >
                    Reactivate
                  </Button>
                )}

                {/* Flexible credit note */}
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    className="h-8 w-24 text-sm"
                    placeholder="R amount"
                    value={creditAmounts[row.subscriberId] ?? ""}
                    onChange={(e) => setCreditAmounts((m) => ({ ...m, [row.subscriberId]: e.target.value }))}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!creditAmounts[row.subscriberId]}
                    onClick={async () => {
                      const amount = parseFloat(creditAmounts[row.subscriberId] || "0");
                      if (!amount || amount <= 0) return toast.error("Enter a valid amount");
                      try {
                        await createCreditNote({
                          accountId: row.accountId,
                          amount,
                          notes: `Manual credit issued from dunning queue`,
                        });
                        toast.success(`Credit note for ${formatCurrency(amount)} issued`);
                        setCreditAmounts((m) => ({ ...m, [row.subscriberId]: "" }));
                        await reload();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Credit failed");
                      }
                    }}
                  >
                    Issue credit note
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
