"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getAutomotivePortalSummary } from "@/lib/api/verticals";
import { toast } from "sonner";

export default function AutomotivePortalDashboard() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getAutomotivePortalSummary>> | null>(null);
  useEffect(() => {
    getAutomotivePortalSummary()
      .then(setSummary)
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader title="Workshop portal" subtitle="Job status and invoices" />
      <div className="rounded-[12px] border border-border p-5 space-y-2">
        <p className="text-sm text-muted-fg">{summary?.openJobs ?? "—"} open job(s)</p>
        <p className="text-sm text-muted-fg">{summary?.awaitingApproval ?? "—"} awaiting approval</p>
        <Button className="mt-4" asChild>
          <Link href="/automotive/job-cards">View job cards</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
