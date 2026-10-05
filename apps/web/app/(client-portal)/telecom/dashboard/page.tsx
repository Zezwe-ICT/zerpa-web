"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTelecomPortalSummary, type TelecomPortalSummary } from "@/lib/api/telecom";
import { toast } from "sonner";

export default function TelecomPortalDashboard() {
  const [summary, setSummary] = useState<TelecomPortalSummary | null>(null);

  useEffect(() => {
    getTelecomPortalSummary()
      .then(setSummary)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load portal"));
  }, []);

  const kpis = summary?.kpis;

  return (
    <PageContainer>
      <PageHeader title="Subscriber portal" subtitle="Services, orders, billing, and outages" />

      {(summary?.outages || []).length > 0 && (
        <div className="mb-6 rounded-[12px] border border-danger/40 bg-danger/5 p-4 space-y-2">
          <p className="font-semibold text-sm">Network outages affecting your services</p>
          {summary!.outages.map((o) => (
            <div key={o.id} className="text-sm">
              <span className="font-medium">{o.title}</span>
              <span className="text-muted-fg"> · {o.status}</span>
              {o.summary && <p className="text-muted-fg text-xs mt-0.5">{o.summary}</p>}
              <p className="text-muted-fg text-xs">Shown from Zerpa. A text is not sent unless that channel is connected.</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          ["Active services", kpis?.activeServices],
          ["Suspended", kpis?.suspendedServices],
          ["Orders in flight", kpis?.ordersInFlight],
          ["Unpaid invoices", kpis?.unpaidInvoices],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-[12px] border border-border p-4">
            <p className="text-xs uppercase text-muted-fg">{label}</p>
            <p className="text-2xl font-semibold mt-1">{value ?? "—"}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[12px] border border-border p-5">
          <h2 className="font-semibold">Services</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(summary?.services || []).slice(0, 4).map((s) => (
              <li key={s.id} className="flex justify-between gap-2">
                <span className="truncate">{s.planName || s.serviceType}</span>
                <StatusBadge status={s.status.toUpperCase()} />
              </li>
            ))}
          </ul>
          <Button className="mt-4" size="sm" variant="outline" asChild>
            <Link href="/telecom/services">All services</Link>
          </Button>
        </div>
        <div className="rounded-[12px] border border-border p-5">
          <h2 className="font-semibold">Billing</h2>
          <p className="text-sm text-muted-fg mt-1">
            {kpis?.unpaidInvoices ? `${kpis.unpaidInvoices} unpaid` : "No unpaid invoices"}
          </p>
          <div className="flex gap-2 mt-4">
            <Button size="sm" asChild>
              <Link href="/telecom/pay">Pay now</Link>
            </Button>
            <Button size="sm" variant="outline" asChild>
              <Link href="/telecom/invoices">Invoices</Link>
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
