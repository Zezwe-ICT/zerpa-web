"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getRestaurantPortalSummary } from "@/lib/api/verticals";
import { toast } from "sonner";

export default function RestaurantPortalDashboard() {
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getRestaurantPortalSummary>> | null>(null);
  useEffect(() => {
    getRestaurantPortalSummary()
      .then(setSummary)
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader title="Restaurant portal" subtitle="Reservations and invoices" />
      <div className="rounded-[12px] border border-border p-5">
        <p className="text-sm text-muted-fg">{summary?.upcomingCount ?? "—"} upcoming reservation(s)</p>
        <Button className="mt-4" asChild>
          <Link href="/restaurant/reservations">View reservations</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
