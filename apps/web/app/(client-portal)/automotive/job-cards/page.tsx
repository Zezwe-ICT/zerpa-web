"use client";
import { useCallback, useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { approveJobCardAsCustomer, getAutomotivePortalSummary } from "@/lib/api/verticals";
import { formatCurrency } from "@/lib/utils/currency";
import { toast } from "sonner";

export default function AutomotivePortalJobCardsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const s = await getAutomotivePortalSummary();
    setRows(s.jobCards || []);
  }, []);

  useEffect(() => {
    reload().catch((e) => toast.error(e.message));
  }, [reload]);

  return (
    <PageContainer>
      <PageHeader title="Job cards" subtitle="Vehicle work status" />
      <div className="space-y-3">
        {rows.map((j) => {
          const needsApproval = j.status === "awaiting_approval" && !j.approved;
          return (
            <div key={j.id} className="rounded-[12px] border border-border p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-muted-fg">{j.number}</p>
                <p className="font-medium">
                  {j.vehicleReg} · {j.vehicleMake}
                </p>
                <p className="text-xs text-muted-fg">
                  {j.status}
                  {needsApproval ? ` · estimate ${formatCurrency(j.estimateAmount)} needs your approval` : ""}
                  {j.status === "awaiting_approval" && j.approved ? " · approved, waiting for the workshop" : ""}
                </p>
              </div>
              {needsApproval && (
                <Button
                  size="sm"
                  disabled={busy === j.id}
                  onClick={async () => {
                    if (!window.confirm(`Approve the estimate of ${formatCurrency(j.estimateAmount)} for ${j.vehicleReg}?`)) return;
                    setBusy(j.id);
                    try {
                      await approveJobCardAsCustomer(j.id);
                      toast.success("Estimate approved");
                      await reload();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not approve");
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  Approve {formatCurrency(j.estimateAmount)}
                </Button>
              )}
            </div>
          );
        })}
        {!rows.length && <p className="text-sm text-muted-fg">No job cards.</p>}
      </div>
    </PageContainer>
  );
}
