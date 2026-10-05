"use client";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { getFuneralPortalSummary } from "@/lib/api/verticals";
import { toast } from "sonner";

export default function FuneralPortalCasesPage() {
  const [cases, setCases] = useState<any[]>([]);
  useEffect(() => {
    getFuneralPortalSummary()
      .then((s) => setCases(s.cases || []))
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader title="Cases" subtitle="Family view of funeral cases" />
      <div className="space-y-3">
        {cases.map((c) => (
          <div key={c.id} className="rounded-[12px] border border-border p-4">
            <p className="font-mono text-xs text-muted-fg">{c.number}</p>
            <p className="font-medium">{c.deceasedName}</p>
            <p className="text-xs text-muted-fg">
              {c.status} · {c.packageName || "No package"} · missing: {(c.missingDocs || []).join(", ") || "none"}
            </p>
          </div>
        ))}
        {!cases.length && <p className="text-sm text-muted-fg">No cases visible.</p>}
      </div>
    </PageContainer>
  );
}
