"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { getFuneralCase, patchFuneralCase, transitionFuneralCase } from "@/lib/api/verticals";
import { FUNERAL_CASE_MACHINE, nextAdvanceState } from "@/lib/workflows";
import { toast } from "sonner";
import { ZerpaLoader } from "@/components/brand/zerpa-loader";

export default function FuneralCaseDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [row, setRow] = useState<any | null>(null);

  async function reload() {
    setRow(await getFuneralCase(id));
  }
  useEffect(() => {
    reload().catch((e) => toast.error(e.message));
  }, [id]);

  if (!row) {
    return (
      <PageContainer>
        <ZerpaLoader />
      </PageContainer>
    );
  }

  const next = nextAdvanceState(FUNERAL_CASE_MACHINE, row.status);

  return (
    <PageContainer>
      <PageHeader
        title={row.number}
        subtitle={`${row.deceasedName} · ${row.status}`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/cases">Back</Link>
            </Button>
            <Button
              size="sm"
              disabled={!next}
              onClick={async () => {
                if (!next) return;
                try {
                  await transitionFuneralCase(id, next);
                  await reload();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Blocked");
                }
              }}
            >
              {next ? `→ ${next}` : "Done"}
            </Button>
          </div>
        }
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[12px] border border-border p-4 space-y-2 text-sm">
          <p>
            <span className="text-muted-fg">Service type</span> · {row.serviceType}
          </p>
          <p>
            <span className="text-muted-fg">Package</span> · {row.packageName || "—"}
          </p>
          <p>
            <span className="text-muted-fg">Venue</span> · {row.venue || "—"}
          </p>
          <p>
            <span className="text-muted-fg">Service date</span> · {row.serviceDate || "—"}
          </p>
          <p>
            <span className="text-muted-fg">Deposit</span> · R{row.depositAmount}{" "}
            {row.depositPaid ? "(paid)" : "(unpaid)"}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={async () => {
              await patchFuneralCase(id, { depositPaid: !row.depositPaid });
              await reload();
            }}
          >
            Toggle deposit paid
          </Button>
        </div>
        <div className="rounded-[12px] border border-border p-4">
          <h2 className="font-semibold mb-3">Compliance docs</h2>
          <ul className="space-y-2">
            {(row.checklist || []).map((item: any) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.label}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const checklist = (row.checklist || []).map((c: any) =>
                      c.id === item.id ? { ...c, collected: !c.collected } : c
                    );
                    await patchFuneralCase(id, { checklist });
                    await reload();
                  }}
                >
                  {item.collected ? "Collected" : "Mark collected"}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageContainer>
  );
}
