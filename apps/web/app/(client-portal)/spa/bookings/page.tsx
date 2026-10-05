"use client";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { getSpaPortalSummary } from "@/lib/api/verticals";
import { toast } from "sonner";

export default function SpaPortalBookingsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    getSpaPortalSummary()
      .then((s) => setRows(s.bookings || []))
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader title="Bookings" subtitle="Spa appointments" />
      <div className="space-y-3">
        {rows.map((b) => (
          <div key={b.id} className="rounded-[12px] border border-border p-4">
            <p className="font-mono text-xs text-muted-fg">{b.number}</p>
            <p className="font-medium">{b.serviceName}</p>
            <p className="text-xs text-muted-fg">{b.status}</p>
          </div>
        ))}
        {!rows.length && <p className="text-sm text-muted-fg">No bookings.</p>}
      </div>
    </PageContainer>
  );
}
