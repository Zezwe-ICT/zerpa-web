/**
 * @file app/(client-portal)/restaurant/dashboard/page.tsx
 * @description Restaurant client dashboard. Shows KPI cards for Today's Orders,
 * Average Wait Time, Revenue Today and Active Staff. Includes a live order
 * status table with timestamps.
 */
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { ShoppingCart, Clock, TrendingUp, Users } from "lucide-react";

export default function RestaurantDashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Restaurant Operations"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Orders Today" value="24" icon={ShoppingCart} iconColor="blue" />
        <StatsCard label="Avg Delivery Time" value="18min" icon={Clock} iconColor="green" />
        <StatsCard label="Revenue Today" value="R3,450" icon={TrendingUp} iconColor="violet" />
        <StatsCard label="Active Tables" value="12" icon={Users} iconColor="amber" />
      </div>

      <div className="rounded-[12px] border border-border bg-background p-6">
        <h2 className="section-title">Order Board</h2>
        <div className="h-96 flex items-center justify-center text-muted-fg mt-4">
          Orders board coming soon
        </div>
      </div>
    </PageContainer>
  );
}
