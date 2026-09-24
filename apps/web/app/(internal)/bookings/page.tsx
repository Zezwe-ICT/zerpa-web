"use client";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { createSpaBooking, listSpaBookings, transitionSpaBooking } from "@/lib/api/verticals";
import { SPA_BOOKING_MACHINE, nextAdvanceState } from "@/lib/workflows";
import { toast } from "sonner";

export default function BookingsPage() {
  const [rows, setRows] = useState<any[]>([]);
  async function reload() {
    setRows(await listSpaBookings());
  }
  useEffect(() => {
    reload().catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader
        title="Bookings"
        subtitle="Spa bookings and consent-aware treatment flow"
        action={
          <Button
            size="sm"
            onClick={async () => {
              await createSpaBooking({ serviceName: "Deep tissue 60", consentCaptured: true });
              toast.success("Booking created");
              await reload();
            }}
          >
            New booking
          </Button>
        }
      />
      <div className="space-y-3">
        {rows.map((row) => {
          const next = nextAdvanceState(SPA_BOOKING_MACHINE, row.status);
          return (
            <div key={row.id} className="rounded-[12px] border border-border p-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-xs text-muted-fg">{row.number}</p>
                <p className="font-medium">{row.serviceName}</p>
                <p className="text-xs text-muted-fg">{row.status}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={!next}
                onClick={async () => {
                  if (!next) return;
                  try {
                    await transitionSpaBooking(row.id, next);
                    await reload();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Blocked");
                  }
                }}
              >
                {next ? `→ ${next}` : "Done"}
              </Button>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
