"use client";
import { useEffect, useState } from "react";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  approveJobCard,
  createJobCard,
  listJobCards,
  transitionJobCard,
  type StaffApprovalMethod,
} from "@/lib/api/verticals";
import { JOB_CARD_MACHINE, nextAdvanceState } from "@/lib/workflows";
import { formatCurrency } from "@/lib/utils/currency";
import { toast } from "sonner";

const APPROVAL_METHODS: Array<{ value: StaffApprovalMethod; label: string }> = [
  { value: "phone", label: "Phone call" },
  { value: "in_person", label: "In person" },
  { value: "written", label: "Signed quote" },
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
];

export default function JobCardsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [approving, setApproving] = useState<string | null>(null);
  const [method, setMethod] = useState<StaffApprovalMethod>("phone");
  const [approverName, setApproverName] = useState("");

  async function reload() {
    setRows(await listJobCards());
  }
  useEffect(() => {
    reload().catch((e) => toast.error(e.message));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Job Cards"
        subtitle="Automotive inspection, approval, labour and delivery"
        action={
          <Button
            size="sm"
            onClick={async () => {
              await createJobCard({
                vehicleReg: "CA123456",
                vehicleMake: "Toyota",
                complaint: "Brake noise",
                estimateAmount: 2500,
              });
              toast.success("Job card created");
              await reload();
            }}
          >
            New job card
          </Button>
        }
      />
      <div className="space-y-3">
        {rows.map((row) => {
          const next = nextAdvanceState(JOB_CARD_MACHINE, row.status);
          const needsApproval = row.status === "awaiting_approval" && !row.approved;
          return (
            <div key={row.id} className="rounded-[12px] border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-muted-fg">{row.number}</p>
                  <p className="font-medium">
                    {row.vehicleReg} · {row.vehicleMake}
                  </p>
                  <p className="text-xs text-muted-fg">
                    {row.status} · estimate {formatCurrency(row.estimateAmount)}
                    {row.approved && row.approvedByName
                      ? ` · approved by ${row.approvedByName} (${row.approvalMethod})`
                      : ""}
                  </p>
                </div>
                {needsApproval ? (
                  <Button size="sm" variant="outline" onClick={() => setApproving(approving === row.id ? null : row.id)}>
                    Record customer approval
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!next}
                    onClick={async () => {
                      if (!next) return;
                      try {
                        await transitionJobCard(row.id, next);
                        await reload();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Blocked");
                      }
                    }}
                  >
                    {next ? `→ ${next}` : "Done"}
                  </Button>
                )}
              </div>
              {needsApproval && approving === row.id && (
                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  <select
                    className="rounded-[6px] border border-border bg-background px-3 py-2 text-sm"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as StaffApprovalMethod)}
                    aria-label="How the customer approved"
                  >
                    {APPROVAL_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    className="max-w-xs"
                    placeholder="Who approved (customer name)"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={!approverName.trim()}
                    onClick={async () => {
                      try {
                        await approveJobCard(row.id, method, approverName.trim());
                        setApproving(null);
                        setApproverName("");
                        toast.success(`Approval of ${formatCurrency(row.estimateAmount)} recorded`);
                        await reload();
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Could not record approval");
                      }
                    }}
                  >
                    Save approval
                  </Button>
                  <p className="basis-full text-xs text-muted-fg">
                    Work can only start once the customer has approved this estimate. Raising the estimate needs a new approval.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
}
