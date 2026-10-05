"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTelecomPortalSummary, type TelecomPortalSummary } from "@/lib/api/telecom";
import { toast } from "sonner";

export default function TelecomPortalOrdersPage() {
  const [summary, setSummary] = useState<TelecomPortalSummary | null>(null);
  useEffect(() => {
    getTelecomPortalSummary()
      .then(setSummary)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <PageContainer>
      <PageHeader title="Orders" subtitle="Track activation progress (status only)" />
      <div className="rounded-[12px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase text-muted-fg">
            <tr>
              <th className="text-left px-4 py-3">Order</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(summary?.orders || []).map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono">{o.number}</td>
                <td className="px-4 py-3">{o.productName}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={o.status.toUpperCase()} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
