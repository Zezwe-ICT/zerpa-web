/**
 * @file app/(internal)/dashboard/page.tsx
 * @description ZERPA internal admin dashboard. Shows 4 KPI cards (Active Clients,
 * MRR, Overdue Invoices, Open Leads) and placeholder sections for charts and
 * activity feeds. Greeting is personalised via DashboardGreeting component.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardGreeting } from "@/components/modules/dashboard/dashboard-greeting";
import { DashboardStats } from "@/components/modules/dashboard/dashboard-stats";

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle={<DashboardGreeting />}
      />

      {/* KPI Cards */}
      <DashboardStats />

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
