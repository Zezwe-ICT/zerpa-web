"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAgreement, generateRecurringInvoices, listAgreements } from "@/lib/api/msp";
import { apiRequest } from "@/lib/api/client";
import { toast } from "sonner";

export default function AgreementsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [name, setName] = useState("Managed Services Agreement");
  const [monthlyFee, setMonthlyFee] = useState("4500");
  const [slaResponse, setSlaResponse] = useState("60");
  const [slaResolve, setSlaResolve] = useState("480");
  const [includedHours, setIncludedHours] = useState("10");
  const [overageRate, setOverageRate] = useState("450");
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    listAgreements().then(setRows).catch((e) => toast.error(e.message));
  }

  useEffect(() => {
    reload();
  }, []);

  async function resolveAccount(): Promise<string> {
    if (accountId.trim()) return accountId.trim();
    if (!clientName.trim()) throw new Error("Enter a client name or account ID");
    const account = await apiRequest<{ id: string }>("/crm/accounts", {
      method: "POST",
      body: { name: clientName.trim() },
    });
    return account.id;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Agreements"
        subtitle="MSP contracts, SLA policy, and recurring commercial terms"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setOpen((v) => !v)}>
              {open ? "Close form" : "New agreement"}
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                try {
                  const res = await generateRecurringInvoices();
                  toast.success(`Generated ${res.created.length} invoice(s)`);
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed");
                }
              }}
            >
              Run recurring billing
            </Button>
          </div>
        }
      />

      {open && (
        <form
          className="mb-6 max-w-xl space-y-4 rounded-[12px] border border-border p-5"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
              const aid = await resolveAccount();
              await createAgreement({
                accountId: aid,
                name: name.trim() || "Managed Services Agreement",
                monthlyFee: Number(monthlyFee) || 0,
                slaResponseMinutes: Number(slaResponse) || 60,
                slaResolveMinutes: Number(slaResolve) || 480,
                includedHours: Number(includedHours) || 0,
                overageRate: Number(overageRate) || 450,
              });
              toast.success("Agreement created");
              setOpen(false);
              setClientName("");
              setAccountId("");
              reload();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Create failed");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="clientName">Client name</Label>
              <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Creates account if ID empty" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="accountId">Existing account ID (optional)</Label>
              <Input id="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Agreement name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fee">Monthly fee (ZAR)</Label>
              <Input id="fee" type="number" min="0" step="0.01" value={monthlyFee} onChange={(e) => setMonthlyFee(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slaR">SLA response (minutes)</Label>
              <Input id="slaR" type="number" min="1" value={slaResponse} onChange={(e) => setSlaResponse(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slaV">SLA resolve (minutes)</Label>
              <Input id="slaV" type="number" min="1" value={slaResolve} onChange={(e) => setSlaResolve(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hours">Included hours / month</Label>
              <Input id="hours" type="number" min="0" step="0.5" value={includedHours} onChange={(e) => setIncludedHours(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="overage">Overage rate (ZAR/hr)</Label>
              <Input id="overage" type="number" min="0" step="0.01" value={overageRate} onChange={(e) => setOverageRate(e.target.value)} />
            </div>
          </div>
          <Button type="submit" disabled={submitting || (!clientName.trim() && !accountId.trim())}>
            {submitting ? "Creating…" : "Create agreement"}
          </Button>
        </form>
      )}

      <div className="rounded-[12px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Hours</th>
              <th className="text-left px-4 py-3">SLA</th>
              <th className="text-left px-4 py-3">Monthly fee</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-fg">
                  No agreements yet — create one to drive recurring commercial billing.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <Link href={`/agreements/${row.id}`} className="text-primary hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize">{row.status}</td>
                  <td className="px-4 py-3 text-muted-fg">
                    {row.includedHours ?? 0}h · R{row.overageRate ?? 450}/hr
                  </td>
                  <td className="px-4 py-3 text-muted-fg">
                    {row.slaResponseMinutes || "—"}m / {row.slaResolveMinutes || "—"}m
                  </td>
                  <td className="px-4 py-3">R {Number(row.monthlyFee || 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </PageContainer>
  );
}
