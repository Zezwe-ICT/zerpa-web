"use client";

import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { getTelecomPortalSummary, type TelecomPortalSummary } from "@/lib/api/telecom";
import { toast } from "sonner";

export default function TelecomPortalDocsPage() {
  const [summary, setSummary] = useState<TelecomPortalSummary | null>(null);
  useEffect(() => {
    getTelecomPortalSummary()
      .then(setSummary)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <PageContainer>
      <PageHeader title="Documents" subtitle="RICA and contract documents issued to you" />
      <ul className="space-y-2">
        {(summary?.documents || []).map((d) => (
          <li key={d.id} className="rounded-[12px] border border-border p-4 text-sm flex justify-between gap-2">
            <div>
              <p className="font-medium">{d.name}</p>
              <p className="text-xs text-muted-fg uppercase mt-1">
                {d.category} · {d.classification}
              </p>
            </div>
          </li>
        ))}
        {summary && summary.documents.length === 0 && (
          <p className="text-sm text-muted-fg">No documents yet.</p>
        )}
      </ul>
    </PageContainer>
  );
}
