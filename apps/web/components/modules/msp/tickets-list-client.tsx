"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Ticket } from "lucide-react";
import { getMspSettings, listTickets, type MspDeskMode } from "@/lib/api/msp";
import type { MspTicket } from "@zerpa/shared-types";
import { AssistPanel } from "@/components/modules/assistant/assist-panel";

export function TicketsListClient() {
  const [tickets, setTickets] = useState<MspTicket[]>([]);
  const [deskMode, setDeskMode] = useState<MspDeskMode>("lite");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<MspTicket | null>(null);

  useEffect(() => {
    Promise.all([
      listTickets(),
      getMspSettings().catch(() => null),
    ])
      .then(([rows, settings]) => {
        setTickets(rows);
        if (settings?.deskMode) setDeskMode(settings.deskMode);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load tickets"))
      .finally(() => setLoading(false));
  }, []);

  const isBridge = deskMode === "bridge";

  return (
    <PageContainer>
      <PageHeader
        title="Work Bridge"
        subtitle={
          isBridge
            ? "Bridge mode — link PSA/RMM work; prefer ExternalWorkRef over inventing a second desk"
            : "Lite desk — create and resolve tickets in Zerpa"
        }
        action={
          isBridge ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/client-onboarding">External work</Link>
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/tickets/new">Internal ticket</Link>
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild>
              <Link href="/tickets/new">New work item</Link>
            </Button>
          )
        }
      />

      {isBridge && (
        <p className="text-sm text-muted-fg mb-4 rounded-[10px] border border-border bg-surface px-4 py-3">
          Desk mode is <strong>Bridge</strong>. Primary flow is linking work from your PSA on Client Onboarding.
          Internal tickets remain available as an escape hatch.
        </p>
      )}

      {error && <p className="text-sm text-danger mb-4">{error}</p>}
      {loading ? (
        <p className="text-sm text-muted-fg">Loading tickets…</p>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={isBridge ? "No linked or internal tickets yet" : "No tickets yet"}
          description={
            isBridge
              ? "Link ExternalWorkRef from client onboarding, or ingest an authenticated RMM alert."
              : "Create a ticket or ingest an RMM alert to start the queue."
          }
          action={
            isBridge
              ? { label: "Open onboarding", onClick: () => (window.location.href = "/client-onboarding") }
              : { label: "New ticket", onClick: () => (window.location.href = "/tickets/new") }
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-[12px] border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
                <tr>
                  <th className="text-left px-4 py-3">Ticket</th>
                  <th className="text-left px-4 py-3">Priority</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">SLA</th>
                  <th className="text-left px-4 py-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    className="border-t border-border hover:bg-surface cursor-pointer"
                    onClick={() => setSelected(t)}
                  >
                    <td className="px-4 py-3">
                      <Link href={`/tickets/${t.id}`} className="font-mono text-primary hover:underline">
                        {t.number}
                      </Link>
                      <p className="text-foreground mt-0.5">{t.subject}</p>
                    </td>
                    <td className="px-4 py-3 capitalize">{t.priority}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status.toUpperCase()} />
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {t.slaBreached ? (
                        <span className="text-danger font-medium">Breached</span>
                      ) : (
                        <span className="text-muted-fg">OK</span>
                      )}
                    </td>
                    <td className="px-4 py-3 uppercase text-xs text-muted-fg">{t.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AssistPanel
            recordType="ticket"
            recordId={selected?.id}
            title={selected ? `Assist · ${selected.number}` : "Zerpa Assist"}
          />
        </div>
      )}
    </PageContainer>
  );
}
