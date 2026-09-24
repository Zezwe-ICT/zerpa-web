"use client";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { createReservation, listReservations, transitionReservation } from "@/lib/api/verticals";
import { RESERVATION_MACHINE, nextAdvanceState } from "@/lib/workflows";
import { toast } from "sonner";

export default function ReservationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  async function reload() {
    setRows(await listReservations());
  }
  useEffect(() => {
    reload().catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader
        title="Reservations"
        subtitle="Restaurant guest bookings and service recovery"
        action={
          <Button
            size="sm"
            onClick={async () => {
              await createReservation({ partySize: 4, allergies: "none" });
              toast.success("Reservation created");
              await reload();
            }}
          >
            New reservation
          </Button>
        }
      />
      <div className="space-y-3">
        {rows.map((row) => {
          const next = nextAdvanceState(RESERVATION_MACHINE, row.status);
          return (
            <div key={row.id} className="rounded-[12px] border border-border p-4 flex items-center justify-between">
              <div>
                <p className="font-mono text-xs text-muted-fg">{row.number}</p>
                <p className="font-medium">Party of {row.partySize}</p>
                <p className="text-xs text-muted-fg">{row.status}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={!next}
                onClick={async () => {
                  if (!next) return;
                  try {
                    await transitionReservation(row.id, next);
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
