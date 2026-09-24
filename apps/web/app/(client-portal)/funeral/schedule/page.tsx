"use client";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { getFuneralPortalSummary } from "@/lib/api/verticals";
import { toast } from "sonner";

export default function FuneralPortalSchedulePage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    getFuneralPortalSummary()
      .then((s) => setRows(s.schedule || []))
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader title="Schedule" subtitle="Upcoming services" />
      <div className="space-y-3">
        {rows.map((c) => (
          <div key={c.id} className="rounded-[12px] border border-border p-4">
            <p className="font-medium">{c.deceasedName}</p>
            <p className="text-xs text-muted-fg">
              {c.serviceDate || "Date TBD"} · {c.venue || "Venue TBD"}
            </p>
          </div>
        ))}
        {!rows.length && <p className="text-sm text-muted-fg">Nothing scheduled.</p>}
      </div>
    </PageContainer>
  );
}
