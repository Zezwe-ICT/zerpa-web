"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  cancelService,
  changeServicePlan,
  getTelecomPortalSummary,
  listPlans,
  topUpService,
  type TelecomPlan,
  type TelecomPortalSummary,
} from "@/lib/api/telecom";
import { toast } from "sonner";

export default function TelecomPortalServicesPage() {
  const [summary, setSummary] = useState<TelecomPortalSummary | null>(null);
  const [plans, setPlans] = useState<TelecomPlan[]>([]);
  const [selected, setSelected] = useState<Record<string, string>>({});

  async function reload() {
    const [s, p] = await Promise.all([getTelecomPortalSummary(), listPlans().catch(() => [])]);
    setSummary(s);
    setPlans(p);
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <PageContainer>
      <PageHeader title="My services" subtitle="Change package, top-up LTE, or cancel with proration" />
      {(summary?.hosting?.whmcsUrl || summary?.hosting?.cpanelUrl) && (
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          {summary.hosting.whmcsUrl && (
            <a
              className="rounded-md border border-border px-3 py-1.5 hover:bg-surface"
              href={summary.hosting.whmcsUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open WHMCS
            </a>
          )}
          {summary.hosting.cpanelUrl && (
            <a
              className="rounded-md border border-border px-3 py-1.5 hover:bg-surface"
              href={summary.hosting.cpanelUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open cPanel
            </a>
          )}
        </div>
      )}
      <div className="space-y-3">
        {(summary?.services || []).map((s) => (
          <div key={s.id} className="rounded-[12px] border border-border p-4 space-y-3">
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-medium">{s.planName || s.serviceType}</p>
                <p className="text-xs text-muted-fg font-mono mt-1">{s.circuitId || "—"}</p>
              </div>
              <StatusBadge status={s.status.toUpperCase()} />
            </div>
            {s.status === "active" && (
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                  value={selected[s.id] || ""}
                  onChange={(e) => setSelected((m) => ({ ...m, [s.id]: e.target.value }))}
                >
                  <option value="">Change to plan…</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — R{p.monthlyFee}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!selected[s.id]}
                  onClick={async () => {
                    try {
                      const res = await changeServicePlan(s.id, selected[s.id]);
                      toast.success(
                        `Changed to ${res.plan.name} (proration R${res.proration.proratedAmount})`,
                      );
                      await reload();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Change failed");
                    }
                  }}
                >
                  Apply change
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const res = await topUpService(s.id, { mb: 1024 });
                      toast.success(`Top-up +1GB (invoice ${res.invoiceId || "n/a"})`);
                      await reload();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Top-up failed");
                    }
                  }}
                >
                  Top-up 1GB
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (!confirm("Cancel this service? Unused days will be credited.")) return;
                    try {
                      const res = await cancelService(s.id);
                      toast.success(`Cancelled — credit R${res.proration.creditAmount}`);
                      await reload();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Cancel failed");
                    }
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ))}
        {summary && summary.services.length === 0 && (
          <p className="text-sm text-muted-fg">No services yet.</p>
        )}
      </div>
    </PageContainer>
  );
}
