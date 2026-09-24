"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getDispatcherBoard, type DispatcherBoard } from "@/lib/api/msp";
import { toast } from "sonner";

export default function DispatcherPage() {
  const [board, setBoard] = useState<DispatcherBoard | null>(null);

  useEffect(() => {
    getDispatcherBoard()
      .then(setBoard)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Dispatcher"
        subtitle={`${board?.openTickets ?? 0} open · ${board?.unassignedCount ?? 0} unassigned`}
      />
      <div className="flex gap-4 overflow-x-auto pb-4">
        {(board?.columns || []).map((col) => (
          <div
            key={col.assigneeId || "unassigned"}
            className="min-w-[260px] max-w-[280px] flex-shrink-0 rounded-[12px] border border-border bg-surface p-3 space-y-2"
          >
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-medium text-sm">{col.assigneeName}</p>
                <p className="text-xs text-muted-fg">
                  {col.openCount} open · {col.billableMinutes} billable min
                </p>
              </div>
              {col.slaBreached > 0 && (
                <span className="text-xs text-danger">{col.slaBreached} SLA</span>
              )}
            </div>
            <ul className="space-y-2">
              {col.tickets.map((t) => (
                <li key={t.id} className="rounded-[8px] border border-border bg-background p-2 text-sm">
                  <Link href={`/tickets/${t.id}`} className="font-mono text-xs text-primary hover:underline">
                    {t.number}
                  </Link>
                  <p className="mt-0.5 line-clamp-2">{t.subject}</p>
                  <div className="mt-1 flex gap-1 items-center">
                    <StatusBadge status={t.status.toUpperCase()} />
                    <span className="text-[10px] uppercase text-muted-fg">{t.priority}</span>
                  </div>
                </li>
              ))}
              {col.tickets.length === 0 && (
                <p className="text-xs text-muted-fg">No open work</p>
              )}
            </ul>
          </div>
        ))}
        {!board && <p className="text-sm text-muted-fg">Loading…</p>}
      </div>
    </PageContainer>
  );
}
