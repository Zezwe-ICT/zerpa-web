"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Download, Filter, Plus, Timer, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { PageContainer } from "@/components/layouts/page-container";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatsCard } from "@/components/ui/stats-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { listTickets, listTimeEntries, logTime } from "@/lib/api/msp";
import { formatCurrency } from "@/lib/utils/currency";
import type { MspTicket } from "@zerpa/shared-types";

type TimeRow = {
  id: string;
  ticketId: string;
  ticketNumber?: string;
  minutes: number;
  billable: boolean;
  note?: string;
  workDate: string;
  createdAt: string;
};

function fmt(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TimePage() {
  const [rows, setRows] = useState<TimeRow[]>([]);
  const [tickets, setTickets] = useState<MspTicket[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterBillable, setFilterBillable] = useState<"" | "yes" | "no">("");
  const [filterTicket, setFilterTicket] = useState("");

  // Manual log form
  const [showForm, setShowForm] = useState(false);
  const [logTicketId, setLogTicketId] = useState("");
  const [logMinutes, setLogMinutes] = useState("60");
  const [logBillable, setLogBillable] = useState(true);
  const [logNote, setLogNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Running timer
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerTicketId, setTimerTicketId] = useState("");

  async function reload() {
    setLoading(true);
    try {
      const [entries, tix] = await Promise.all([listTimeEntries(), listTickets()]);
      setRows(entries as TimeRow[]);
      setTickets(tix);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  // Timer tick
  useEffect(() => {
    if (!timerRunning) return;
    const t = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [timerRunning]);

  async function stopTimer() {
    setTimerRunning(false);
    const minutes = Math.max(1, Math.round(timerSeconds / 60));
    if (!timerTicketId) {
      toast.error("Select a ticket before stopping the timer");
      setTimerRunning(true);
      return;
    }
    try {
      await logTime(timerTicketId, { minutes, billable: true });
      toast.success(`Logged ${fmt(minutes)} to ${timerTicketId}`);
      setTimerSeconds(0);
      setTimerTicketId("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save time");
    }
  }

  async function handleLog(e: React.FormEvent) {
    e.preventDefault();
    if (!logTicketId) return toast.error("Select a ticket");
    setSubmitting(true);
    try {
      await logTime(logTicketId, {
        minutes: parseInt(logMinutes, 10),
        billable: logBillable,
        note: logNote || undefined,
      });
      toast.success("Time logged");
      setShowForm(false);
      setLogTicketId("");
      setLogMinutes("60");
      setLogBillable(true);
      setLogNote("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterDate && !r.workDate.startsWith(filterDate)) return false;
      if (filterBillable === "yes" && !r.billable) return false;
      if (filterBillable === "no" && r.billable) return false;
      if (filterTicket) {
        const q = filterTicket.toLowerCase();
        if (!r.ticketNumber?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [rows, filterDate, filterBillable, filterTicket]);

  const totalMinutes = filtered.reduce((s, r) => s + r.minutes, 0);
  const billableMinutes = filtered.filter((r) => r.billable).reduce((s, r) => s + r.minutes, 0);
  const nonBillableMinutes = totalMinutes - billableMinutes;
  const billableValue = (billableMinutes / 60) * 450;

  // Group by date for display
  const byDate = useMemo(() => {
    const map = new Map<string, TimeRow[]>();
    for (const r of filtered) {
      const d = r.workDate || r.createdAt?.slice(0, 10) || "Unknown";
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(r);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const openTickets = tickets.filter((t) => !["closed", "resolved"].includes(t.status));

  return (
    <PageContainer>
      <PageHeader
        title="Time"
        subtitle="Billable and non-billable technician time"
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
              <Plus size={14} className="mr-1" />
              Log time
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total time" value={fmt(totalMinutes)} icon={Clock} />
        <StatsCard title="Billable" value={fmt(billableMinutes)} icon={TrendingUp} />
        <StatsCard title="Non-billable" value={fmt(nonBillableMinutes)} icon={Filter} />
        <StatsCard title="Billable value" value={formatCurrency(billableValue)} icon={TrendingUp} />
      </div>

      {/* Timer bar */}
      <div className="rounded-[12px] border border-border bg-surface p-4 mb-4 flex flex-wrap items-center gap-3">
        <Timer size={18} className="text-primary shrink-0" />
        <div className="font-mono text-lg font-semibold tabular-nums w-20">
          {String(Math.floor(timerSeconds / 3600)).padStart(2, "0")}:
          {String(Math.floor((timerSeconds % 3600) / 60)).padStart(2, "0")}:
          {String(timerSeconds % 60).padStart(2, "0")}
        </div>
        <select
          className="flex-1 min-w-[180px] border border-border rounded-[8px] px-3 py-1.5 text-sm bg-background"
          value={timerTicketId}
          onChange={(e) => setTimerTicketId(e.target.value)}
        >
          <option value="">Select ticket…</option>
          {openTickets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.number} · {t.subject}
            </option>
          ))}
        </select>
        {!timerRunning ? (
          <Button size="sm" onClick={() => setTimerRunning(true)} disabled={!timerTicketId && timerSeconds === 0}>
            Start
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={stopTimer}>
            Stop &amp; log
          </Button>
        )}
        {timerSeconds > 0 && !timerRunning && (
          <Button size="sm" variant="ghost" onClick={() => setTimerSeconds(0)}>
            Reset
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-fg whitespace-nowrap">Date</Label>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="h-8 text-sm w-36"
          />
          {filterDate && (
            <Button size="sm" variant="ghost" onClick={() => setFilterDate("")}>
              <X size={12} />
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-fg whitespace-nowrap">Ticket</Label>
          <Input
            placeholder="T-0001…"
            value={filterTicket}
            onChange={(e) => setFilterTicket(e.target.value)}
            className="h-8 text-sm w-28"
          />
        </div>
        <select
          className="border border-border rounded-[8px] px-3 py-1 text-sm bg-background h-8"
          value={filterBillable}
          onChange={(e) => setFilterBillable(e.target.value as "" | "yes" | "no")}
        >
          <option value="">All entries</option>
          <option value="yes">Billable only</option>
          <option value="no">Non-billable only</option>
        </select>
        {(filterDate || filterBillable || filterTicket) && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFilterDate("");
              setFilterBillable("");
              setFilterTicket("");
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Log form */}
      {showForm && (
        <form
          onSubmit={handleLog}
          className="rounded-[12px] border border-border bg-surface p-4 space-y-3 mb-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm">Log time manually</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
              <X size={14} />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Ticket *</Label>
              <select
                className="mt-1 w-full border border-border rounded-[8px] px-3 py-2 text-sm bg-background"
                value={logTicketId}
                onChange={(e) => setLogTicketId(e.target.value)}
                required
              >
                <option value="">Select ticket…</option>
                {openTickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.number} · {t.subject.slice(0, 60)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Minutes *</Label>
              <Input
                type="number"
                min="1"
                value={logMinutes}
                onChange={(e) => setLogMinutes(e.target.value)}
                className="mt-1 h-9 text-sm"
                required
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="log-billable"
              checked={logBillable}
              onChange={(e) => setLogBillable(e.target.checked)}
              className="w-4 h-4"
            />
            <Label htmlFor="log-billable" className="text-sm cursor-pointer">
              Billable
            </Label>
          </div>
          <div>
            <Label className="text-xs">Note</Label>
            <Input
              placeholder="What was done…"
              value={logNote}
              onChange={(e) => setLogNote(e.target.value)}
              className="mt-1 h-9 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving…" : "Log time"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Time entries grouped by date */}
      {loading && <p className="text-sm text-muted-fg py-8 text-center">Loading time entries…</p>}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-fg">
          <Clock size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No time entries</p>
          <p className="text-sm mt-1">Log time on a ticket or use the timer above.</p>
        </div>
      )}

      {byDate.map(([date, entries]) => {
        const dayTotal = entries.reduce((s, r) => s + r.minutes, 0);
        const dayBillable = entries.filter((r) => r.billable).reduce((s, r) => s + r.minutes, 0);
        return (
          <div key={date} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">{date}</h3>
              <span className="text-xs text-muted-fg">
                {fmt(dayTotal)} · {fmt(dayBillable)} billable
              </span>
            </div>
            <div className="rounded-[12px] border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface text-xs uppercase tracking-wide text-muted-fg">
                  <tr>
                    <th className="text-left px-4 py-2.5">Ticket</th>
                    <th className="text-left px-4 py-2.5">Time</th>
                    <th className="text-left px-4 py-2.5">Type</th>
                    <th className="text-left px-4 py-2.5">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((row) => (
                    <tr key={row.id} className="border-t border-border hover:bg-surface/50">
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-primary">{row.ticketNumber || row.ticketId.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-2.5 font-medium">{fmt(row.minutes)}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={row.billable ? "BILLABLE" : "NON-BILLABLE"} />
                      </td>
                      <td className="px-4 py-2.5 text-muted-fg">{row.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </PageContainer>
  );
}
