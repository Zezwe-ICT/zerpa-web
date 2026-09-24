"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { StatsCard } from "@/components/ui/stats-card";
import { getLeads } from "@/lib/data/crm";
import { listAgreements, listClientOnboardings } from "@/lib/api/msp";
import { apiRequest } from "@/lib/api/client";
import { isOverdue } from "@/lib/utils/dates";
import { formatCurrency } from "@/lib/utils/currency";
import { Building2, TrendingUp, AlertCircle, Users } from "lucide-react";

interface DashboardStats {
  activeClients: number;
  mrr: number;
  overdueCount: number;
  overdueAmount: number;
  openLeads: number;
  openOnboardings: number;
}

export function DashboardStats() {
  const { company, isLoading, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !company?.id) return;

    const vertical = (company.vertical || "").toUpperCase();

    Promise.all([
      apiRequest<Array<{ status?: string; dueDate?: string; total?: number }>>("/billing/invoices").catch(() => []),
      listAgreements().catch(() => []),
      apiRequest<Array<{ id: string }>>("/crm/accounts").catch(() => []),
      getLeads(undefined, company.id).catch(() => []),
      vertical === "MSP"
        ? listClientOnboardings().catch(() => [])
        : Promise.resolve([]),
    ]).then(([invoices, agreements, accounts, leads, onboardings]) => {
      const mrr = agreements
        .filter((a: { status?: string }) => (a.status || "active") === "active")
        .reduce((sum: number, a: { monthlyFee?: number }) => sum + Number(a.monthlyFee || 0), 0);

      const overdueInvoices = invoices.filter(
        (inv) => inv.status !== "PAID" && inv.status !== "VOID" && isOverdue(inv.dueDate)
      );
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.total ?? 0), 0);

      const openLeads = leads.filter(
        (l) => l.status !== "CLOSED_WON" && l.status !== "CLOSED_LOST"
      );

      const openOnboardings = onboardings.filter(
        (o) => o.status !== "completed" && o.status !== "cancelled"
      ).length;

      setStats({
        activeClients: accounts.length,
        mrr,
        overdueCount: overdueInvoices.length,
        overdueAmount,
        openLeads: openLeads.length,
        openOnboardings,
      });
    }).catch(() => {
      // keep stats null — cards will show fallback
    });
  }, [company?.id, company?.vertical, isAuthenticated, isLoading]);

  const isMsp = (company?.vertical || "").toUpperCase() === "MSP";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatsCard
        label="Active Clients"
        value={stats ? String(stats.activeClients) : "—"}
        sub={stats ? `${stats.activeClients} accounts in CRM` : "Loading..."}
        icon={Building2}
        iconColor="blue"
      />
      <StatsCard
        label="Monthly Recurring Revenue"
        value={stats ? formatCurrency(stats.mrr) : "—"}
        sub={stats ? (isMsp ? "From active agreements" : "From recurring agreements") : "Loading..."}
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
        label={isMsp ? "Open Workstreams" : "Open Leads"}
        value={stats ? String(isMsp ? stats.openOnboardings + stats.openLeads : stats.openLeads) : "—"}
        sub={
          stats
            ? isMsp
              ? `${stats.openOnboardings} onboardings · ${stats.openLeads} leads`
              : stats.openLeads > 0
                ? `${stats.openLeads} in pipeline`
                : "No open leads"
            : "Loading..."
        }
        icon={Users}
        iconColor="violet"
      />
    </div>
  );
}
