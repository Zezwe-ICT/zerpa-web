"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  createCreditNote,
  dunningQueueAction,
  initiateCollect,
  listDunningQueue,
  simulatePayment,
  type DunningQueueItem,
} from "@/lib/api/telecom";
import { toast } from "sonner";

export default function DunningPage() {
  const [items, setItems] = useState<DunningQueueItem[]>([]);

  async function reload() {
    const res = await listDunningQueue();
    setItems(res.items || []);
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load dunning"));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Dunning"
        subtitle="Arrears queue — suspend / collect / reactivate"
      />
      {items.length === 0 ? (
        <p className="text-sm text-muted-fg">No arrears or suspended subscribers.</p>
      ) : (
        <div className="space-y-4">
          {items.map((row) => (
            <div key={row.subscriberId} className="rounded-[12px] border border-border p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{row.serviceAddress || row.subscriberId}</p>
                  <p className="text-xs text-muted-fg">RICA {row.ricaStatus}</p>
                </div>
                <StatusBadge status={row.status.toUpperCase()} />
              </div>
              <ul className="text-sm space-y-1">
                {row.unpaidInvoices.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {inv.invoiceNumber} · R{inv.total} · {inv.status}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          const pay = await initiateCollect(inv.id, "payfast");
                          try {
                            await simulatePayment(pay.paymentRef);
                            toast.success(`Paid via ${pay.paymentRef} (dev simulation)`);
                          } catch {
                            toast.success(`Collection ${pay.paymentRef} started; awaiting PayFast confirmation`);
                          }
                          await reload();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Collect failed");
                        }
                      }}
                    >
                      Collect (PayFast)
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                <p className="w-full text-xs text-muted-fg">Suspending does not cut a live line.</p>
                {row.status !== "suspended" ? (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await dunningQueueAction(row.subscriberId, "suspend");
                        toast.success("Suspended");
                        await reload();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Suspend failed");
                      }
                    }}
                  >
                    Suspend
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await dunningQueueAction(row.subscriberId, "reactivate");
                        toast.success("Reactivated");
                        await reload();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Reactivate blocked — collect first");
                      }
                    }}
                  >
                    Reactivate
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await createCreditNote({
                        accountId: row.accountId,
                        amount: 100,
                        notes: "Manual outage credit stub",
                      });
                      toast.success("Credit note issued");
                      await reload();
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Credit failed");
                    }
                  }}
                >
                  Credit R100 (stub)
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  );
}
