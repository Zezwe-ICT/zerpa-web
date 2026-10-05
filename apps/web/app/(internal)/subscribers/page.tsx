"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { UserCheck } from "lucide-react";
import { createSubscriber, listSubscribers } from "@/lib/api/telecom";
import { apiRequest } from "@/lib/api/client";
import type { TelecomSubscriber } from "@zerpa/shared-types";
import { AssistPanel } from "@/components/modules/assistant/assist-panel";
import { toast } from "sonner";

type AccountOption = { id: string; name: string };

export default function SubscribersPage() {
  const [rows, setRows] = useState<TelecomSubscriber[]>([]);
  const [selected, setSelected] = useState<TelecomSubscriber | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [coverageStatus, setCoverageStatus] = useState("unknown");
  const [submitting, setSubmitting] = useState(false);

  async function reload() {
    const [subs, accts] = await Promise.all([
      listSubscribers(),
      apiRequest<AccountOption[]>("/crm/accounts").catch(() => [] as AccountOption[]),
    ]);
    setRows(subs);
    setAccounts(accts);
    if (!accountId && accts[0]) setAccountId(accts[0].id);
  }

  useEffect(() => {
    reload().catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Subscribers"
        subtitle="ISP / telecom reseller subscriber CRM"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <Link href="/orders">View orders</Link>
            </Button>
            <Button size="sm" onClick={() => setShowForm((v) => !v)}>
              {showForm ? "Close" : "New subscriber"}
            </Button>
          </div>
        }
      />
      {error && <p className="text-sm text-danger mb-4">{error}</p>}

      {showForm && (
        <form
          className="mb-6 max-w-xl rounded-[12px] border border-border p-5 space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
              let aid = accountId;
              if (!aid) {
                const created = await apiRequest<{ id: string }>("/crm/accounts", {
                  method: "POST",
                  body: { name: serviceAddress || "New subscriber account" },
                });
                aid = created.id;
              }
              const row = await createSubscriber({
                accountId: aid,
                serviceAddress,
                coverageStatus,
              });
              toast.success("Subscriber created");
              setShowForm(false);
              setServiceAddress("");
              await reload();
              setSelected(row);
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Create failed");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <h2 className="section-title">New subscriber</h2>
          <div className="space-y-1.5">
            <Label htmlFor="account">Account</Label>
            <select
              id="account"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            >
              <option value="">Create new account from address</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Service address</Label>
            <Input
              id="address"
              required
              value={serviceAddress}
              onChange={(e) => setServiceAddress(e.target.value)}
              placeholder="12 Long St, Cape Town"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coverage">Coverage</Label>
            <select
              id="coverage"
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
              value={coverageStatus}
              onChange={(e) => setCoverageStatus(e.target.value)}
            >
              <option value="unknown">Unknown</option>
              <option value="covered">Covered</option>
              <option value="waitlist">Waitlist</option>
              <option value="unavailable">Unavailable</option>
            </select>
          </div>
          <Button type="submit" disabled={submitting || !serviceAddress.trim()}>
            {submitting ? "Creating…" : "Create subscriber"}
          </Button>
        </form>
      )}

      {rows.length === 0 && !error ? (
        <EmptyState
          icon={UserCheck}
          title="No subscribers"
          description="Create a subscriber from an account to start order-to-activation."
          action={{ label: "New subscriber", onClick: () => setShowForm(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-[12px] border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
                <tr>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Coverage</th>
                  <th className="text-left px-4 py-3">RICA</th>
                  <th className="text-left px-4 py-3">Address</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr
                    key={s.id}
                    className="border-t border-border hover:bg-surface cursor-pointer"
                    onClick={() => setSelected(s)}
                  >
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status.toUpperCase()} />
                    </td>
                    <td className="px-4 py-3 text-xs">{s.coverageStatus}</td>
                    <td className="px-4 py-3 text-xs">{s.ricaStatus}</td>
                    <td className="px-4 py-3">
                      <Link href={`/subscribers/${s.id}`} className="hover:underline">
                        {s.serviceAddress || "—"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AssistPanel
            recordType="service_order"
            recordId={selected?.id}
            title="Zerpa Assist"
          />
        </div>
      )}
    </PageContainer>
  );
}
