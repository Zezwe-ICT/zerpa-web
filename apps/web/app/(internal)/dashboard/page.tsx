/**
 * @file app/(internal)/dashboard/page.tsx
 * @description ZERPA internal admin dashboard. KPI cards, then live charts (Bklit UI)
 * for cash flow, money owed, quotes and pipeline, plus to-dos and recent activity.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { DashboardGreeting } from "@/components/modules/dashboard/dashboard-greeting";
import { DashboardStats } from "@/components/modules/dashboard/dashboard-stats";
import { GetStarted } from "@/components/modules/dashboard/get-started";
import { SetupBanner } from "@/components/modules/setup/setup-banner";
import { DashboardOverviewCards } from "@/components/modules/dashboard/dashboard-overview";

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle={<DashboardGreeting />}
      />

      <GetStarted />
      <SetupBanner />

      {/* KPI Cards */}
      <DashboardStats />

      <DashboardOverviewCards />
    </PageContainer>
  );
}
