"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { StatsCard } from "@/components/ui/stats-card";
import { getLeads } from "@/lib/data/crm";
import { getInvoices } from "@/lib/data/invoices";
import { getNestSales } from "@/lib/data/nest-sales";
import { isOverdue } from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/currency";
import { Building2, TrendingUp, AlertCircle, Users } from "lucide-react";

interface DashboardStats {
  activeClients: number;
  mrr: number;
  overdueCount: number;
  overdueAmount: number;
  openLeads: number;
  leadsByVertical: Record<string, number>;
}

export function DashboardStats() {
  const { company } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (!company?.id) return;

    Promise.all([
      getLeads(undefined, company.id),
      getInvoices(company.id),
      getNestSales(undefined, company.id),
    ]).then(([leads, invoices, sales]) => {
      const activeClients = sales.filter((s) => s.status === "ACTIVE").length;
      const mrr = sales
        .filter((s) => s.status === "ACTIVE")
        .reduce((sum, s) => sum + (s.monthlyAmount ?? 0), 0);

      const overdueInvoices = invoices.filter(
        (inv) => inv.status !== "PAID" && inv.status !== "VOID" && isOverdue(inv.dueDate)
      );
      const overdueAmount = overdueInvoices.reduce(
        (sum, inv) => sum + (inv.total ?? 0),
        0
      );

      const openLeads = leads.filter(
        (l) => l.status !== "CLOSED_WON" && l.status !== "CLOSED_LOST"
      );

      const leadsByVertical = openLeads.reduce<Record<string, number>>((acc, l) => {
        const v = (l.vertical ?? "OTHER").toLowerCase();
        acc[v] = (acc[v] ?? 0) + 1;
        return acc;
      }, {});

      setStats({
        activeClients,
        mrr,
        overdueCount: overdueInvoices.length,
        overdueAmount,
        openLeads: openLeads.length,
        leadsByVertical,
      });
    }).catch(() => {
      // keep stats null — cards will show fallback
    });
  }, [company?.id]);

  const topVerticals = stats
    ? Object.entries(stats.leadsByVertical)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([v, n]) => `${n} ${v}`)
        .join(" · ")
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatsCard
        label="Active Clients"
        value={stats ? String(stats.activeClients) : "—"}
        sub={stats ? `${stats.activeClients} on active subscriptions` : "Loading..."}
        icon={Building2}
        iconColor="blue"
      />
      <StatsCard
        label="Monthly Recurring Revenue"
        value={stats ? formatCurrency(stats.mrr) : "—"}
        sub={stats ? "From active subscriptions" : "Loading..."}
        icon={TrendingUp}
        iconColor="green"
        trend={stats && stats.mrr > 0 ? { value: formatCurrency(stats.mrr), positive: true } : undefined}
      />
      <StatsCard
        label="Overdue Invoices"
        value={stats ? String(stats.overdueCount) : "—"}
        sub={
          stats
            ? stats.overdueAmount > 0
              ? `${formatCurrency(stats.overdueAmount)} outstanding`
              : "None outstanding"
            : "Loading..."
        }
        icon={AlertCircle}
        iconColor="red"
        trend={stats && stats.overdueCount > 0 ? { value: `${stats.overdueCount} overdue`, positive: false } : undefined}
      />
      <StatsCard
        label="Open Leads"
        value={stats ? String(stats.openLeads) : "—"}
        sub={stats ? (topVerticals || "No open leads") : "Loading..."}
        icon={Users}
        iconColor="violet"
        trend={stats && stats.openLeads > 0 ? { value: `${stats.openLeads} active`, positive: true } : undefined}
      />
    </div>
  );
}
