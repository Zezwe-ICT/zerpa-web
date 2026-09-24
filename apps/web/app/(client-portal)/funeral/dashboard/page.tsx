"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatsCard } from "@/components/ui/stats-card";
import { Button } from "@/components/ui/button";
import { getFuneralPortalSummary } from "@/lib/api/verticals";
import { Building2, Calendar, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function FuneralDashboardPage() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getFuneralPortalSummary>> | null>(null);
  useEffect(() => {
    getFuneralPortalSummary()
      .then(setSummary)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <PageContainer>
      <PageHeader title="Family portal" subtitle="Cases, schedule, and billing" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard label="Active Cases" value={String(summary?.activeCases ?? "—")} sub="Open cases" icon={Building2} iconColor="blue" />
        <StatsCard label="This week" value={String(summary?.funeralsThisWeek ?? "—")} sub="Scheduled services" icon={Calendar} iconColor="violet" />
        <StatsCard label="Missing docs" value={String(summary?.missingDocsCases ?? "—")} sub="Cases with gaps" icon={Clock} iconColor="amber" />
        <StatsCard
          label="Invoices"
          value={String(summary?.invoices?.length ?? "—")}
          sub="Recent"
          icon={AlertCircle}
          iconColor="red"
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-[12px] border border-border p-6">
          <h2 className="section-title mb-4">Upcoming schedule</h2>
          <ul className="space-y-2 text-sm">
            {(summary?.schedule || []).slice(0, 5).map((c) => (
              <li key={c.id}>
                {c.deceasedName} · {c.serviceDate || "TBD"}
              </li>
            ))}
            {!summary?.schedule?.length && <li className="text-muted-fg">No scheduled services.</li>}
          </ul>
          <Button className="mt-4" size="sm" asChild>
            <Link href="/funeral/schedule">Full schedule</Link>
          </Button>
        </div>
        <div className="rounded-[12px] border border-border p-6">
          <h2 className="section-title mb-4">Recent cases</h2>
          <ul className="space-y-2 text-sm">
            {(summary?.cases || []).slice(0, 5).map((c) => (
              <li key={c.id}>
                {c.number} · {c.deceasedName} · {c.status}
              </li>
            ))}
            {!summary?.cases?.length && <li className="text-muted-fg">No cases yet.</li>}
          </ul>
          <Button className="mt-4" size="sm" asChild>
            <Link href="/funeral/cases">View cases</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
