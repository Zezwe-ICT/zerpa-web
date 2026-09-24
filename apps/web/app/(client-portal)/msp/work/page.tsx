"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getMspPortalSummary, getPortalTicketReplies, postPortalTicketReply, type MspPortalSummary } from "@/lib/api/msp";
import { toast } from "sonner";

export default function MspPortalWorkPage() {
  const [summary, setSummary] = useState<MspPortalSummary | null>(null);

  useEffect(() => {
    getMspPortalSummary()
      .then(setSummary)
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load work"));
  }, []);

  return (
    <PageContainer>
      <PageHeader
        title="Support & work"
        subtitle="Open tickets and bridged PSA work for your account"
        action={
          <Button size="sm" variant="outline" asChild>
            <Link href="/msp/dashboard">Back to portal</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[12px] border border-border p-5 space-y-3">
          <h2 className="font-semibold">Open tickets</h2>
          {(summary?.openTickets || []).length === 0 && (
            <p className="text-sm text-muted-fg">No open tickets.</p>
          )}
          <ul className="space-y-3 text-sm">
            {(summary?.openTickets || []).map((t) => (
              <PortalTicket key={t.id} ticket={t} />
            ))}
          </ul>
        </div>

        <div className="rounded-[12px] border border-border p-5 space-y-3">
          <h2 className="font-semibold">Bridged PSA work</h2>
          <p className="text-xs text-muted-fg">Tickets living in your MSP&apos;s Halo / Autotask desk.</p>
          {(summary?.bridgedWork || []).length === 0 && (
            <p className="text-sm text-muted-fg">No bridged work synced yet.</p>
          )}
          <ul className="space-y-2 text-sm">
            {(summary?.bridgedWork || []).map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-2 border-b border-border pb-2">
                <div>
                  <p className="text-xs text-muted-fg uppercase">{w.system} · {w.externalId}</p>
                  <p>{w.subject || "—"}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={(w.status || "open").toUpperCase()} />
                  {w.externalUrl && (
                    <a
                      href={w.externalUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      Open in PSA
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </PageContainer>
  );
}

function PortalTicket({ ticket }: { ticket: MspPortalSummary["openTickets"][number] }) {
  const [rows, setRows] = useState<Array<{ id: string; body: string; authorName: string | null; at: string }>>([]);
  const [body, setBody] = useState("");

  useEffect(() => {
    getPortalTicketReplies(ticket.id)
      .then(setRows)
      .catch(() => setRows([]));
  }, [ticket.id]);

  return (
    <li className="border-b border-border pb-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="font-mono text-xs">{ticket.number}</p>
          <p>{ticket.subject}</p>
          {ticket.slaBreached && <p className="text-xs text-danger">SLA breached</p>}
        </div>
        <StatusBadge status={ticket.status.toUpperCase()} />
      </div>
      {rows.length === 0 && <p className="text-xs text-muted-fg">No replies yet.</p>}
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.id}>
            <p className="text-xs text-muted-fg">{row.authorName || "Reply"}</p>
            <p>{row.body}</p>
          </li>
        ))}
      </ul>
      <textarea
        className="w-full min-h-[64px] rounded-md border border-input px-3 py-2 text-sm"
        placeholder="Write a reply"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <Button
        size="sm"
        disabled={!body.trim()}
        onClick={async () => {
          try {
            await postPortalTicketReply(ticket.id, body.trim());
            setBody("");
            setRows(await getPortalTicketReplies(ticket.id));
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not send the reply");
          }
        }}
      >
        Send reply
      </Button>
    </li>
  );
}
