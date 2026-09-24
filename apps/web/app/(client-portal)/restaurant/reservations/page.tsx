"use client";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { getRestaurantPortalSummary } from "@/lib/api/verticals";
import { toast } from "sonner";

export default function RestaurantPortalReservationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    getRestaurantPortalSummary()
      .then((s) => setRows(s.reservations || []))
      .catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader title="Reservations" subtitle="Your bookings" />
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-[12px] border border-border p-4">
            <p className="font-mono text-xs text-muted-fg">{r.number}</p>
            <p className="font-medium">Party of {r.partySize}</p>
            <p className="text-xs text-muted-fg">{r.status}</p>
          </div>
        ))}
        {!rows.length && <p className="text-sm text-muted-fg">No reservations.</p>}
      </div>
    </PageContainer>
  );
}
