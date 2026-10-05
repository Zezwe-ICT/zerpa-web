"use client";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMspPortalSummary, type MspPortalSummary } from "@/lib/api/msp";
import { toast } from "sonner";

export default function MspPortalDashboard() {
  const [summary, setSummary] = useState<MspPortalSummary | null>(null);

  useEffect(() => {
    getMspPortalSummary()
      .then(setSummary)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load portal"));
  }, []);

  const onboarding = summary?.onboarding;

  return (
    <PageContainer>
      <PageHeader title="Client portal" subtitle="Onboarding progress, agreements, tickets, and invoices" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[12px] border border-border p-5">
          <h2 className="font-semibold">Onboarding</h2>
          {onboarding ? (
            <>
              <p className="text-sm text-muted-fg mt-1">
                {onboarding.number} · {onboarding.progress}% complete
              </p>
              <div className="mt-3 h-2 rounded-full bg-surface overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${onboarding.progress}%` }} />
              </div>
              <p className="text-xs text-muted-fg mt-2 capitalize">{onboarding.status.replace(/_/g, " ")}</p>
            </>
          ) : (
            <p className="text-sm text-muted-fg mt-1">No active onboarding.</p>
          )}
        </div>
        <div className="rounded-[12px] border border-border p-5">
          <h2 className="font-semibold">Support</h2>
          <p className="text-sm text-muted-fg mt-1">
            {summary?.openTickets?.length
              ? `${summary.openTickets.length} open ticket(s)`
              : "No open tickets"}
            {(summary?.bridgedWork?.length || 0) > 0
              ? ` · ${summary!.bridgedWork!.length} bridged`
              : ""}
          </p>
          <Button className="mt-4" asChild>
            <Link href="/msp/work">View tickets &amp; PSA work</Link>
          </Button>
        </div>
        <div className="rounded-[12px] border border-border p-5">
          <h2 className="font-semibold">Agreements</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(summary?.agreements || []).length === 0 && (
              <li className="text-muted-fg">No agreements yet.</li>
            )}
            {(summary?.agreements || []).map((a) => (
              <li key={a.id} className="flex justify-between">
                <span>{a.name}</span>
                <span className="text-muted-fg">R{a.monthlyFee}/mo</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[12px] border border-border p-5">
          <h2 className="font-semibold">Billing</h2>
          <p className="text-sm text-muted-fg mt-1">Pay outstanding invoices for managed services.</p>
          <Button className="mt-4" asChild>
            <Link href="/msp/invoices">View invoices</Link>
          </Button>
        </div>
      </div>
    </PageContainer>
  );
}
