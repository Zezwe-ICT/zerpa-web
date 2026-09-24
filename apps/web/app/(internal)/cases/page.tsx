"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { createFuneralCase, listFuneralCases, transitionFuneralCase } from "@/lib/api/verticals";
import { FUNERAL_CASE_MACHINE, nextAdvanceState } from "@/lib/workflows";
import { toast } from "sonner";

export default function CasesPage() {
  const [rows, setRows] = useState<any[]>([]);
  async function reload() {
    setRows(await listFuneralCases());
  }
  useEffect(() => {
    reload().catch((e) => toast.error(e.message));
  }, []);
  return (
    <PageContainer>
      <PageHeader
        title="Funeral Cases"
        subtitle="Case intake through service completion"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/schedule">Schedule</Link>
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                await createFuneralCase({ deceasedName: "Sample Deceased", packageName: "Standard burial" });
                toast.success("Case created");
                await reload();
              }}
            >
              New case
            </Button>
          </div>
        }
      />
      <div className="space-y-3">
        {rows.map((row) => {
          const next = nextAdvanceState(FUNERAL_CASE_MACHINE, row.status);
          return (
            <div key={row.id} className="rounded-[12px] border border-border p-4 flex items-center justify-between gap-3">
              <div>
                <Link href={`/cases/${row.id}`} className="font-mono text-xs text-primary hover:underline">
                  {row.number}
                </Link>
                <p className="font-medium">{row.deceasedName}</p>
                <p className="text-xs text-muted-fg">{row.status}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={!next}
                onClick={async () => {
                  if (!next) return;
                  try {
                    await transitionFuneralCase(row.id, next);
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
