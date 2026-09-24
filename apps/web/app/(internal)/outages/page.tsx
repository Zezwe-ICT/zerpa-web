"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { createOutage, listOutages, transitionOutage } from "@/lib/api/telecom";
import type { TelecomOutage } from "@zerpa/shared-types";
import { toast } from "sonner";

const NEXT: Record<string, string[]> = {
  investigating: ["identified", "resolved"],
  identified: ["monitoring", "resolved"],
  monitoring: ["resolved", "identified"],
  resolved: [],
};

export default function OutagesPage() {
  const [rows, setRows] = useState<TelecomOutage[]>([]);
  async function reload() {
    setRows(await listOutages());
  }
  useEffect(() => {
    reload().catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader
        title="Outages"
        subtitle="Opening an outage saves a notice. Without an SMS or WhatsApp key, that notice is skipped, not sent."
        action={
          <Button
            size="sm"
            onClick={async () => {
              try {
                await createOutage({
                  title: "Investigating access fault",
                  summary: "NOC investigating regional drop",
                });
                toast.success("Outage created");
                await reload();
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Failed");
              }
            }}
          >
            Log outage
          </Button>
        }
      />
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="rounded-[12px] border border-border p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{row.title}</p>
              <StatusBadge status={row.status.toUpperCase()} />
            </div>
            <p className="text-sm text-muted-fg">{row.summary || "—"}</p>
            {row.noticeStatus && (
              <p className="text-xs text-muted-fg">
                Notice: {row.noticeStatus === "skipped" ? "skipped, not sent" : row.noticeStatus}
                {row.noticeCount ? ` · ${row.noticeCount}` : ""}
              </p>
            )}
            {(row.impactedServiceIds || []).length > 0 && (
              <p className="text-xs text-muted-fg">
                Impacted: {row.impactedServiceIds.join(", ")}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              {(NEXT[row.status] || []).map((to) => (
                <Button
                  key={to}
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await transitionOutage(row.id, to);
                      toast.success(`Outage → ${to}`);
                      await reload();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Transition failed");
                    }
                  }}
                >
                  → {to}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
