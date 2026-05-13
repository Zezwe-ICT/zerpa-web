import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { DashboardGreeting } from "@/components/modules/dashboard/dashboard-greeting";
import { Building2, TrendingUp, AlertCircle, Users } from "lucide-react";

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle={<DashboardGreeting />}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Active Clients"
          value="14"
          sub="+2 this month"
          icon={Building2}
          iconColor="blue"
          trend={{ value: "8%", positive: true }}
        />
        <StatsCard
          label="Monthly Recurring Revenue"
          value="R21,000"
          sub="↑ 12% vs last month"
          icon={TrendingUp}
          iconColor="green"
          trend={{ value: "12%", positive: true }}
        />
        <StatsCard
          label="Overdue Invoices"
          value="4"
          sub="R8,590 outstanding"
          icon={AlertCircle}
          iconColor="red"
          trend={{ value: "1 new", positive: false }}
        />
        <StatsCard
          label="Open Leads"
          value="23"
          sub="8 funeral · 4 automotive"
          icon={Users}
          iconColor="violet"
          trend={{ value: "5 this week", positive: true }}
        />
      </div>

      {/* Main Grid - Coming Soon */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="rounded-[12px] border border-border bg-background p-6">
            <h2 className="section-title mb-4">Leads by Vertical</h2>
            <div className="h-64 flex items-center justify-center text-muted-fg">
              Chart coming soon
            </div>
          </div>

          <div className="rounded-[12px] border border-border bg-background p-6">
            <h2 className="section-title mb-4">Upcoming Actions</h2>
            <div className="h-64 flex items-center justify-center text-muted-fg">
              Actions feed coming soon
            </div>
          </div>
        </div>

        <div className="rounded-[12px] border border-border bg-background p-6">
          <h2 className="section-title mb-4">Recent Activity</h2>
          <div className="h-96 flex items-center justify-center text-muted-fg">
            Activity feed coming soon
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
