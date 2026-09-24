"use client";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { getFuneralPortalSummary } from "@/lib/api/verticals";
import { toast } from "sonner";

export default function FuneralPortalCompliancePage() {
  const [cases, setCases] = useState<any[]>([]);
  useEffect(() => {
    getFuneralPortalSummary()
      .then((s) => setCases(s.cases || []))
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader title="Compliance" subtitle="Document checklist by case" />
      <div className="space-y-4">
        {cases.map((c) => (
          <div key={c.id} className="rounded-[12px] border border-border p-4">
            <p className="font-medium mb-2">
              {c.number} · {c.deceasedName}
            </p>
            <ul className="text-sm space-y-1">
              {(c.checklist || []).map((item: any) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.label}</span>
                  <span className="text-muted-fg">{item.collected ? "Collected" : "Outstanding"}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {!cases.length && <p className="text-sm text-muted-fg">No compliance items.</p>}
      </div>
    </PageContainer>
  );
}
