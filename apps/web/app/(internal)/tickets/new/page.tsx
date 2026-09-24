"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTicket, getMspSettings } from "@/lib/api/msp";
import { apiRequest } from "@/lib/api/client";
import { toast } from "sonner";

export default function NewTicketPage() {
  const router = useRouter();
  const [accountId, setAccountId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [ticketType, setTicketType] = useState("incident");
  const [submitting, setSubmitting] = useState(false);
  const [bridgeMode, setBridgeMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getMspSettings()
      .then((s) => setBridgeMode(s.deskMode === "bridge"))
      .catch(() => setBridgeMode(false))
      .finally(() => setReady(true));
  }, []);

  async function ensureAccount(): Promise<string> {
    if (accountId.trim()) return accountId.trim();
    const account = await apiRequest<{ id: string }>("/crm/accounts", {
      method: "POST",
      body: { name: "Walk-in client" },
    });
    return account.id;
  }

  if (!ready) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-fg">Loading…</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="New ticket"
        subtitle={
          bridgeMode
            ? "Bridge mode escape hatch — prefer linking PSA work from Client Onboarding"
            : "Open an MSP lite-desk ticket"
        }
      />
      {bridgeMode && (
        <div className="mb-4 rounded-[10px] border border-border bg-surface px-4 py-3 text-sm space-y-2">
          <p>
            This company is in <strong>Bridge</strong> desk mode. Primary work should stay in your PSA with an
            ExternalWorkRef link.
          </p>
          <Button size="sm" variant="outline" asChild>
            <Link href="/client-onboarding">Go to Client Onboarding</Link>
          </Button>
        </div>
      )}
      <form
        className="max-w-lg space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitting(true);
          try {
            const aid = await ensureAccount();
            const ticket = await createTicket({
              accountId: aid,
              subject,
              description,
              priority,
              type: ticketType,
              source: "manual",
            });
            toast.success(`Created ${ticket.number}`);
            router.push(`/tickets/${ticket.id}`);
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to create ticket");
            setSubmitting(false);
          }
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor="accountId">Account ID (optional — creates walk-in if empty)</Label>
          <Input id="accountId" value={accountId} onChange={(e) => setAccountId(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" required value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            className="w-full min-h-[100px] rounded-md border border-input px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={ticketType}
            onChange={(e) => setTicketType(e.target.value)}
          >
            <option value="incident">Incident</option>
            <option value="request">Request</option>
            <option value="problem">Problem</option>
            <option value="change">Change</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <Button type="submit" disabled={submitting || !subject.trim()}>
          {submitting ? "Creating…" : bridgeMode ? "Create internal ticket anyway" : "Create ticket"}
        </Button>
      </form>
    </PageContainer>
  );
}
