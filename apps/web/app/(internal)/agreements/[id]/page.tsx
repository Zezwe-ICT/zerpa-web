"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { generateRecurringInvoices, getAgreement, updateAgreement } from "@/lib/api/msp";
import { proposeAssist } from "@/lib/api/assistant";
import { toast } from "sonner";

export default function AgreementDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [row, setRow] = useState<Awaited<ReturnType<typeof getAgreement>> | null>(null);
  const [includedHours, setIncludedHours] = useState("0");
  const [overageRate, setOverageRate] = useState("450");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function reload() {
    const data = await getAgreement(id);
    setRow(data);
    setIncludedHours(String(data.includedHours ?? 0));
    setOverageRate(String(data.overageRate ?? 450));
    setNotes(data.amendmentNotes || "");
  }

  useEffect(() => {
    reload().catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"));
  }, [id]);

  if (!row) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-fg">Loading agreement…</p>
      </PageContainer>
    );
  }

  const burn = row.hoursBurn;

  return (
    <PageContainer>
      <PageHeader
        title={row.name}
        subtitle={`${row.accountName || row.accountId} · ${row.billingCadence || "monthly"}`}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/agreements">Back</Link>
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                try {
                  const res = await generateRecurringInvoices(row.id);
                  toast.success(`Generated ${res.created.length} invoice(s)`);
                  await reload();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Billing failed");
                }
              }}
            >
              Run recurring billing
            </Button>
            <p className="text-xs text-muted-fg max-w-xs">
              This bills the monthly fee plus hours logged this month. Licence lines are a list, not a Microsoft Partner Centre feed.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const proposal = await proposeAssist({
                    skillId: "qbr-pack",
                    recordType: "agreement",
                    recordId: row.id,
                    accountId: row.accountId,
                  });
                  toast.success(
                    `QBR draft ready (${proposal.status}) — review & approve in Assist`,
                    { description: proposal.summary.slice(0, 120) },
                  );
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "QBR failed");
                }
              }}
            >
              Generate QBR pack
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-[12px] border border-border p-5 space-y-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={(row.status || "active").toUpperCase()} />
              <span className="text-sm text-muted-fg">
                SLA {row.slaResponseMinutes}m / {row.slaResolveMinutes}m
              </span>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-fg">Monthly fee</dt>
                <dd className="font-mono">R {Number(row.monthlyFee || 0).toFixed(2)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-fg">Open tickets</dt>
                <dd>{row.openTickets ?? 0}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-fg">Hours burn</dt>
                <dd>
                  {burn
                    ? `${(burn.billableMinutes / 60).toFixed(1)}h / ${burn.includedHours}h included`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-fg">Overage estimate</dt>
                <dd className="font-mono">R {Number(burn?.overageEstimate || 0).toFixed(2)}</dd>
              </div>
            </dl>
          </div>

          <form
            className="rounded-[12px] border border-border p-5 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setSaving(true);
              try {
                await updateAgreement(row.id, {
                  includedHours: Number(includedHours) || 0,
                  overageRate: Number(overageRate) || 0,
                  amendmentNotes: notes,
                });
                toast.success("Commercial terms saved");
                await reload();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Save failed");
              } finally {
                setSaving(false);
              }
            }}
          >
            <h2 className="section-title">Commercial terms</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hours">Included hours / month</Label>
                <Input id="hours" type="number" min="0" step="0.5" value={includedHours} onChange={(e) => setIncludedHours(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rate">Overage rate (ZAR/hr)</Label>
                <Input id="rate" type="number" min="0" step="0.01" value={overageRate} onChange={(e) => setOverageRate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Amendment notes</Label>
              <textarea
                id="notes"
                className="w-full min-h-[80px] rounded-md border border-input px-3 py-2 text-sm"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save terms"}
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-[12px] border border-border p-5">
            <h2 className="section-title mb-3">Onboardings</h2>
            {(row.onboardings || []).length === 0 ? (
              <p className="text-xs text-muted-fg">None linked</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {row.onboardings!.map((o) => (
                  <li key={o.id}>
                    <Link href={`/client-onboarding/${o.id}`} className="text-primary hover:underline font-mono">
                      {o.number}
                    </Link>{" "}
                    <span className="text-muted-fg">{o.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-[12px] border border-border p-5">
            <h2 className="section-title mb-3">Recent invoices</h2>
            {(row.invoices || []).length === 0 ? (
              <p className="text-xs text-muted-fg">None yet</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {row.invoices!.map((inv) => (
                  <li key={inv.id} className="flex justify-between gap-2">
                    <span className="font-mono">{inv.invoiceNumber}</span>
                    <span>R {Number(inv.total).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
