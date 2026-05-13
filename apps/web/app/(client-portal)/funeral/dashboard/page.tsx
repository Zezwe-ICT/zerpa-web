/**
 * @file app/(client-portal)/funeral/dashboard/page.tsx
 * @description Funeral home client dashboard. Shows KPI cards for Active Cases,
 * Completed Cases, Pending Arrangements and Notifications. Displays a recent
 * activity table with case status and scheduled dates.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { Building2, Calendar, Clock, AlertCircle } from "lucide-react";

export default function FuneralDashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Funeral Parlour Operations"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          label="Active Cases"
          value="8"
          sub="Open cases"
          icon={Building2}
          iconColor="blue"
        />
        <StatsCard
          label="Cases This Month"
          value="12"
          sub="2 more than last month"
          icon={Calendar}
          iconColor="violet"
        />
        <StatsCard
          label="Funerals This Week"
          value="3"
          sub="Next: Saturday 2pm"
          icon={Clock}
          iconColor="amber"
        />
        <StatsCard
          label="Outstanding Payments"
          value="R12,500"
          sub="2 invoices overdue"
          icon={AlertCircle}
          iconColor="red"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="rounded-[12px] border border-border bg-background p-6">
            <h2 className="section-title mb-4">Today's Schedule</h2>
            <div className="h-64 flex items-center justify-center text-muted-fg">
              Schedule coming soon
            </div>
          </div>

          <div className="rounded-[12px] border border-border bg-background p-6">
            <h2 className="section-title mb-4">Recent Cases</h2>
            <div className="h-64 flex items-center justify-center text-muted-fg">
              Cases list coming soon
            </div>
          </div>
        </div>

        <div className="rounded-[12px] border border-border bg-background p-6">
          <h2 className="section-title mb-4">Quick Actions</h2>
          <div className="h-96 flex items-center justify-center text-muted-fg">
            Actions coming soon
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
