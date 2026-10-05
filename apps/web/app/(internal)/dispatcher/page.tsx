"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, RefreshCw, User, Users } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatsCard } from "@/components/ui/stats-card";
import { getDispatcherBoard, listTickets, transitionTicket, type DispatcherBoard } from "@/lib/api/msp";
import { apiRequest } from "@/lib/api/client";
import { ZerpaLoader } from "@/components/brand/zerpa-loader";
import type { MspTicket } from "@zerpa/shared-types";

function fmt(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function priorityColor(priority: string) {
  if (priority === "critical") return "border-l-4 border-l-danger";
  if (priority === "high") return "border-l-4 border-l-warning";
  return "";
}

export default function DispatcherPage() {
  const [board, setBoard] = useState<DispatcherBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigningTicket, setAssigningTicket] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");

  async function reload() {
    try {
      setBoard(await getDispatcherBoard());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    }
  }

  async function refresh() {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  }

  useEffect(() => {
    reload().finally(() => setLoading(false));
    // Auto-refresh every 60 seconds
    const t = setInterval(reload, 60_000);
    return () => clearInterval(t);
  }, []);

  async function assignTicket(ticketId: string, assigneeId: string) {
    try {
      await apiRequest(`/msp/tickets/${ticketId}`, {
        method: "PATCH",
        body: { assigneeId: assigneeId || null },
      });
      toast.success("Ticket assigned");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to assign");
    } finally {
      setAssigningTicket(null);
    }
  }

  if (loading) {
    return (
      <PageContainer>
        <ZerpaLoader title="Loading the board" messages={["Fetching open tickets…", "Calculating SLA status…"]} />
      </PageContainer>
    );
  }

  const slaBreachedTotal = (board?.columns || []).reduce((s, c) => s + c.slaBreached, 0);
  const totalBillableMin = (board?.columns || []).reduce((s, c) => s + c.billableMinutes, 0);

  const assignees = (board?.columns || []).filter((c) => c.assigneeId).map((c) => ({
    id: c.assigneeId!,
    name: c.assigneeName,
  }));

  // Filter tickets across all columns for display
  const columns = (board?.columns || []).map((col) => ({
    ...col,
    tickets: col.tickets.filter((t) => {
      if (filterPriority && t.priority !== filterPriority) return false;
      if (filterStatus && t.status !== filterStatus) return false;
      return true;
    }),
  }));

  return (
    <PageContainer className="max-w-none">
      <div className="px-4 md:px-6">
        <PageHeader
          title="Dispatcher"
          subtitle={`${board?.openTickets ?? 0} open · ${board?.unassignedCount ?? 0} unassigned · ${slaBreachedTotal} SLA breached`}
          action={
            <Button size="sm" variant="outline" onClick={refresh} disabled={refreshing}>
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              <span className="ml-1">Refresh</span>
            </Button>
          }
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <StatsCard title="Open tickets" value={String(board?.openTickets ?? 0)} icon={Clock} />
          <StatsCard title="Unassigned" value={String(board?.unassignedCount ?? 0)} icon={User} />
          <StatsCard title="SLA breached" value={String(slaBreachedTotal)} icon={AlertTriangle} />
          <StatsCard title="Billable time" value={fmt(totalBillableMin)} icon={Users} />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            className="border border-border rounded-[8px] px-3 py-1.5 text-sm bg-background"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            className="border border-border rounded-[8px] px-3 py-1.5 text-sm bg-background"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In progress</option>
            <option value="waiting">Waiting</option>
          </select>
          {(filterPriority || filterStatus) && (
            <Button size="sm" variant="outline" onClick={() => { setFilterPriority(""); setFilterStatus(""); }}>
              Clear
            </Button>
          )}
        </div>

        {/* Kanban columns */}
        <div className="flex gap-4 overflow-x-auto pb-6 -mx-4 md:-mx-6 px-4 md:px-6">
          {columns.map((col) => (
            <div
              key={col.assigneeId || "unassigned"}
              className="min-w-[280px] max-w-[300px] flex-shrink-0 rounded-[12px] border border-border bg-surface"
            >
              {/* Column header */}
              <div className="p-3 border-b border-border">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {col.assigneeName}
                    </p>
                    <p className="text-xs text-muted-fg mt-0.5">
                      {col.openCount} open · {fmt(col.billableMinutes)} billable
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {col.slaBreached > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-danger bg-danger/10 rounded px-1.5 py-0.5">
                        <AlertTriangle size={10} />
                        {col.slaBreached} SLA
                      </span>
                    )}
                    {!col.assigneeId && (
                      <span className="text-xs text-muted-fg italic">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tickets */}
              <ul className="p-2 space-y-2 max-h-[70vh] overflow-y-auto">
                {col.tickets.map((t) => (
                  <li
                    key={t.id}
                    className={`rounded-[8px] border border-border bg-background p-3 text-sm space-y-2 ${priorityColor(t.priority)}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/tickets/${t.id}`} className="font-mono text-xs text-primary hover:underline font-medium">
                        {t.number}
                      </Link>
                      <span className="text-[10px] uppercase tracking-wide font-medium text-muted-fg shrink-0">
                        {t.priority}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-foreground leading-snug">{t.subject}</p>
                    <div className="flex flex-wrap gap-1 items-center">
                      <StatusBadge status={t.status.toUpperCase()} />
                      {t.slaRespondBy && new Date(t.slaRespondBy) < new Date() && (
                        <span className="text-[10px] text-danger font-medium">SLA!</span>
                      )}
                    </div>
                    {/* Assign button */}
                    {assignees.length > 0 && (
                      <div>
                        {assigningTicket === t.id ? (
                          <div className="flex gap-1">
                            <select
                              className="flex-1 border border-border rounded-[6px] px-2 py-1 text-xs bg-background"
                              defaultValue=""
                              onChange={(e) => {
                                if (e.target.value) assignTicket(t.id, e.target.value);
                              }}
                            >
                              <option value="">Assign to…</option>
                              {assignees.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name}
                                </option>
                              ))}
                              <option value="">Unassign</option>
                            </select>
                            <Button size="sm" variant="ghost" onClick={() => setAssigningTicket(null)}>
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs h-6 px-2 w-full justify-start text-muted-fg"
                            onClick={() => setAssigningTicket(t.id)}
                          >
                            <User size={10} className="mr-1" />
                            {t.assigneeId ? "Reassign" : "Assign"}
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
                {col.tickets.length === 0 && (
                  <li className="text-xs text-muted-fg text-center py-6 italic">
                    {filterPriority || filterStatus ? "No matching tickets" : "No open work"}
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
