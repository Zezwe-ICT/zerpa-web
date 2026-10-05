"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getSpaPortalSummary } from "@/lib/api/verticals";
import { toast } from "sonner";

export default function SpaPortalDashboard() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getSpaPortalSummary>> | null>(null);
  useEffect(() => {
    getSpaPortalSummary()
      .then(setSummary)
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader title="Spa portal" subtitle="Your bookings and invoices" />
      <div className="rounded-[12px] border border-border p-5">
        <p className="text-sm text-muted-fg">{summary?.upcomingCount ?? "—"} upcoming booking(s)</p>
        <Button className="mt-4" asChild>
          <Link href="/spa/bookings">View bookings</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
