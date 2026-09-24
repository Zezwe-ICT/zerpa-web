"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClientOnboarding } from "@/lib/api/msp";
import { apiRequest } from "@/lib/api/client";

type AccountOption = { id: string; name: string };
type LifecycleKind = "onboarding" | "offboarding" | "project";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function NewClientOnboardingPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [clientName, setClientName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [notes, setNotes] = useState("");
  const [kind, setKind] = useState<LifecycleKind>("onboarding");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const qKind = search.get("kind");
    if (qKind === "project" || qKind === "offboarding" || qKind === "onboarding") {
      setKind(qKind);
    }
    apiRequest<AccountOption[]>("/crm/accounts")
      .then((rows) => setAccounts(rows || []))
      .catch(() => setAccounts([]));
  }, [search]);

  async function resolveAccount(): Promise<string> {
    if (accountId.trim()) {
      if (!UUID_RE.test(accountId.trim())) {
        throw new Error("Pick an existing account from the list (or leave blank and enter a client name).");
      }
      return accountId.trim();
    }
    if (!clientName.trim()) throw new Error("Enter a client name or select an account");
    const account = await apiRequest<{ id: string }>("/crm/accounts", {
      method: "POST",
      body: { name: clientName.trim() },
    });
    return account.id;
  }

  return (
    <PageContainer>
      <PageHeader
        title="Start client lifecycle"
        subtitle="Onboarding, offboarding, or M365 cutover project"
      />
      <form
        className="max-w-lg space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitting(true);
          try {
            const aid = await resolveAccount();
            const row = await createClientOnboarding({
              accountId: aid,
              ownerName: ownerName || undefined,
              notes: notes || undefined,
              kind,
              projectTemplate: kind === "project" ? search.get("template") || "m365_cutover" : undefined,
            });
            toast.success(`Started ${row.number}`);
            router.push(`/client-onboarding/${row.id}`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to start onboarding");
            setSubmitting(false);
          }
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="kind">Lifecycle kind</Label>
          <select
            id="kind"
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value as LifecycleKind)}
          >
            <option value="onboarding">Onboarding</option>
            <option value="offboarding">Offboarding</option>
            <option value="project">Project (M365 cutover)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="accountId">Existing account</Label>
          <select
            id="accountId"
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              if (e.target.value) setClientName("");
            }}
          >
            <option value="">Create new from name below</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="clientName">New client / company name</Label>
          <Input
            id="clientName"
            value={clientName}
            disabled={Boolean(accountId)}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Acme Holdings"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ownerName">Owner</Label>
          <Input id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Account manager" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            className="w-full min-h-[100px] rounded-md border border-input px-3 py-2 text-sm"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={submitting || (!clientName.trim() && !accountId.trim())}>
          {submitting
            ? "Starting…"
            : kind === "offboarding"
              ? "Start offboarding"
              : kind === "project"
                ? "Start M365 project"
                : "Start onboarding"}
        </Button>
      </form>
    </PageContainer>
  );
}
