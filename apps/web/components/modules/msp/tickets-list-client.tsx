"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, ExternalLink, Plus, Search, Settings, Ticket } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getMspSettings, listTickets, type MspDeskMode } from "@/lib/api/msp";
import type { MspTicket } from "@zerpa/shared-types";
import { AssistPanel } from "@/components/modules/assistant/assist-panel";
import { toast } from "sonner";

const PRIORITY_BORDER: Record<string, string> = {
  critical: "border-l-4 border-l-danger",
  high: "border-l-4 border-l-warning",
  medium: "",
  low: "",
};

export function TicketsListClient() {
  const { company } = useAuth();
  const [tickets, setTickets] = useState<MspTicket[]>([]);
  const [deskMode, setDeskMode] = useState<MspDeskMode>("lite");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MspTicket | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    Promise.all([listTickets(), getMspSettings().catch(() => null)])
      .then(([rows, settings]) => {
        setTickets(rows);
        if (settings?.deskMode) setDeskMode(settings.deskMode);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load tickets"))
      .finally(() => setLoading(false));
  }, []);

  const isBridge = deskMode === "bridge";

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (filterStatus && t.status !== filterStatus) return false;
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterType && t.type !== filterType) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!t.number.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [tickets, search, filterStatus, filterPriority, filterType]);

  const open = tickets.filter((t) => !["resolved", "closed", "cancelled"].includes(t.status)).length;
  const breached = tickets.filter((t) => t.slaBreached).length;
  const critical = tickets.filter((t) => t.priority === "critical" && !["resolved", "closed"].includes(t.status)).length;

  const statuses = useMemo(() => [...new Set(tickets.map((t) => t.status))], [tickets]);
  const types = useMemo(() => [...new Set(tickets.map((t) => t.type))], [tickets]);

  const hasFilters = search || filterStatus || filterPriority || filterType;

  return (
    <PageContainer>
      <PageHeader
        title={isBridge ? "Work Bridge" : "Tickets"}
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
                <Link href="/tickets/new"><Plus size={14} className="mr-1" />Internal ticket</Link>
              </Button>
            </div>
          ) : (
            <Button size="sm" asChild>
              <Link href="/tickets/new"><Plus size={14} className="mr-1" />New work item</Link>
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

      {/* Portal banner */}
      {company && (
        <div className="mb-5 rounded-[10px] border border-border bg-surface px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Ticket size={15} className="text-primary flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold">Customer portal</p>
              <a
                href={`https://${company.slug || company.id}.ticket.zerpa.co.za`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary font-mono hover:underline flex items-center gap-1"
              >
                {(company.slug || company.id)}.ticket.zerpa.co.za
                <ExternalLink size={10} />
              </a>
            </div>
          </div>
          <Link href="/settings/ticketing">
            <Button size="sm" variant="outline">
              <Settings size={13} className="mr-1" />
              Configure desk
            </Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      {tickets.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatsCard title="Open" value={String(open)} icon={Ticket} />
          <StatsCard title="SLA breached" value={String(breached)} icon={AlertTriangle} />
          <StatsCard title="Critical" value={String(critical)} icon={Clock} />
        </div>
      )}

      {/* Filters */}
      {tickets.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-fg" />
            <Input placeholder="Search by number or subject…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-8 text-sm pl-8" />
          </div>
          <select
            className="border border-border rounded-[8px] px-3 py-1 text-sm bg-background h-8"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="border border-border rounded-[8px] px-3 py-1 text-sm bg-background h-8"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All priorities</option>
            {["critical", "high", "medium", "low"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            className="border border-border rounded-[8px] px-3 py-1 text-sm bg-background h-8"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All types</option>
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {hasFilters && (
            <Button size="sm" variant="outline" onClick={() => { setSearch(""); setFilterStatus(""); setFilterPriority(""); setFilterType(""); }}>
              Clear
            </Button>
          )}
        </div>
      )}

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
          <div className="lg:col-span-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-fg py-8 text-center">No tickets match the current filters.</p>
            ) : (
              <div className="rounded-[12px] border border-border overflow-hidden">
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
                    {filtered.map((t) => (
                      <tr
                        key={t.id}
                        className={`border-t border-border hover:bg-surface cursor-pointer ${PRIORITY_BORDER[t.priority] || ""}`}
                        onClick={() => setSelected(t)}
                      >
                        <td className="px-4 py-3">
                          <Link href={`/tickets/${t.id}`} className="font-mono text-primary hover:underline" onClick={(e) => e.stopPropagation()}>
                            {t.number}
                          </Link>
                          <p className="text-foreground mt-0.5 line-clamp-1">{t.subject}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium capitalize ${t.priority === "critical" ? "text-danger" : t.priority === "high" ? "text-warning" : "text-muted-fg"}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={t.status.toUpperCase()} />
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {t.slaBreached ? (
                            <span className="text-danger font-medium">Breached</span>
                          ) : t.slaResolveBy ? (
                            <span className="text-muted-fg">{new Date(t.slaResolveBy).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-muted-fg">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 uppercase text-xs text-muted-fg">{t.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
