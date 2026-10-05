"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import {
  getTelecomPortalSummary,
  initiateCollect,
  type TelecomPortalSummary,
} from "@/lib/api/telecom";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";

type Provider = "payfast" | "netcash";

export default function TelecomPortalPayPage() {
  const [summary, setSummary] = useState<TelecomPortalSummary | null>(null);
  const [provider, setProvider] = useState<Provider>("payfast");

  async function reload() {
    setSummary(await getTelecomPortalSummary());
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  const unpaid = (summary?.invoices || []).filter((i) =>
    ["ISSUED", "OVERDUE", "SENT"].includes(i.status),
  );

  return (
    <PageContainer>
      <PageHeader title="Pay" subtitle="Settle outstanding invoices via debit / card collect" />
      <div className="mb-4 flex gap-2 items-center text-sm">
        <span className="text-muted-fg">Rail:</span>
        <select
          className="rounded-md border border-border bg-background px-2 py-1.5"
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
        >
          <option value="payfast">PayFast</option>
          <option value="netcash">Netcash</option>
        </select>
      </div>
      {unpaid.length === 0 ? (
        <p className="text-sm text-muted-fg">Nothing outstanding.</p>
      ) : (
        <ul className="space-y-3">
          {unpaid.map((inv) => (
            <li
              key={inv.id}
              className="rounded-[12px] border border-border p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-mono text-sm">{inv.invoiceNumber}</p>
                <p className="text-sm">R{inv.total}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={inv.status} />
                <Button
                  size="sm"
                  onClick={async () => {
                    try {
                      const pay = await initiateCollect(inv.id, provider);
                      toast.success(
                        `Payment ${pay.paymentRef} started. The invoice updates once ${provider} confirms it.`,
                      );
                      if (pay.redirectUrl) window.open(pay.redirectUrl, "_blank", "noopener");
                      await reload();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Payment failed");
                    }
                  }}
                >
                  Pay now
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
