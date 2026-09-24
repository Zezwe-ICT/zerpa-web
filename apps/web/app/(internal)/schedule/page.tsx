"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { listFuneralSchedule } from "@/lib/api/verticals";
import { toast } from "sonner";

export default function FuneralSchedulePage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    listFuneralSchedule()
      .then(setRows)
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader title="Funeral schedule" subtitle="Upcoming services (next 30 days)" />
      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-muted-fg">No scheduled services yet. Set a service date on a case.</p>}
        {rows.map((row) => (
          <Link
            key={row.id}
            href={`/cases/${row.id}`}
            className="block rounded-[12px] border border-border p-4 hover:bg-surface/50"
          >
            <p className="font-mono text-xs text-muted-fg">{row.number}</p>
            <p className="font-medium">{row.deceasedName}</p>
            <p className="text-xs text-muted-fg">
              {row.serviceDate || "—"} · {row.venue || "No venue"} · {row.status}
            </p>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
}
