import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { Calendar, Users, TrendingUp, CheckCircle } from "lucide-react";

export default function SpaDashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        subtitle="Spa & Wellness Management"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Bookings This Week" value="18" icon={Calendar} iconColor="blue" />
        <StatsCard label="Available Therapists" value="6" icon={Users} iconColor="green" />
        <StatsCard label="Revenue This Month" value="R18,900" icon={TrendingUp} iconColor="violet" />
        <StatsCard label="Completions" value="94%" icon={CheckCircle} iconColor="amber" />
      </div>

      <div className="rounded-[12px] border border-border bg-background p-6">
        <h2 className="section-title">Booking Calendar</h2>
        <div className="h-96 flex items-center justify-center text-muted-fg mt-4">
          Calendar coming soon
        </div>
      </div>
    </PageContainer>
  );
}
