"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getTicket, transitionTicket, logTime, updateTicket, createTicket, addTicketReply } from "@/lib/api/msp";
import { canTransition, TICKET_MACHINE } from "@/lib/workflows";
import type { MspTicket } from "@zerpa/shared-types";
import { AssistPanel } from "@/components/modules/assistant/assist-panel";
import { CustomFieldsPanel } from "@/components/modules/customization/custom-fields-panel";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ZerpaLoader } from "@/components/brand/zerpa-loader";

export function TicketDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [ticket, setTicket] = useState<MspTicket | null>(null);
  const [minutes, setMinutes] = useState(30);
  const [runbookUrl, setRunbookUrl] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);

  async function reload() {
    const t = await getTicket(id);
    setTicket(t);
    setRunbookUrl((t as MspTicket & { runbookUrl?: string }).runbookUrl || "");
  }

  useEffect(() => {
    reload()
      .catch(() => toast.error("Ticket not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <PageContainer>
        <ZerpaLoader />
      </PageContainer>
    );
  }
  if (!ticket) {
    return (
      <PageContainer>
        <p className="text-sm text-danger">Ticket not found</p>
      </PageContainer>
    );
  }

  const nextStates = TICKET_MACHINE[ticket.status] ?? [];

  return (
    <PageContainer>
      <PageHeader
        title={ticket.number}
        subtitle={ticket.subject}
        action={
          <Button variant="outline" size="sm" onClick={() => router.push("/tickets")}>
            Back to tickets
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-[12px] border border-border p-5 space-y-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={ticket.status.toUpperCase()} />
              <span className="text-xs uppercase text-muted-fg">{ticket.type}</span>
              <span className="text-xs uppercase text-muted-fg">{ticket.priority}</span>
              <span className="text-xs uppercase text-muted-fg">{ticket.source}</span>
              {ticket.slaBreached && (
                <span className="text-xs font-medium text-danger uppercase">SLA breached</span>
              )}
            </div>
            <p className="text-sm text-foreground-2 whitespace-pre-wrap">{ticket.description || "No description"}</p>
            <div className="pt-3 border-t border-border space-y-2">
              <p className="text-xs font-medium text-muted-fg">Thread</p>
              {((ticket as MspTicket & { thread?: Array<{ id: string; body: string; authorName: string | null; at: string }> }).thread || []).length === 0 && (
                <p className="text-sm text-muted-fg">No replies yet.</p>
              )}
              <ul className="space-y-2">
                {((ticket as MspTicket & { thread?: Array<{ id: string; body: string; authorName: string | null; at: string; kind: string }> }).thread || []).map((row) => (
                  <li key={row.id} className="text-sm">
                    <p className="text-xs text-muted-fg">{row.authorName || "Staff"} · {new Date(row.at).toLocaleString()}</p>
                    <p className="whitespace-pre-wrap">{row.body}</p>
                  </li>
                ))}
              </ul>
              <textarea
                className="w-full min-h-[72px] rounded-md border border-input px-3 py-2 text-sm"
                placeholder="Write a reply"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <Button
                size="sm"
                disabled={!reply.trim()}
                onClick={async () => {
                  try {
                    await addTicketReply(ticket.id, reply.trim());
                    setReply("");
                    await reload();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Could not save the reply");
                  }
                }}
              >
                Save reply
              </Button>
            </div>
            <div className="pt-3 border-t border-border space-y-2">
              <Label className="text-xs">Runbook URL</Label>
              <div className="flex gap-2">
                <Input
                  value={runbookUrl}
                  onChange={(e) => setRunbookUrl(e.target.value)}
                  placeholder="https://…"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const updated = await updateTicket(ticket.id, { runbookUrl });
                      setTicket(updated);
                      toast.success("Runbook saved");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Save failed");
                    }
                  }}
                >
                  Save
                </Button>
              </div>
              {runbookUrl && (
                <a href={runbookUrl} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                  Open runbook
                </a>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-border">
              <div>
                <dt className="text-muted-fg">Respond by</dt>
                <dd className="font-mono">{ticket.slaRespondBy ? new Date(ticket.slaRespondBy).toLocaleString() : "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-fg">Resolve by</dt>
                <dd className="font-mono">{ticket.slaResolveBy ? new Date(ticket.slaResolveBy).toLocaleString() : "—"}</dd>
              </div>
            </dl>
            {(ticket as any).parent && (
              <div className="pt-3 border-t border-border text-sm">
                <p className="text-xs text-muted-fg mb-1">Linked parent</p>
                <button
                  type="button"
                  className="text-primary hover:underline font-mono text-xs"
                  onClick={() => router.push(`/tickets/${(ticket as any).parent.id}`)}
                >
                  {(ticket as any).parent.number} · {(ticket as any).parent.subject}
                </button>
              </div>
            )}
            {Array.isArray((ticket as any).children) && (ticket as any).children.length > 0 && (
              <div className="pt-3 border-t border-border text-sm space-y-1">
                <p className="text-xs text-muted-fg">Linked children</p>
                {(ticket as any).children.map((c: { id: string; number: string; subject: string; type: string }) => (
                  <button
                    key={c.id}
                    type="button"
                    className="block text-left text-primary hover:underline font-mono text-xs"
                    onClick={() => router.push(`/tickets/${c.id}`)}
                  >
                    {c.number} · {c.type} · {c.subject}
                  </button>
                ))}
              </div>
            )}
            <div className="pt-3 border-t border-border">
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const child = await createTicket({
                      accountId: ticket.accountId,
                      subject: `Related: ${ticket.subject}`,
                      description: `Linked from ${ticket.number}`,
                      type: ticket.type === "problem" ? "incident" : "change",
                      parentTicketId: ticket.id,
                      priority: ticket.priority,
                    });
                    toast.success(`Created ${child.number}`);
                    router.push(`/tickets/${child.id}`);
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Link failed");
                  }
                }}
              >
                Link child ticket
              </Button>
            </div>
          </div>

          <div className="rounded-[12px] border border-border p-5 space-y-3">
            <h2 className="section-title">Transitions</h2>
            <div className="flex flex-wrap gap-2">
              {nextStates.map((to) => (
                <Button
                  key={to}
                  size="sm"
                  variant="outline"
                  disabled={!canTransition(TICKET_MACHINE, ticket.status, to)}
                  onClick={async () => {
                    try {
                      const updated = await transitionTicket(ticket.id, to);
                      setTicket(updated);
                      toast.success(`Moved to ${to}`);
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Transition failed");
                    }
                  }}
                >
                  → {to}
                </Button>
              ))}
              {nextStates.length === 0 && <p className="text-xs text-muted-fg">No further transitions</p>}
            </div>
          </div>

          <div className="rounded-[12px] border border-border p-5 space-y-3">
            <h2 className="section-title">Log time</h2>
            <div className="flex items-center gap-2">
              <input
                type="number"
                className="h-9 w-24 rounded-md border border-input px-3 text-sm"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
              <span className="text-xs text-muted-fg">minutes</span>
              <Button
                size="sm"
                onClick={async () => {
                  try {
                    await logTime(ticket.id, { minutes, billable: true });
                    toast.success("Time logged");
                    await reload();
                  } catch (e) {
                    toast.error(e instanceof Error ? e.message : "Failed");
                  }
                }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>

        <CustomFieldsPanel entity="ticket" recordId={ticket.id} />

        <AssistPanel recordType="ticket" recordId={ticket.id} title={`Assist · ${ticket.number}`} />
      </div>
    </PageContainer>
  );
}
