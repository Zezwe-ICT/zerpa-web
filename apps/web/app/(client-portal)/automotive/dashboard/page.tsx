/**
 * @file app/(client-portal)/automotive/dashboard/page.tsx
 * @description Automotive client dashboard. Shows KPI cards for Open Job Cards,
 * Completed This Month, Revenue MTD and Parts in Stock. Includes activity feed
 * with recent vehicle service records.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { Wrench, CheckCircle2, TrendingUp, Package } from "lucide-react";

export default function AutomotiveDashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Automotive Workshop Operations"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Open Job Cards" value="6" icon={Wrench} iconColor="blue" />
        <StatsCard label="Completed This Week" value="12" icon={CheckCircle2} iconColor="green" />
        <StatsCard label="Parts Low in Stock" value="3" icon={Package} iconColor="red" />
        <StatsCard label="Revenue This Month" value="R45,200" icon={TrendingUp} iconColor="violet" />
      </div>

      <div className="rounded-[12px] border border-border bg-background p-6">
        <h2 className="section-title">Job Cards</h2>
        <div className="h-96 flex items-center justify-center text-muted-fg mt-4">
          Job cards list coming soon
        </div>
      </div>
    </PageContainer>
  );
}


